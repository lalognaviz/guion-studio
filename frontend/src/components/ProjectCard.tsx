import type { ProyectoResumen } from '../lib/types';

export function ProjectCard({
  proyecto,
  onOpen,
  onManage,
}: {
  proyecto: ProyectoResumen;
  onOpen: () => void;
  onManage: () => void;
}) {
  return (
    <div className="bg-brand-surface/80 backdrop-blur-sm border border-brand-surface hover:border-[#FD7014]/40 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-orange-950/20 transition-all duration-300 flex flex-col justify-between group relative">
      <div>
        <div className="flex items-start justify-between mb-4">
          <h3
            className="text-lg font-bold text-brand-text group-hover:text-brand-text/90 transition cursor-pointer pr-6"
            onClick={onOpen}
          >
            {proyecto.titulo}
          </h3>
          <button
            onClick={onManage}
            className="opacity-0 group-hover:opacity-100 -mt-1 -mr-1 p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all duration-200"
            title="Gestionar proyecto"
          >
            ✕
          </button>
        </div>
        {proyecto.sinopsis && (
          <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">{proyecto.sinopsis}</p>
        )}
        <p className="text-xs text-slate-400 mb-3 truncate flex items-center gap-1.5 font-mono">
          <span className="text-indigo-400">📁</span> {proyecto.ruta_archivo || 'Sin ruta definida'}
        </p>
        <p className="text-[11px] text-slate-500 mb-6 flex items-center gap-1.5">
          <span>📅</span> Creado: {proyecto.creado_en}
        </p>
      </div>
      <div className="pt-4 border-t border-brand-surface/80">
        <button
          onClick={onOpen}
          className="w-full bg-slate-800/90 hover:bg-gradient-to-r hover:from-[#FD7014] hover:to-[#e65f0f] text-slate-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-[#FD7014]/30/80 hover:border-transparent transition-all duration-200 text-center shadow-sm"
        >
          Abrir
        </button>
      </div>
    </div>
  );
}