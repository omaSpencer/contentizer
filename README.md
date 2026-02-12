# Contentizer – AI Text Optimizer

macOS desktop app: paste or type text, choose a **Category** and **Style**, add optional instructions, and get an optimized version via an LLM (OpenAI-compatible API).

**Stack:** Tauri v2 + React + Vite + TypeScript + TailwindCSS.

---

## 1. Prerequisites

- **Node.js** 18+
- **Rust** (e.g. `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
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

### API key (required for Optimize)

1. **Settings** tab → choose **API key mode**: **Environment variable (dev)**.
2. Set your OpenAI (or OpenAI-compatible) API key in the environment before starting the app:

   ```bash
   export CONTENTIZER_API_KEY="sk-..."
   npm run tauri dev
   ```

The key is never stored in the app or sent to the frontend; it is read only in the Tauri backend.

---

## 3. Project structure

```
contentizer/
├── src/                      # Frontend (React + Vite)
│   ├── components/           # TopBar, PresetSelector, TextAreas, HistoryList
│   ├── pages/                # Optimize, History, Settings
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

- **Optimize:** Input text, Category + Style dropdowns, optional extra instructions → “Optimize” → output with Copy / Clear / Swap.
- **History:** Last ~20 requests stored locally (Tauri store plugin).
- **Settings:** Provider mode (env or keychain), optional API base URL and model. Key is never stored in frontend; env or Keychain only.

---

## 5. Security

- API key is **never** hardcoded or exposed to the frontend.
- **Env mode:** key is read from `CONTENTIZER_API_KEY` in the process environment.
- **Keychain mode:** placeholder for future; use `tauri-plugin-keychain` to store/retrieve the key on macOS.

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
