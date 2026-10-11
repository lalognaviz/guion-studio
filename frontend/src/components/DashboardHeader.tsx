import type { RefObject } from 'react';

export function DashboardHeader({
  fileInputRef,
  onOpenFile,
  onCreateNew,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onOpenFile: (file: File) => void;
  onCreateNew: () => void;
}) {
  return (
    <header className="bg-brand-surface/90 backdrop-blur-md border-b border-brand-surface px-6 py-4 flex items-center justify-between shadow-xl sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-[#FD7014] to-[#e65f0f] rounded-xl shadow-lg shadow-orange-950/40">
          <span className="text-xl">✍️</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Guion
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#FD7014]/30/80 transition flex items-center gap-2"
        >
          <span>📂</span> Abrir Proyecto...
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onOpenFile(file);
          }}
          accept=".json,.guion"
          className="hidden"
        />
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-950/50 transition-all duration-200 flex items-center gap-2"
        >
          <span>+</span> Nuevo Guion
        </button>
      </div>
    </header>
  );
}