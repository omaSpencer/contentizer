# Contentizer – AI Text Optimizer

macOS desktop app: paste or type text, choose a **Category** and **Style**, add optional instructions, and get an optimized version via an LLM (OpenAI-compatible API).

**Stack:** Tauri v2 + React + Vite + TypeScript + TailwindCSS.

---

## 1. Prerequisites

- **Node.js** 18+
- **Rust** (Cargo):
  - **Homebrew (ajánlott):** `brew install rust`
  - Vagy rustup: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (ne használd sudo-t)
- **macOS** (target platform)

---

## 2. Setup

### Create the project (already done if you have this repo)

If starting from scratch:

```bash
mkdir contentizer && cd contentizer
npm create vite@latest . -- --template react-ts
npm install
npm install -D @tauri-apps/cli@latest tailwindcss @tailwindcss/vite
npm install @tauri-apps/api react-router-dom
```

Then add Tauri (when prompted: app name, window title, web assets `..`, dev server `http://localhost:5173`, dev command `npm run dev`, build command `npm run build`):

```bash
npx tauri init
```

Then add Tailwind to `vite.config.ts` and `src/index.css` as in this repo, and add the Tauri scripts to `package.json` (e.g. `"tauri": "tauri"`).

### Install dependencies and run

```bash
npm install
npm run tauri dev
```

First run will compile Rust and open the app window. The frontend is served by Vite at `http://localhost:5173`.

### Makefile (egyszerű parancsok)

A projekt tartalmaz egy `Makefile`-t, így rövidebb parancsokkal is futtatható:

| Parancs | Mit csinál |
|---------|------------|
| `make` / `make help` | Kiírja az elérhető parancsokat |
| `make install` | `npm install` |
| `make dev` | Tauri dev szerver (`.env` fallback támogatott devben) |
| `make build` | Production build (frontend + Rust) |
| `make clean` | Törli a `node_modules`, `dist` és a Rust `target` mappát |
| `make lint` | ESLint |
| `make check-rust` | Megnézi, hogy a Cargo a PATH-on van-e |

Példa:

```bash
make install   # egyszer
make dev       # minden alkalommal
```

### First-run API key setup

On first launch, the app asks for an OpenAI-compatible API key in a setup modal.  
The key is stored in macOS Keychain and reused on next launches.

In local development, there is a fallback: if Keychain has no key, debug builds can use `CONTENTIZER_API_KEY` from environment (for example via `make dev` + `.env`).

Example `.env` for local dev fallback:

```bash
CONTENTIZER_API_KEY=sk-...
```

Runtime defaults are hardcoded in backend:

- model: `gpt-4o-mini`
- language: `Hungarian`
- input max: `4000` chars
- output max guidance: `1200` chars
- daily quota: `20` requests/day
- strict safety global prompt is hardcoded

The key is never stored in the frontend; it is read/used only in the Tauri backend.

---

## 3. Project structure

```
contentizer/
├── src/                      # Frontend (React + Vite)
│   ├── components/           # TopBar, HistoryList, ...
│   ├── pages/                # Optimize, History
│   ├── types.ts
│   ├── tauri.ts              # Tauri invoke wrappers
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                # Backend (Rust)
│   ├── src/
│   │   ├── commands.rs       # Tauri commands (optimize_text, get_settings, …)
│   │   ├── llm.rs            # LLMClient trait + OpenAI-compatible client
│   │   └── presets.rs        # Default categories/styles
│   ├── presets.json          # Reference presets (editable for future use)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── README.md
```

---

## 4. Features (MVP)

- **Optimize:** Single textarea workflow with settings popup (Category/Style + extra instructions), Optimize button, Copy feedback, Regen limit.
- **History:** Last ~20 requests stored locally (Tauri store plugin).
- **Runtime config:** API key via Keychain (or dev env fallback), model/language/limits/prompt are hardcoded defaults.

---

## 5. Security

- API key is never hardcoded in source.
- API key is stored in macOS Keychain after first-run setup.
- In debug mode only, `.env` (`CONTENTIZER_API_KEY`) can be used as fallback when Keychain is empty.
- Model, language, safety prompt, and limits are hardcoded backend defaults.

---

## 6. Presets

Default categories: Email, LinkedIn, SEO, Support, Product description, Resume/CV.  
Default styles: Formal, Friendly, Concise, Persuasive, Technical, Casual.

Presets are defined in `src-tauri/src/presets.rs` and mirrored in `src-tauri/presets.json` for reference. To support user-editable presets later, you can load from a file in the app data dir.

---

## 7. macOS notes

- **Signing:** For distribution, configure code signing in `tauri.conf.json` and use Apple Developer credentials. Not required for local `tauri dev` or `tauri build`.
- **Icons:** `bundle.icon` is set to `[]` so the app builds without custom icons. To add icons: add a 1024×1024 PNG and run `npm run tauri icon path/to/icon.png`.

---

## 8. Build for production

```bash
npm run tauri build
```

Output is under `src-tauri/target/release/bundle/` (e.g. `.app` for macOS).
