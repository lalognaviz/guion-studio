import type { Act, Scene } from '../lib/types';
import { SceneCard } from './SceneCard';

type ActColumnProps = {
  act: Act;
  scenes: Scene[];
  expandedSceneId: string | null;
  onAddScene: (actId: string) => void;
  onUpdateScene: (scene: Scene) => void;
  onMoveScene: (sceneId: string, direction: 'up' | 'down') => void;
  onToggleExpand: (sceneId: string) => void;
  onMaximize: (scene: Scene) => void;
  onDeleteScene: (sceneId: string) => void;
  onEdit: (actId: string) => void;
};

export function ActColumn({
  act,
  scenes,
  expandedSceneId,
  onAddScene,
  onUpdateScene,
  onMoveScene,
  onToggleExpand,
  onMaximize,
  onDeleteScene,
  onEdit,
}: ActColumnProps) {
  // Distinct color styles per Act for clear visual grouping
  const actBadgeStyle =
    act.orden === 1
      ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
      : act.orden === 2
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';

  return (
    <div className="bg-brand-surface/80 backdrop-blur-sm border border-[#3B3E47]/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-200 min-w-0">
      {/* Act Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${actBadgeStyle}`}>
              Acto {act.orden}: {act.nombre}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {scenes.length} escena(s)
          </span>
        </div>
        {/* Sinopsis del Acto */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Descripción:
          </span>
          <p className="text-xs text-slate-300 bg-brand-bg/60 p-3 rounded-xl border border-[#3B3E47]/80 leading-relaxed italic">
            {act.sinopsis || 'Sin sinopsis registrada.'}
          </p>
        </div>

        {/* Plot Point */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block mb-1">
            Plot Point:
          </span>
          <p className="text-xs text-amber-200/90 bg-amber-950/20 p-3 rounded-xl border border-amber-900/40">
            {act.plot_point || 'Sin punto de trama registrado.'}
          </p>
        </div>

        {/* Scrollable Scene List with Full Direct Editing & Creation */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Escenas:
            </span>
            <button
              onClick={() => onAddScene(act.id)}
              className="bg-[#FD7014]/20 hover:bg-[#FD7014]/30 text-violet-300 border border-[#FD7014]/40 hover:border-[#FD7014] text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
            >
              + Nueva Escena
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {scenes.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center bg-brand-bg/40 rounded-xl border border-[#3B3E47]/50">
                No hay escenas en este acto. ¡Haz clic en "+ Nueva Escena" para añadir una!
              </div>
            ) : (
              scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  isExpanded={expandedSceneId === scene.id}
                  onToggleExpand={() => onToggleExpand(scene.id)}
                  onUpdate={onUpdateScene}
                  onMove={(direction) => onMoveScene(scene.id, direction)}
                  onMaximize={() => onMaximize(scene)}
                  onDelete={() => onDeleteScene(scene.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Primary Action: Go to Focused Editor for this Act */}
      <div className="pt-4 mt-5 border-t border-[#3B3E47]/80">
        <button
          onClick={() => onEdit(act.id)}
          className="w-full bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-950/40 transition-all duration-200 flex items-center justify-center gap-2"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
