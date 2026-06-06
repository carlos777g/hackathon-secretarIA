# Derrama Económica CDMX — Dashboard de Inteligencia Económica

An interactive web dashboard designed to estimate, analyze, and visualize the incremental economic impact of massive events in Mexico City (CDMX). The tool implements a sociodemographic segmentation model to isolate tourism expenditure spikes, prevent spending substitution bias, and assess local commercial benefits across various economic sectors.

---

## Architecture & Project Status

* **Frontend-Only Repository:** The current application logic and UI are implemented as a React single-page application (SPA) powered by Vite.
* **Decoupled Architecture:** No backend services are hosted in this repository. The frontend is built to consume an external analytical engine endpoint.
* **Stack:** React, Tailwind CSS v4, Recharts, and Lucide React.

---

## Project Structure

All active source code lives under the `frontend/` directory. Root-level configuration files manage repository metadata and tracking.

```text
.
├── .gitignore          # Root tracker (Handles Python, Node.js, and React exclusions)
├── AGENTS.md           # Model directives and current environment state
├── README.md           # This file
└── frontend/           # Active application workspace
    ├── .gitignore      # Frontend specific untracked files
    ├── index.html
    ├── package.json
    ├── pnpm-lock.yaml  # V9 lockfile
    ├── vite.config.js  # Vite orchestration with Tailwind v4 integration
    ├── eslint.config.js# ESLint flat configuration file
    └── src/
        ├── main.jsx    # Application entrypoint
        ├── App.jsx
        ├── index.css   # Global styles incorporating Tailwind v4 directives
        └── components/
            └── Dashboard.jsx # Analytical core dashboard interface
