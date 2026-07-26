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

- **Framework de Escritorio**: [Tauri v2](https://tauri.app/) (Rust)
- **Frontend UI**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Estilos**: [TailwindCSS 3.4](https://tailwindcss.com/)
- **Base de Datos**: [SQLite](https://sqlite.org/) via `tauri-plugin-sql` y `rusqlite`
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (para compilar con Tauri)

### Instalación

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   git clone https://github.com/lalognaviz/guion-studio.git
   cd guion-studio
   npm install
   ```

2. **Ejecutar en modo Desarrollo Web:**
   ```bash
   npm run dev
   ```

3. **Ejecutar en modo Desarrollo de Escritorio (Tauri):**
   ```bash
   npm run tauri dev
   ```

---

## 🧪 Pruebas Unitarias y Verificación

El proyecto cuenta con cobertura de pruebas automatizadas tanto en el frontend como en el backend Rust:

- **Pruebas del Frontend (Vitest)**:
  ```bash
  npm test
  ```
  *(11 pruebas unitarias cubriendo el flujo del tablero, modales, persistencia y exportación)*

- **Pruebas del Backend (Rust)**:
  ```bash
  cargo test --manifest-path src-tauri/Cargo.toml
  ```

- **Compilación a Ejecutable Windows (.exe)**:
  ```bash
  npm run tauri build
  ```
  *(Genera el binario ejecutable standalone en `src-tauri/target/release/guion-studio.exe` y los paquetes de instalación en `src-tauri/target/release/bundle/`)*

---

## 📄 Documentación Adicional

- [📖 Documentación de Desarrollo](file:///C:/Users/lisan/OneDrive/Escritorio/guionstudio/guion-studio/DOCUMENTACION_DESARROLLO.md): Arquitectura detallada, modelo de base de datos SQLite y guía de módulos.
- [🤖 Guía para Agentes IA (AGENTS.md)](file:///C:/Users/lisan/OneDrive/Escritorio/guionstudio/guion-studio/AGENTS.md): Reglas de código, contratos de datos y flujos de desarrollo para asistentes de inteligencia artificial.
