# EnergiChain — Prototype Static Site

This folder contains a static prototype showcasing the requested EnergiChain features. Each feature has its own page under `features/` and a lightweight backend stub under `backend/`.

How it's organized:
- `index.html` — landing page
- `styles.css` — black & white theme for consistent look
- `features/*.html` — one page per feature
- `backend/*.js` — backend stubs, imported dynamically by `main.js`

Open `website/index.html` in a browser to explore.

Notes:
- Integrations that would cost real money (WhatsApp Business API, real blockchain minting, traffic APIs, IoT integrations) are simulated by lightweight backend stubs. Backend files are named exactly as the feature (e.g. `carbon-token.js`).
- Next steps: wire up real services, add secure backend endpoints, and implement authentication & payment rails.

Quality gates:
- This is a static site; no build is required. Works offline.

