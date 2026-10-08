# 🎬 GuionStudio

**GuionStudio** es una aplicación *Local-First* de alto rendimiento diseñada para escritores de videojuegos, diseñadores narrativos y guionistas. Permite estructurar la narrativa completa de un juego mediante una **Estructura de 3 Actos** (Planteamiento, Confrontación, Resolución), gestionar la escaleta detallada por escenas, redactar diálogos en formato técnico y documentar notas de diseño de nivel y efectos de sonido.

---

## ✨ Características Principales

- 🏛️ **Estructura Narrativa de 3 Actos**: Organización intuitiva en tres columnas fijas o responsivas (*Planteamiento*, *Confrontación*, *Resolución*) con sinopsis de acto y *Plot Points* destacados.
- 🎬 **Tarjetas de Escena Dinámicas**: Modo compacto con selector interactivo de estado (`Borrador`, `Revisado`, `Final`), reordenamiento rápido (`▲` / `▼`) y cambio inmediato de acto.
- ⛶ **Editor de Escena Maximizado**: Ventana dedicada a pantalla completa con borrador temporal (*draft*), soporte de `✓ Aceptar` y `Cancelar`, desglose de escaleta (*Beat Sheet*), diálogo monospaciado y notas de diseño de nivel/sonido.
- 📂 **Gestión Local-First de Proyectos**: Guardado automático en `localStorage` y base de datos relacional SQLite. Menú desplegable **📂 Archivo** con acciones para Nuevo Proyecto, Abrir JSON/Guion, Guardar Como (Selector nativo del sistema de archivos) y Exportación a Markdown.
- 📖 **Lector de Guion Markdown Integrado**: Visor modal completo que compila todo el proyecto en un documento Markdown estructurado con 1 clic para copiar o descargar.
- 🎨 **Diseño Moderno & Modo Oscuro**: Estética *slate dark* con efectos de cristal (*glassmorphism*), degradados violeta/índigo y conmutador de tema claro/oscuro.

---

## 🛠️ Tecnologías Utilizadas

- **Framework de Escritorio**: [Wails v2](https://wails.io/) (Go) — backend Go + WebView2 del sistema
- **Frontend UI**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Estilos**: [TailwindCSS 3.4](https://tailwindcss.com/)
- **Base de Datos**: [SQLite](https://sqlite.org/) vía [`modernc.org/sqlite`](https://pkg.go.dev/modernc.org/sqlite) (Go puro, sin CGO)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + `go test`

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
- [Go](https://go.dev/dl/) **1.25 o superior** (para Wails y el backend)
- [Node.js](https://nodejs.org/) **20.19+ / 22+** (jsdom no funciona en Node 18)
- CLI de Wails: `go install github.com/wailsapp/wails/v2/cmd/wails@v2.16.0`
- **Windows**: WebView2 Runtime (incluido en Windows 10/11)
- **Linux**: `sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev` (comprobar con `wails doctor`). Ubuntu 24.04+ solo incluye webkit2gtk-4.1, por eso `wails.json` fija el build tag `webkit2_41`.
- **Windows (para `wails build -nsis`)**: [NSIS](https://nsis.sourceforge.io/) debe estar disponible en PATH (el CI lo instala automáticamente).

### Instalación

```bash
git clone https://github.com/lalognaviz/guion-studio.git
cd guion-studio
npm --prefix frontend install
```

### Ejecutar en modo Desarrollo (Escritorio, con backend Go)

```bash
wails dev
```

### Ejecutar en modo Desarrollo Web (sin backend, datos en localStorage)

```bash
npm --prefix frontend run dev
```

---

## 🧪 Pruebas Unitarias y Verificación

- **Frontend (Vitest + React Testing Library)** — 16 pruebas:
  ```bash
  npm --prefix frontend test
  ```
- **Typecheck (TypeScript estricto)**:
  ```bash
  cd frontend && npx tsc --noEmit
  ```
- **Backend (Go)** — esquema, seed y consultas:
  ```bash
  go test ./...
  ```

### Compilar para Producción

```bash
wails build -nsis
```

- Ejecutable portable: `build/bin/guion-studio.exe`
- Instalador NSIS: `build/bin/guion-studio-amd64-installer.exe`

Sin flag `-nsis` solo se genera el ejecutable.

---

## 📄 Documentación Adicional

- [📖 Documentación de Desarrollo](DOCUMENTACION_DESARROLLO.md): Arquitectura detallada, modelo de base de datos SQLite y guía de módulos.
- [🤖 Guía para Agentes IA (AGENTS.md)](AGENTS.md): Reglas de código, contratos de datos y flujos de desarrollo para asistentes de inteligencia artificial.
