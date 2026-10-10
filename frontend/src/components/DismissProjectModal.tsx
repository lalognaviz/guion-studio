import type { ProyectoResumen } from '../lib/types';

export function DismissProjectModal({
  proyecto,
  onHide,
  onDelete,
  onClose,
}: {
  proyecto: ProyectoResumen;
  onHide: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-brand-surface rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 border border-[#FD7014]/30 rounded-xl text-xl">📋</div>
          <div>
            <h3 className="text-lg font-bold text-brand-text">{proyecto.titulo}</h3>
            <p className="text-xs text-slate-400">¿Qué deseas hacer con este proyecto?</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onHide}
            className="w-full text-left px-4 py-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-[#FD7014]/30/50 transition flex items-center gap-3 group"
          >
            <span className="text-lg">👁️</span>
            <div>
              <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-text/90 transition">Quitar de la vista</p>
              <p className="text-xs text-slate-400">El proyecto se oculta de la pantalla de inicio sin borrar datos.</p>
            </div>
          </button>

          <button
            onClick={onDelete}
            className="w-full text-left px-4 py-3 bg-rose-950/30 hover:bg-rose-950/50 rounded-xl border border-rose-800/40 transition flex items-center gap-3 group"
          >
            <span className="text-lg">🗑️</span>
            <div>
              <p className="text-sm font-semibold text-rose-300">Eliminar definitivamente</p>
              <p className="text-xs text-slate-400">Se borrarán todos sus datos y escenas. No se puede deshacer.</p>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-[#FD7014]/30 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}