import { useState } from 'react';

import type { Act, Scene, SceneConnection } from '../lib/types';

// -------------------------------------------------------------
// MAXIMIZED SCENE MODAL COMPONENT
// -------------------------------------------------------------
export function MaximizedSceneModal({
  scene,
  allScenes,
  allActs,
  onClose,
  onSave,
}: {
  scene: Scene;
  allScenes: Scene[];
  allActs: Act[];
  onClose: () => void;
  onSave: (updated: Scene) => void;
}) {
  const [draft, setDraft] = useState<Scene>({ ...scene });
  const [newConnTarget, setNewConnTarget] = useState<string>('');
  const [newConnLabel, setNewConnLabel] = useState<string>('');

  const handleAddConnection = () => {
    if (!newConnTarget) return;
    const newConn: SceneConnection = {
      id: `conn-${Date.now()}`,
      target_scene_id: newConnTarget,
      label: newConnLabel.trim() || undefined,
    };
    setDraft({
      ...draft,
      conexiones: [...(draft.conexiones || []), newConn],
    });
    setNewConnTarget('');
    setNewConnLabel('');
  };

  const handleRemoveConnection = (connId: string) => {
    setDraft({
      ...draft,
      conexiones: (draft.conexiones || []).filter((c) => c.id !== connId),
    });
  };

  const availableTargets = allScenes
    .filter((s) => s.id !== draft.id)
    .filter((s) => !(draft.conexiones || []).some((c) => c.target_scene_id === s.id));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-lg text-violet-400">⛶</span>
            <input
              type="text"
              value={draft.titulo}
              onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
              className="bg-slate-900 text-slate-100 font-bold text-lg px-3 py-1 rounded-xl border border-slate-800 focus:outline-none focus:border-violet-500 flex-1 max-w-md"
            />
          </div>
          <h4 className="text-xs text-slate-400 font-medium mr-4">
            Edición Cómoda de Escena y Escaleta Detallada
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Descripción / Sinopsis:
                </label>
                <textarea
                  value={draft.descripcion}
                  onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Escaleta Paso a Paso (Beat Sheet):
                </label>
                <textarea
                  value={draft.escaleta}
                  onChange={(e) => setDraft({ ...draft, escaleta: e.target.value })}
                  rows={10}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Diálogos (Formato Guion):
                </label>
                <textarea
                  value={draft.dialogos || ''}
                  onChange={(e) => setDraft({ ...draft, dialogos: e.target.value })}
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Notas de Diseño de Nivel:
                  </label>
                  <textarea
                    value={draft.diseno_nivel || ''}
                    onChange={(e) => setDraft({ ...draft, diseno_nivel: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Efectos de Sonido (SFX):
                  </label>
                  <textarea
                    value={draft.sonido || ''}
                    onChange={(e) => setDraft({ ...draft, sonido: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* === CONEXIONES / BRANCHING NARRATIVES === */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
              <span>🔗</span> Escenas Siguientes (Conexiones)
            </h4>

            {/* Connection list */}
            <div className="space-y-1.5 mb-4">
              {(draft.conexiones || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  Sin conexiones. Esta escena es un punto final de la narrativa.
                </p>
              ) : (
                (draft.conexiones || []).map((conn) => {
                  const targetScene = allScenes.find((s) => s.id === conn.target_scene_id);
                  const targetAct = targetScene
                    ? allActs.find((a) => a.id === targetScene.act_id)
                    : null;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800 text-xs group hover:border-slate-700 transition"
                    >
                      <span className="text-slate-200 flex items-center gap-1.5">
                        {conn.label ? (
                          <>
                            <span className="text-violet-300 font-medium">[{conn.label}]</span>
                            <span className="text-slate-500">➔</span>
                          </>
                        ) : (
                          <span className="text-slate-500">➔</span>
                        )}
                        <span className="text-indigo-300 font-semibold">
                          {targetScene?.titulo || '⚠️ Escena eliminada'}
                        </span>
                        {targetAct && (
                          <span className="text-slate-600 text-[10px]">(Acto {targetAct.orden})</span>
                        )}
                      </span>
                      <button
                        onClick={() => handleRemoveConnection(conn.id)}
                        className="text-slate-500 hover:text-rose-400 transition px-1"
                        title="Eliminar conexión"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* New connection form */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 mb-1">Escena destino:</label>
                <select
                  value={newConnTarget}
                  onChange={(e) => setNewConnTarget(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500"
                >
                  <option value="">— Seleccionar escena —</option>
                  {availableTargets.map((s) => {
                    const act = allActs.find((a) => a.id === s.act_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.titulo} ({act ? `Acto ${act.orden}` : 'Sin acto'})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 mb-1">
                  Texto de la opción (opcional):
                </label>
                <input
                  type="text"
                  value={newConnLabel}
                  onChange={(e) => setNewConnLabel(e.target.value)}
                  placeholder='Ej: "Abrir la puerta de madera"'
                  className="w-full bg-slate-950 text-slate-200 text-xs border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500"
                />
              </div>
              <button
                onClick={handleAddConnection}
                disabled={!newConnTarget}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              >
                Conectar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
          >
            ✓ Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

