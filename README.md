# EnergiChain Website

Modern blockchain-powered LPG ecosystem platform.

## 🚀 How to Run

### Option 1: Using Node.js (Recommended - buttons will work!)

```powershell
# Navigate to website folder
cd website

# Start the server
node server.js
```

Then open: **http://localhost:3000**

### Option 2: Using Python

```powershell
cd website
python -m http.server 8000
```

Then open: **http://localhost:8000**

### Option 3: Using VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

## ⚠️ Important

**Buttons won't work if you open the HTML file directly** (double-click) because JavaScript modules require a web server. Use one of the methods above.

## 🎯 Features

All features are fully interactive with:
- 📊 Live charts and graphs
- 🔄 Digital twin 3D visualization
- 📈 Real-time data updates
- 🌐 Blockchain transaction tracking
- 🤖 AI/ML analytics

## 📁 Structure

```
website/
├── index.html              - Landing page
├── server.js               - Local development server
├── styles.css              - Modern dark theme
├── main.js                 - Interactive module loader
├── features/               - Feature pages
│   ├── index.html         - Dashboard
│   ├── nft-cylinder.html  - Digital twin visualization
│   ├── pricing-oracle.html - Live price charts
│   └── ...
└── backend/                - Backend stubs and implementations
    ├── nft.js
    ├── oracle.js
    ├── ml-forecast.js
    ├── cv-safety.js
    ├── mpesa.js
    └── qrcode-verifier.js
```
