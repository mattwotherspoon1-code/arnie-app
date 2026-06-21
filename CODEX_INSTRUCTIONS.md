# CODEX INSTRUCTIONS — Arnie Gym App

## What this app does
Arnie is a mobile-first PWA (Progressive Web App) gym coaching assistant. It has four core features:
1. **Onboarding via AI chat** — Arnie asks the user 7 questions and generates a personalised training program using the Anthropic Claude API
2. **Session tracker** — Users start a session, check off sets, log weight and reps per set, and use a rest timer
3. **Weight history** — Every session's weights are saved to localStorage. Users can view per-exercise history
4. **AI chat** — Users can ask Arnie questions mid-session or anytime

## Framework
- **React 18** with Vite
- **No UI library** — all styles are inline JavaScript objects
- **PWA** via vite-plugin-pwa (service worker + manifest auto-generated)
- **No backend** — app calls Anthropic API directly from the browser (via claude.ai proxy when running inside Claude artifacts)

## How to run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173

## How to build for production
```bash
npm run build
npm run preview
```

## Important files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire app — all screens, state, logic |
| `src/main.jsx` | React entry point + service worker registration |
| `index.html` | HTML shell with PWA meta tags |
| `vite.config.js` | Vite + PWA plugin config |
| `public/icons/` | App icons (192, 512, apple-touch) |
| `vercel.json` | SPA routing fix for Vercel |

## What NOT to change
- The `ARNIE_SYSTEM` prompt string in App.jsx — this controls Arnie's personality and the program JSON format. Changes here will break program auto-population
- The `<PROGRAM>` tag parsing logic — the regex `/<PROGRAM>([\s\S]*?)<\/PROGRAM>/` must match exactly what the AI outputs
- The `LS` localStorage helper — all persistence depends on this
- The `C` color token object — changing these will break the entire visual system
- Icon files in `public/icons/` — these are required for PWA install

## What you CAN improve
- **Split App.jsx into components** — currently one large file. Good first task: extract NavBar, HistoryModal, ProgressRing, SessionScreen, ChatScreen, ProgramScreen, HomeScreen into separate files in `src/components/`
- **Add a Progress tab** — chart weight over time per exercise using recharts or chart.js
- **Add notifications** — browser notifications when rest timer ends
- **Add user accounts** — replace localStorage with Supabase for cross-device sync
- **Add exercise video links** — embed YouTube links per exercise in the program JSON
- **Replace API key handling** — build a simple Express/Next.js proxy so the Anthropic key isn't exposed client-side
- **Add dark/light mode toggle**
- **Add unit toggle** — kg vs lbs

## API note
The app calls `https://api.anthropic.com/v1/messages` directly from the browser. This works inside Claude.ai artifacts because Anthropic proxies the request. If you self-host this app, you MUST add a server-side proxy. Never expose an API key in client-side code.

## How to keep the app stable
- Always test on mobile viewport (375px wide) after any UI changes
- After editing ARNIE_SYSTEM, test the full onboarding flow — confirm the JSON parses correctly
- Run `npm run build` before deploying — catch errors early
- Do not add heavy dependencies. Keep the bundle small for mobile performance

---

## STARTER PROMPT FOR CODEX

Paste this into Codex after uploading the project:

```
I have a React + Vite PWA called Arnie — an AI gym coaching app. 

The entire app lives in src/App.jsx. It uses inline styles, React hooks, localStorage for persistence, and the Anthropic Claude API for the AI chat and program generation.

Key things to know:
- Do not change the ARNIE_SYSTEM prompt or the <PROGRAM> tag parsing logic
- Do not change the LS localStorage helper
- Do not change the C color token object
- All styles are inline — there is no CSS file or Tailwind
- The app is mobile-first, max-width 430px

My first task is: [DESCRIBE WHAT YOU WANT TO BUILD OR FIX HERE]

Please make the minimum change needed to achieve this without breaking existing functionality.
```
