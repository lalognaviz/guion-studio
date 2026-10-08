# AGENTS.md — GuionStudio

Local-first desktop app: **Wails v2 (Go backend) + React 19 + TypeScript + Vite + Tailwind 3.4**.
UI strings and domain language are Spanish; keep new UI text Spanish.

## Commands (verified)

- **Typecheck**: `cd frontend && npx tsc --noEmit` — no `lint`/`format` script exists; `tsc` is the only static check.
- **Frontend tests**: `npm --prefix frontend test` (= `vitest run`) — one file, `frontend/src/App.test.tsx` (16 tests, jsdom).
- **Go tests**: `go test ./...` — `internal/store` is pure Go (no CGO, no GTK needed) and covers schema/seed/queries.
- **Verification order**: `tsc` → `vitest` → `go test`.
- **Dev (desktop, Go backend live)**: `wails dev` · **Dev (browser-only, localStorage)**: `npm --prefix frontend run dev`
  (Vite pinned to port **1420 with `strictPort`**).
- **Build**: `wails build -nsis` → `build/bin/guion-studio.exe` + `build/bin/guion-studio-amd64-installer.exe`.
- **Node ≥20.19 required for tests** (jsdom 29; crashes with `ERR_REQUIRE_ESM` on Node 18). CI uses Node 22.
- **Linux desktop dev needs** `libgtk-3-dev libwebkit2gtk-4.1-dev` (check `wails doctor`). Go ≥1.25.
- **`wails.json` sets `"build:tags": "webkit2_41"`** — Ubuntu 24.04+ ships only webkit2gtk-4.1; without this
  tag `wails build` fails with `pkg-config: webkit2gtk-4.0 not found` (the tag is a no-op on Windows/macOS).
- **Plain `go build ./...` compiles a Wails *stub*** (Wails only builds the real GTK/WebView frontend with the
  `production`/`dev` tag, which the wails CLI adds from `wails.json`). So `go build`/`go vet` verify our code
  compiles but not the cgo/webkit path — **`wails build` is the real end-to-end check** (Linux).
- Wails CLI version must match `go.mod` (currently v2.16.0): `go install github.com/wailsapp/wails/v2/cmd/wails@v2.16.0`.

## Architecture

- **Layout**: Go shell at repo root (`main.go` window+embed, `app.go` IPC methods, `internal/store` SQLite),
  frontend entirely in `frontend/`. `frontend/src/App.tsx` is only the `MemoryRouter` (routes `/`,
  `/proyecto/:id`, `/tablero/:id`, `/tablero/:id/acto/:actoId`); screens live in `frontend/src/pages/`
  (`Dashboard`, `DashboardGuion`, `EditorActo`) and `frontend/src/components/`.
- **`frontend/wailsjs/` is GENERATED** by `wails generate module` — never hand-edit; regenerate after
  changing bound Go methods. It is committed so tests/CI work on fresh clones. (CI includes a bindings sync gate:
  `wails generate module` must produce no changes in `frontend/wailsjs/`.)
- **IPC**: exactly two bound methods in `app.go` — `ObtenerProyectosRecientes`, `ObtenerDetallesProyecto`.
  All calls go through `frontend/src/api/client.ts`, which wraps them in try/catch with a **localStorage
  fallback**, so the app also runs in a plain browser. Tests rely on this: `window.go` is undefined in
  jsdom → call rejects → fallback. **There are no mocks; don't add any without checking the tests.**
- **Dual persistence**: frontend `localStorage` (keys `guionstudio_projects_map`, `guionstudio_active_project`,
  `guionstudio_hidden_projects`) and SQLite `guiones.db` at `UserConfigDir()/guion-studio/`, created and seeded
  by `internal/store` (tables `proyectos`/`actos`, demo rows CyberNights + Shadow Realm). Don't assume one
  source of truth — the frontend merges both in `api/client.ts`.
- **Contract sync**: TS types in `frontend/src/lib/types.ts` mirror the Go structs in `internal/store/store.go`
  (field names come from the `json` tags). Update both sides when the contract changes, then regenerate bindings.
- `go:embed all:frontend/dist` requires `frontend/dist` to exist — the committed `frontend/dist/gitkeep`
  keeps `go build` working on fresh clones; `frontend/package.json` has `postbuild` to restore `dist/gitkeep`
  after `npm run build` (Vite clears `dist` by default).

## Testing quirks

- Tests call `seedDemoProjects()` (re-exported from `./App`) and `localStorage.clear()` in `beforeEach`.
- Assertions target exact Spanish UI strings (e.g. `+ Nuevo Guion`, `CyberNights`) — renaming UI text
  or demo data breaks tests. `App` accepts an `initialRoute` prop the tests depend on.
- `tsconfig` is strict with `noUnusedLocals`/`noUnusedParameters`; `tsc` fails on unused imports/vars.

## Releases

- Pushing a tag `v*` triggers `.github/workflows/release.yml` (windows-latest): runs `npm ci` + tests,
  installs the Wails CLI, builds with `wails build -nsis`, uploads `build/bin/*.exe` to the GitHub release.
- No CGO anywhere (SQLite is `modernc.org/sqlite`), so Windows CI needs no gcc/MinGW.
- Gitignored build outputs: `build/bin`, `frontend/dist/*` (except `gitkeep`), `node_modules`, `*.db`.

## Docs caveats

- `README.md` and `DOCUMENTACION_DESARROLLO.md` were rewritten for the Wails stack; if they disagree
  with the code or this file, trust the code.
