# OrbitTasks — a GitHub-backed advanced todo app

An advanced React todo app where **your data lives in a GitHub repository you own** — no database, no backend server, and no `localStorage`. Every change is committed as a JSON file to your repo through the GitHub REST Contents API, and the app reads it back from there. The repo coordinates come from `appsettings.json` and the access token from an environment variable.

## Features

- **GitHub is the database** — tasks are stored as a JSON file in a separate repo you control, committed on every change. No `localStorage`, no cache.
- **Rich hyperlinks** — attach multiple labelled links to any task, and raw URLs pasted into notes become clickable automatically.
- **Priorities, tags, due dates** — with overdue / due-today highlighting and live stats + progress bar.
- **Powerful toolbar** — full-text search, status filters, priority/tag filters, and multiple sort modes.
- **Drag-and-drop reordering** (in manual sort mode).
- **Inline editing** with keyboard shortcuts (`Ctrl/Cmd+Enter` to save, `Esc` to cancel).
- **Offline-friendly** — a local cache keeps the app usable and re-syncs when you're back online.
- **Auto-sync with debounce** or manual push, plus pull, JSON import/export backup.
- **Dark / light themes** with a modern glassmorphism UI.

## Quick start

```powershell
npm install
npm run dev
```

Configure the data repo in `appsettings.json` and the token in `.env` (see below).

## Connecting your GitHub data repository

All configuration lives in **two files** — nothing is entered in the UI and nothing is stored in `localStorage`.

1. **Create a repo** to hold your data (e.g. `my-todos`). It can be private. It can be empty.
2. **Create a fine-grained Personal Access Token** at
   GitHub → Settings → Developer settings → *Fine-grained tokens*:
   - **Repository access:** only the data repo you just created.
   - **Permissions → Contents:** **Read and write**.
3. **Set the token as an environment variable.** Copy `.env.example` to `.env` and fill it in:
   ```
   VITE_GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxx
   ```
   Vite only exposes variables prefixed with `VITE_`. Restart the dev server after changing `.env`.
4. **Set the repo coordinates** in [public/appsettings.json](public/appsettings.json):
   ```json
   {
     "github": {
       "owner": "your-github-login",
       "repo": "my-todos",
       "path": "todos.json",
       "branch": "main"
     },
     "ui": { "theme": "dark" }
   }
   ```
   Because this file is served from `public/`, you can change it without rebuilding.
5. Open the app → **Connection & backup** to confirm the values and run **Test connection**. The first task you add creates the data file.

## How persistence works

- **The GitHub repo is the only storage** — there is no database and no `localStorage` cache.
- On load, the app fetches the JSON file (`GET /repos/{owner}/{repo}/contents/{path}`) and tracks its blob `sha`.
- On change, it writes the file back (`PUT …/contents/{path}`) with the tracked `sha`, so updates commit cleanly.
- A debounced queue coalesces rapid edits into single commits and serializes concurrent writes.

## Security notes

- The token is supplied via the `VITE_GITHUB_TOKEN` environment variable and sent **only to `api.github.com`** over HTTPS. `.env` is git-ignored.
- Use a **fine-grained token scoped to a single repo** with the minimum (Contents: Read and write) permission.
- ⚠️ In a client-side build, any `VITE_`-prefixed variable is **embedded into the bundle** and therefore visible in the browser. For anything beyond personal use, put a small proxy/server in front that holds the token instead.
- If a token is ever exposed, **revoke it** on GitHub immediately.

## Tech

- React 18 + Vite
- GitHub REST API (Contents) — no other dependencies

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
