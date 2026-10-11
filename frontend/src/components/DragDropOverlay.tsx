export function DragDropOverlay() {
  return (
    <div className="fixed inset-0 bg-[#FD7014]/10 border-4 border-dashed border-[#FD7014]/60 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
      <div className="bg-brand-surface/95 px-8 py-6 rounded-2xl text-center border border-[#FD7014]/40 shadow-2xl space-y-2">
        <span className="text-5xl">📂</span>
        <p className="text-brand-text/90 font-bold text-base">Soltar archivo para abrir proyecto</p>
        <p className="text-slate-400 text-xs">Acepta archivos de guion .json o .guion</p>
      </div>
    </div>
  );
}