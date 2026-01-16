# Deploy & Run Guide

This guide shows how to run this Vite + React app locally and build for production. It's written for beginners and covers Windows, macOS, and Linux.

## Prerequisites

- Node.js (recommended: Node 18 or 20). Use the official installer or `nvm`/`nvm-windows`.
- Git (to clone the repo) or copy the project folder onto the target machine.

## Quick steps (summary)

1. Clone or copy the project to your machine.
2. Install dependencies: `npm install`.
3. Start dev server: `npm run dev` (opens at http://localhost:3000/).
4. Build for production: `npm run build` and preview with `npm run preview` or serve the `dist/` directory with a static server.

## Detailed instructions

1) Clone the repo

```bash
git clone <repo-url> my-app
cd my-app
```

2) Install Node.js (if you don't have it)

- macOS / Linux: install `nvm` then `nvm install --lts` and `nvm use --lts`.
- Windows: use the Node.js installer from nodejs.org or `nvm-windows`.

3) Install dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

If PowerShell blocks `npm` (execution policy), run the same command in Command Prompt (cmd.exe):

```powershell
# from PowerShell you can run cmd explicitly
cmd /c "npm install"
```

4) Start the dev server

```bash
npm run dev
```

Vite will print a Local and Network URL (by default `http://localhost:3000/`). Open that in your browser.

5) Environment variables (API keys)

The project calls a Gemini API from `services/geminiService.ts`. That file expects an environment variable named `API_KEY` when running the code:

- Current file usage: `process.env.API_KEY` (this may require a small change to expose to the browser safely — see Notes).

To provide an API key for local development you can:

- Option A (temporary, in a single terminal session):

  - Windows CMD:

    ```cmd
    set API_KEY=your_api_key_here
    npm run dev
    ```

  - PowerShell (temporary for that session):

    ```powershell
    $env:API_KEY = 'your_api_key_here'
    npm run dev
    ```

  - macOS / Linux:

    ```bash
    export API_KEY=your_api_key_here
    npm run dev
    ```

- Option B (recommended for Vite): create a `.env.local` file and add a prefixed variable (Vite only exposes variables that start with `VITE_`):

  ```text
  VITE_API_KEY=your_api_key_here
  ```

  Then update `services/geminiService.ts` to read `import.meta.env.VITE_API_KEY` instead of `process.env.API_KEY` (or create a small server proxy to keep keys secret). If you'd like, I can patch this file for you.

Security note: embedding secret API keys directly into client-side code is unsafe — anyone using the app can view the key. For production, move API calls to a server-side endpoint and keep keys on the server.

6) Build for production

```bash
npm run build

# then preview locally
npm run preview
```

`npm run preview` serves the built `dist/` folder so you can verify the production build locally.

7) Serve production statically

You can serve `dist/` with any static server. Example using `serve`:

```bash
npm install -g serve
serve -s dist
```

## Common issues & troubleshooting

- PowerShell execution policy blocks `npm`: run `cmd /c "npm install"` or run PowerShell as Admin and adjust policy (not recommended for beginners). Using `cmd` is simplest.
- App can't reach Gemini API / returns errors: ensure your `API_KEY` is set and that the code actually reads the variable you created (see the `.env.local` note above).
- Port already in use: Vite defaults to port 3000. If it's occupied, Vite will try the next port or you can set `PORT=3001` in environment before starting.
- Network access: to open the app on other devices, ensure firewall allows the port and use the Network URL printed by Vite.

## Optional: Make a minimal server proxy (recommended)

To avoid exposing API keys to the browser, run a tiny server-side proxy (example Node/Express):

1. Create `server/index.js` with an endpoint `/api/gen` that forwards requests to the Gemini API using the server's `process.env.API_KEY`.
2. Start this server locally (on a different port) and have the React app call `/api/gen` instead of calling Gemini directly.

If you want, I can scaffold this proxy and update the app to use it.

---

If you'd like, I can also:

- Patch `services/geminiService.ts` to read `import.meta.env.VITE_API_KEY` and add `.env.local` sample.
- Add a tiny Express proxy example and demonstrate local usage.

Tell me which option you prefer and I will implement it.
