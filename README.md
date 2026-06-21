# Arnie — Your AI Gym Coach

A mobile-first PWA that builds personalised training programs, tracks sets and weights, and lets you chat with an AI coach mid-session.

## Stack
- React 18 + Vite
- vite-plugin-pwa (installable PWA)
- Anthropic Claude API
- localStorage (no backend required)

## Setup

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com and import the repo
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

## Install as iPhone app

1. Open the Vercel URL in Safari
2. Tap Share
3. Tap Add to Home Screen
4. Tap Add

## API Note

The app calls the Anthropic API from the browser. This works on Vercel because the API is called client-side. For production apps with real users, add a server-side proxy to protect your API key.

## Project structure

```
arnie-app/
├── public/
│   ├── favicon.ico
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
├── src/
│   ├── main.jsx
│   └── App.jsx
├── index.html
├── vite.config.js
├── package.json
├── vercel.json
├── .gitignore
├── .env.example
└── CODEX_INSTRUCTIONS.md
```
