import type { ChangeEvent, RefObject } from 'react';

type ProjectHeaderProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBack: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isFileMenuOpen: boolean;
  onToggleMenu: () => void;
  onNewProject: () => void;
  onOpenFile: () => void;
  onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveJson: () => void;
  onOpenSaveAs: () => void;
  onSaveMd: () => void;
  onOpenTwee: () => void;
  onOpenPreview: () => void;
};

export function ProjectHeader({
  theme,
  onToggleTheme,
  onBack,
  menuRef,
  fileInputRef,
  isFileMenuOpen,
  onToggleMenu,
  onNewProject,
  onOpenFile,
  onFileSelected,
  onSaveJson,
  onOpenSaveAs,
  onSaveMd,
  onOpenTwee,
  onOpenPreview,
}: ProjectHeaderProps) {
  return (
    <header className="bg-brand-surface/90 backdrop-blur-md text-white px-6 py-3.5 flex items-center justify-between border-b border-[#3B3E47] shadow-xl sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5"
          title="Volver a la lista de proyectos"
        >
          ← Proyectos
        </button>

        <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
          Guion<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
        </h1>

        {/* Archivo Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={onToggleMenu}
            className="bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5"
          >
            <span>📂 Archivo</span>
            <span className="text-[10px]">▼</span>
          </button>

          {isFileMenuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-brand-surface border border-[#3B3E47] rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-md">
              <button
                onClick={onNewProject}
                className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
              >
                📄 Nuevo Proyecto
              </button>
              <button
                onClick={onOpenFile}
                className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
              >
                📂 Abrir Proyecto...
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelected}
                accept=".json,.guion"
                className="hidden"
              />
              <hr className="border-[#3B3E47] my-1" />
              <button
                onClick={onSaveJson}
                className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
              >
                💾 Guardar
              </button>
              <button
                onClick={onOpenSaveAs}
                className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
              >
                📑 Guardar Como...
              </button>
              <button
                onClick={onSaveMd}
                className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
              >
                📝 Guardar en .md
              </button>
              <button
                onClick={onOpenTwee}
                className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
              >
                🎮 Exportar a Twine (.twee)
              </button>
              <hr className="border-[#3B3E47] my-1" />
              <button
                onClick={onOpenPreview}
                className="w-full text-left px-4 py-2 text-xs text-[#FD7014] hover:bg-slate-800 font-medium flex items-center gap-2"
              >
                vista previa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Header controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs transition border border-slate-700/80"
        >
          {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      </div>
    </header>
  );
}
