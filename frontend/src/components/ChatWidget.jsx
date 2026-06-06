import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "¡Hola! Soy SECTORIA 👋 Pregúntame sobre la derrama económica de eventos en la CDMX." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    
    // Agregamos mensaje del usuario
    const newHistory = [...messages, { role: "user", text: userText }];
    setMessages(newHistory);
    setIsLoading(true);

    // Agregamos un mensaje vacío para el bot que se irá llenando con el stream
    setMessages(prev => [...prev, { role: "bot", text: "...", isTyping: true }]);

    try {
      // Nota: Asegúrate de que tu api.py esté corriendo en el puerto 8001
      const res = await fetch("http://localhost:5173/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText, 
          history: messages
            .filter(m => !m.isTyping) // Filtramos mensajes temporales
            .map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text })) 
        })
      });

      if (!res.ok) throw new Error("Error de red");

      // Lógica para leer el Stream en tiempo real
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        botReply += decoder.decode(value);
        
        // Actualizamos el último mensaje (el del bot) letra por letra
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "bot", text: botReply, isTyping: false };
          return updated;
        });
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: "❌ Error de conexión. ¿Está corriendo el servidor en el puerto 8001?", isTyping: false };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform hover:scale-110"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Panel del Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 bg-cyan-500 px-4 py-3 text-slate-950">
            <div className="h-2 w-2 animate-pulse rounded-full bg-slate-950"></div>
            <span className="font-bold">SECTORIA AI</span>
          </div>

          {/* Área de Mensajes */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl p-3 ${
                  msg.role === "user"
                    ? "self-end bg-cyan-500 text-slate-950 rounded-br-sm font-medium"
                    : "self-start bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"
                } ${msg.isTyping ? "italic text-slate-400" : ""}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className=" border-t border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                placeholder="Pregunta algo..."
                disabled={isLoading}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={sendMsg}
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}