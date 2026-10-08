import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  saveProjectToStorage,
  loadProjectFromStorage,
  INITIAL_ACTS,
  INITIAL_SCENES,
} from '../lib/storage';
import type { Act, Scene, ProjectData } from '../lib/types';
import { MaximizedSceneModal } from '../components/MaximizedSceneModal';

// -------------------------------------------------------------
// 3. EDITOR DE ACTO COMPONENT (path="/tablero/:id/acto/:actoId")
// -------------------------------------------------------------
export function EditorActo() {
  const { id, actoId } = useParams<{ id: string; actoId: string }>();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState<string | number>(id || 'proj-1');
  const [projectTitle, setProjectTitle] = useState<string>('CyberNights');
  const [projectSynopsis, setProjectSynopsis] = useState<string>('Un thriller cyberpunk sobre conspiraciones corporativas.');
  const [acts, setActs] = useState<Act[]>(INITIAL_ACTS);
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);

  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [maximizedScene, setMaximizedScene] = useState<Scene | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load project state from localStorage
  useEffect(() => {
    if (id) {
      const loaded = loadProjectFromStorage(id);
      if (loaded) {
        setProjectId(loaded.id);
        setProjectTitle(loaded.title);
        if (loaded.synopsis !== undefined) setProjectSynopsis(loaded.synopsis);
        setActs(loaded.acts);
        setScenes(loaded.scenes);
        return;
      }
    }

    const saved = localStorage.getItem('guionstudio_active_project');
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          setProjectId(data.id || `proj-${id || '1'}`);
          setProjectTitle(data.title);
          if (data.synopsis !== undefined) setProjectSynopsis(data.synopsis);
          setActs(data.acts);
          setScenes(data.scenes);
        }
      } catch (e) {
        console.error("Error al cargar proyecto:", e);
      }
    }
  }, [id]);

  // Sync theme
  useEffect(() => {  
    if (theme === 'dark') {  
      document.documentElement.classList.add('dark');  
    } else {  
      document.documentElement.classList.remove('dark');  
    }  
  }, [theme]);

  // Current Act
  const currentAct = acts.find((a) => a.id === actoId) || acts[0] || {
    id: actoId || 'act-1',
    orden: 1,
    nombre: 'Planteamiento',
    sinopsis: '',
    plot_point: '',
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const saveState = (newActs: Act[], newScenes: Scene[]) => {
    const data: ProjectData = {
      id: projectId,
      title: projectTitle,
      synopsis: projectSynopsis,
      acts: newActs,
      scenes: newScenes,
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(data);
  };

  const updateCurrentAct = (fields: Partial<Act>) => {
    const updated = acts.map((a) => (a.id === currentAct.id ? { ...a, ...fields } : a));
    setActs(updated);
    saveState(updated, scenes);
  };

  const handleAddScene = () => {
    const actScenes = scenes.filter((s) => s.act_id === currentAct.id);
    const newScene: Scene = {
      id: `scn-${Date.now()}`,
      act_id: currentAct.id,
      orden: actScenes.length + 1,
      titulo: `Nueva Escena ${actScenes.length + 1}`,
      estado: 'Borrador',
      descripcion: '',
      escaleta: '',
      dialogos: '',
    };
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    saveState(acts, updatedScenes);
    showNotification(`Escena creada en ${currentAct.nombre}`);
  };

  const handleUpdateScene = (updated: Scene) => {
    const updatedScenes = scenes.map((s) => (s.id === updated.id ? updated : s));
    setScenes(updatedScenes);
    saveState(acts, updatedScenes);
  };

  const handleDeleteScene = (sceneId: string) => {
    const updatedScenes = scenes
      .filter((s) => s.id !== sceneId)
      .map((s) => ({
        ...s,
        conexiones: (s.conexiones || []).filter(
          (c) => c.target_scene_id !== sceneId
        ),
      }));
    setScenes(updatedScenes);
    saveState(acts, updatedScenes);
    showNotification('Escena eliminada');
  };

  const handleMoveScene = (sceneId: string, direction: 'up' | 'down') => {
    const sceneToMove = scenes.find((s) => s.id === sceneId);
    if (!sceneToMove) return;

    const actScenes = scenes
      .filter((s) => s.act_id === currentAct.id)
      .sort((a, b) => a.orden - b.orden);

    const index = actScenes.findIndex((s) => s.id === sceneId);
    if (direction === 'up' && index > 0) {
      const prevScene = actScenes[index - 1];
      const updatedScenes = scenes.map((s) => {
        if (s.id === sceneToMove.id) return { ...s, orden: prevScene.orden };
        if (s.id === prevScene.id) return { ...s, orden: sceneToMove.orden };
        return s;
      });
      setScenes(updatedScenes);
      saveState(acts, updatedScenes);
    } else if (direction === 'down' && index < actScenes.length - 1) {
      const nextScene = actScenes[index + 1];
      const updatedScenes = scenes.map((s) => {
        if (s.id === sceneToMove.id) return { ...s, orden: nextScene.orden };
        if (s.id === nextScene.id) return { ...s, orden: sceneToMove.orden };
        return s;
      });
      setScenes(updatedScenes);
      saveState(acts, updatedScenes);
    }
  };

  const actScenes = scenes
    .filter((s) => s.act_id === currentAct.id)
    .sort((a, b) => a.orden - b.orden);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'} flex flex-col font-sans transition-colors duration-200 selection:bg-violet-500/30 selection:text-violet-200`}>
      {/* Top Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/tablero/${id || '1'}`)}
            className="text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5"
            title="Volver al Dashboard del Guion"
          >
            ← Dashboard de Guion
          </button>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100">Editor Dedicado: Acto {currentAct.orden} - {currentAct.nombre}</h1>
          </div>
        </div>

        {/* Act Switcher & Theme Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {acts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/tablero/${id || '1'}/acto/${a.id}`)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  a.id === currentAct.id
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80'
                }`}
              >
                Acto {a.orden}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs transition border border-slate-700/80"
          >
            {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-2xl text-xs font-bold z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-6">
        {/* Act Header & Meta Edit Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Nombre del Acto:
              </label>
              <input
                type="text"
                value={currentAct.nombre}
                onChange={(e) => updateCurrentAct({ nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-violet-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-amber-400/90 mb-1.5">
                Plot Point / Punto de Trama:
              </label>
              <input
                type="text"
                value={currentAct.plot_point}
                onChange={(e) => updateCurrentAct({ plot_point: e.target.value })}
                className="w-full bg-slate-950 border border-amber-900/50 rounded-xl p-3 text-sm text-amber-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
              Sinopsis del Acto:
            </label>
            <textarea
              value={currentAct.sinopsis || ''}
              onChange={(e) => updateCurrentAct({ sinopsis: e.target.value })}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 leading-relaxed"
              placeholder="Escribe la sinopsis del acto..."
            />
          </div>
        </div>

        {/* Scenes List Section */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Escenas:
            </h3>
            <button
              onClick={handleAddScene}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition"
            >
              + Nueva Escena
            </button>
          </div>

          {actScenes.length === 0 ? (
            <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 text-slate-400 text-sm">
              No hay escenas creadas en este acto. ¡Haz clic en "+ Nueva Escena" para comenzar!
            </div>
          ) : (
            <div className="space-y-4">
              {actScenes.map((scene) => {
                const isExpanded = expandedSceneId === scene.id;

                return (
                  <div
                    key={scene.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition space-y-4"
                  >
                    {/* Scene Item Bar */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          #{scene.orden}
                        </span>
                        <input
                          type="text"
                          value={scene.titulo}
                          onChange={(e) => handleUpdateScene({ ...scene, titulo: e.target.value })}
                          className="bg-transparent text-base font-bold text-slate-100 focus:outline-none focus:bg-slate-900 px-2 py-1 rounded-lg truncate flex-1 min-w-0 border border-transparent focus:border-slate-800"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Estado Selector */}
                        <select
                          value={scene.estado}
                          onChange={(e) =>
                            handleUpdateScene({
                              ...scene,
                              estado: e.target.value as 'Borrador' | 'Revisado' | 'Final',
                            })
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                            scene.estado === 'Final'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : scene.estado === 'Revisado'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          <option value="Borrador">Borrador</option>
                          <option value="Revisado">Revisado</option>
                          <option value="Final">Final</option>
                        </select>

                        {/* Reorder Buttons */}
                        <button
                          onClick={() => handleMoveScene(scene.id, 'up')}
                          className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
                          title="Mover arriba"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveScene(scene.id, 'down')}
                          className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
                          title="Mover abajo"
                        >
                          ▼
                        </button>

                        {/* Toggle Inline Details */}
                        <button
                          onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 ${
                            isExpanded
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md'
                              : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                          }`}
                        >
                          <span>{isExpanded ? '➖' : '➕'}</span>
                          <span>{isExpanded ? 'Contraer' : 'Desplegar'}</span>
                        </button>

                        {/* Maximize Button */}
                        <button
                          onClick={() => setMaximizedScene(scene)}
                          className="bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-800/60 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition"
                          title="Maximizar escena para edición dedicada"
                        >
                          <span>⛶</span> Maximizar
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteScene(scene.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs px-2 py-1"
                          title="Eliminar escena"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Inline Expanded Editor */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-900 space-y-4 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Sinopsis / Descripción Breve:
                          </label>
                          <textarea
                            value={scene.descripcion}
                            onChange={(e) => handleUpdateScene({ ...scene, descripcion: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-violet-500"
                            placeholder="Resumen argumental de la escena..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Escaleta (Beat Sheet):
                          </label>
                          <textarea
                            value={scene.escaleta}
                            onChange={(e) => handleUpdateScene({ ...scene, escaleta: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-violet-500"
                            placeholder="1. Evento 1&#10;2. Evento 2..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Diálogos:
                          </label>
                          <textarea
                            value={scene.dialogos || ''}
                            onChange={(e) => handleUpdateScene({ ...scene, dialogos: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-violet-500"
                            placeholder="PERSONAJE&#10;(Emoción)&#10;Diálogo..."
                          />
                        </div>
                      </div>
                    )}
                    {(scene.conexiones || []).length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold bg-violet-950/40 border border-violet-800/40 px-2.5 py-1 rounded-lg w-fit mt-2">
                        <span>🔗</span>
                        <span>{(scene.conexiones || []).length} conexión{(scene.conexiones || []).length > 1 ? 'es' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Maximized Scene Modal */}
      {maximizedScene && (
        <MaximizedSceneModal
          scene={maximizedScene}
          allScenes={scenes}
          allActs={acts}
          onClose={() => setMaximizedScene(null)}
          onSave={(updated) => {
            handleUpdateScene(updated);
            setMaximizedScene(null);
            showNotification('Cambios guardados en la escena');
          }}
        />
      )}
    </div>
  );
}

