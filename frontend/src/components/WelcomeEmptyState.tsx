export function WelcomeEmptyState({
  onCreateNew,
  onCreateExample,
}: {
  onCreateNew: () => void;
  onCreateExample: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-brand-surface/40 rounded-2xl border border-dashed border-[#FD7014]/30/80 text-center space-y-6">
      <div className="p-4 bg-gradient-to-tr from-[#FD7014]/20 to-[#e65f0f]/20 rounded-2xl border border-[#FD7014]/20">
        <span className="text-5xl">✍️</span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">¡Bienvenido a GuionStudio!</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Comienza creando un nuevo proyecto narrativo, abriendo un archivo existente o arrastrando un archivo .json a este panel.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <span>+</span> Nuevo Proyecto
        </button>
        <button
          onClick={onCreateExample}
          className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-xl border border-[#FD7014]/30/80 transition flex items-center gap-2"
        >
          <span>📘</span> Crear Proyecto de Ejemplo
        </button>
      </div>
    </div>
  );
}