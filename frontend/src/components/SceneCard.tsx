import type { Scene } from '../lib/types';

type SceneCardProps = {
  scene: Scene;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (scene: Scene) => void;
  onMove: (direction: 'up' | 'down') => void;
  onMaximize: () => void;
  onDelete: () => void;
};

export function SceneCard({
  scene,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onMove,
  onMaximize,
  onDelete,
}: SceneCardProps) {
  const conexiones = scene.conexiones || [];

  return (
    <div className="bg-brand-bg/80 border border-[#3B3E47] hover:border-slate-700 rounded-xl p-3 space-y-2 transition min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="font-mono text-slate-400 font-bold text-xs shrink-0">
            #{scene.orden}
          </span>
          <input
            type="text"
            value={scene.titulo}
            onChange={(e) => onUpdate({ ...scene, titulo: e.target.value })}
            className="bg-transparent text-brand-text font-semibold text-xs focus:outline-none focus:bg-brand-surface px-1.5 py-0.5 rounded truncate flex-1 min-w-0 border border-transparent focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Estado Selector */}
          <select
            value={scene.estado}
            onChange={(e) =>
              onUpdate({
                ...scene,
                estado: e.target.value as 'Borrador' | 'Revisado' | 'Final',
              })
            }
            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
              scene.estado === 'Final'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : scene.estado === 'Revisado'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            <option value="Borrador">Borrador</option>
            <option value="Revisado">Revisado</option>
            <option value="Final">Final</option>
          </select>

          {/* Reorder */}
          <button
            onClick={() => onMove('up')}
            className="text-slate-400 hover:text-slate-200 text-[10px] px-1"
            title="Mover arriba"
          >
            ▲
          </button>
          <button
            onClick={() => onMove('down')}
            className="text-slate-400 hover:text-slate-200 text-[10px] px-1"
            title="Mover abajo"
          >
            ▼
          </button>

          {/* Toggle Inline Desplegable */}
          <button
            onClick={onToggleExpand}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
              isExpanded
                ? 'bg-gradient-to-r from-[#FD7014] to-[#e65f0f] text-white border-transparent shadow-md'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/80 border-slate-700/80'
            }`}
            title={isExpanded ? 'Contraer escena' : 'Desplegar detalles de escena'}
          >
            <span>{isExpanded ? '➖' : '➕'}</span>
          </button>

          {/* Maximize */}
          <button
            onClick={onMaximize}
            className="text-slate-400 hover:text-[#FD7014] text-xs px-1"
            title="Maximizar escena para edición completa"
          >
            ⛶
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="text-slate-500 hover:text-rose-400 text-xs px-1"
            title="Eliminar escena"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inline Expanded Form */}
      {isExpanded && (
        <div className="pt-2 border-t border-[#3B3E47] space-y-2 text-[11px]">
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
              Descripción / Sinopsis:
            </label>
            <textarea
              value={scene.descripcion}
              onChange={(e) => onUpdate({ ...scene, descripcion: e.target.value })}
              rows={2}
              className="w-full bg-brand-surface border border-[#3B3E47] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FD7014]"
              placeholder="Descripción de la escena..."
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
              Escaleta (Beat Sheet):
            </label>
            <textarea
              value={scene.escaleta}
              onChange={(e) => onUpdate({ ...scene, escaleta: e.target.value })}
              rows={2}
              className="w-full bg-brand-surface border border-[#3B3E47] rounded-lg p-2 text-slate-200 font-mono text-[10px] focus:outline-none focus:border-[#FD7014]"
              placeholder="Escaleta paso a paso..."
            />
          </div>
        </div>
      )}
      {conexiones.length > 0 && (
        <div className="flex items-center gap-1 text-[9px] text-[#FD7014] font-semibold bg-[#FD7014]/10/40 border border-violet-800/40 px-2 py-0.5 rounded-md w-fit mt-1">
          <span>🔗</span>
          <span>
            {conexiones.length} conexión{conexiones.length > 1 ? 'es' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
