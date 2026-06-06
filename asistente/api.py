"""
asistente/api.py — Backend HTTP para SECTORIA

Expone:
  POST /chat   { "message": "...", "history": [...] }
  GET  /        sirve el HTML del mini-chat

# /// script
# requires-python = ">=3.10"
# dependencies = ["anthropic", "fastapi", "uvicorn"]
# ///
"""
import os, re, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import anthropic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

# ── Reutilizar lógica de asistente_datos.py ──────────────────
import sys
sys.path.insert(0, str(Path(__file__).parent))
from asistente_datos import cargar_eventos, construir_contexto, SYSTEM_PROMPT

# ── Setup ─────────────────────────────────────────────────────
MODEL   = "claude-haiku-4-5-20251001"
client  = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
eventos = cargar_eventos()
contexto = construir_contexto(eventos)
SYSTEM  = SYSTEM_PROMPT + f"\n\nDATOS DISPONIBLES:\n{contexto}"

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Modelos ───────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

# ── Endpoints ─────────────────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest):
    messages = req.history + [{"role": "user", "content": req.message}]

    def generate():
        with client.messages.stream(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield text

    return StreamingResponse(generate(), media_type="text/plain")


@app.get("/", response_class=HTMLResponse)
async def index():
    return HTML

# ── Mini chat HTML ────────────────────────────────────────────

HTML = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  /* ── Widget flotante ── */
  #sectoria-btn {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    width: 56px; height: 56px; border-radius: 50%;
    background: #6c63ff; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(108,99,255,.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; transition: transform .2s;
  }
  #sectoria-btn:hover { transform: scale(1.1); }

  #sectoria-panel {
    position: fixed; bottom: 92px; right: 24px; z-index: 9998;
    width: 360px; height: 520px;
    background: #18181c; border: 1px solid #2e2e38;
    border-radius: 16px; display: none; flex-direction: column;
    overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,.5);
    font-family: system-ui, sans-serif;
  }
  #sectoria-panel.open { display: flex; }

  .s-header {
    padding: 14px 18px; background: #6c63ff;
    display: flex; align-items: center; gap: 10px;
    color: #fff; font-weight: 700; font-size: 15px;
  }
  .s-dot { width: 8px; height: 8px; background: #22d3a0;
    border-radius: 50%; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

  .s-messages {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .s-messages::-webkit-scrollbar { width: 4px; }
  .s-messages::-webkit-scrollbar-thumb { background: #2e2e38; border-radius: 2px; }

  .msg { max-width: 85%; padding: 10px 14px; border-radius: 14px;
    font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
  .msg.user { background: #6c63ff; color: #fff; align-self: flex-end;
    border-bottom-right-radius: 4px; }
  .msg.bot  { background: #222228; color: #e8e8f0; align-self: flex-start;
    border-bottom-left-radius: 4px; border: 1px solid #2e2e38; }
  .msg.typing { color: #7a7a8c; font-style: italic; }

  .s-input {
    display: flex; gap: 8px; padding: 12px;
    border-top: 1px solid #2e2e38; background: #18181c;
  }
  .s-input input {
    flex: 1; background: #222228; border: 1px solid #2e2e38;
    border-radius: 10px; color: #e8e8f0; padding: 9px 12px;
    font-size: 13px; outline: none;
  }
  .s-input input:focus { border-color: #6c63ff; }
  .s-input button {
    background: #6c63ff; border: none; border-radius: 10px;
    color: #fff; padding: 9px 14px; cursor: pointer; font-size: 18px;
  }
  .s-input button:hover { background: #5a52e0; }
  .s-input button:disabled { opacity: .4; cursor: not-allowed; }
</style>
</head>
<body style="margin:0;background:#0f0f11;">

<!-- Botón flotante -->
<button id="sectoria-btn" onclick="toggleChat()" title="Abrir SECTORIA">🏙️</button>

<!-- Panel de chat -->
<div id="sectoria-panel">
  <div class="s-header">
    <div class="s-dot"></div>
    SECTORIA — Derrama Económica CDMX
  </div>
  <div class="s-messages" id="messages">
    <div class="msg bot">¡Hola! Soy SECTORIA 👋 Pregúntame sobre la derrama económica de eventos en la CDMX.</div>
  </div>
  <div class="s-input">
    <input id="input" type="text" placeholder="Escribe tu pregunta..."
           onkeydown="if(event.key==='Enter') sendMsg()">
    <button id="send-btn" onclick="sendMsg()">➤</button>
  </div>
</div>

<script>
const API = '';   // mismo origen
let history = [];
let open = false;

function toggleChat() {
  open = !open;
  document.getElementById('sectoria-panel').classList.toggle('open', open);
  if (open) document.getElementById('input').focus();
}

function addMsg(text, role) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text;
  const box = document.getElementById('messages');
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return el;
}

async function sendMsg() {
  const input = document.getElementById('input');
  const btn   = document.getElementById('send-btn');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  btn.disabled = true;

  addMsg(text, 'user');
  const botEl = addMsg('...', 'bot typing');

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message: text, history })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let respuesta = '';
    botEl.classList.remove('typing');
    botEl.textContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      respuesta += chunk;
      botEl.textContent = respuesta;
      document.getElementById('messages').scrollTop = 99999;
    }

    history.push({ role: 'user',      content: text });
    history.push({ role: 'assistant', content: respuesta });
    if (history.length > 20) history = history.slice(-20);

  } catch(e) {
    botEl.textContent = '❌ Error de conexión. ¿Está corriendo el servidor?';
    botEl.classList.remove('typing');
  }

  input.disabled = false;
  btn.disabled = false;
  input.focus();
}
</script>
</body>
</html>"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5173, reload=False)