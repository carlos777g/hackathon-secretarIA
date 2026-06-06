# AGENTS.md

## Project

Hackathon project: **Derrama Economica CDMX** — economic impact analysis dashboard for Mexico City events. React + Vite frontend only (no backend in this repo).

## Commands (run from `frontend/`)

```bash
pnpm dev      # dev server (Vite, HMR on localhost:5173)
pnpm build    # production build to dist/
pnpm preview  # preview production build
pnpm lint     # ESLint (flat config)
```

## Architecture

- App entry: `frontend/src/main.jsx` → `App.jsx` → `Dashboard.jsx` (single page, no router)
- No TypeScript, no store, no state management (plain `useState`)
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` or PostCSS config needed)
- Charts via Recharts, icons via lucide-react
- Hardcoded placeholder data until backend is wired up
- API URL: `POST http://localhost:3000/api/analyze` (set in `Dashboard.jsx:10`)
- Spanish UI

## Conventions

- pnpm is the package manager (lockfile v9)
- ESLint flat config (`eslint.config.js`)
- No tests, no CI
- Root-level `.gititgnore` is for Python/Streamlit (legacy), `frontend/.gitignore` is active

## Gotchas

- Root `README.md` describes a Streamlit/Python app that no longer exists — ignore it
- All source lives under `frontend/`; root level has no application code
- Tailwind v4: use `@import 'tailwindcss'` in CSS, not `@tailwind` directives
- No test framework installed; don't try `test` or `vitest` commands
