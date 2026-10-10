import type { Scene } from './types';

// Operaciones puras sobre la colección de escenas. Sin estado ni persistencia,
// para poder probarlas de forma aislada.

export function createSceneInAct(scenes: Scene[], actId: string): Scene {
  const actScenes = scenes.filter((s) => s.act_id === actId);
  return {
    id: `scn-${Date.now()}`,
    act_id: actId,
    orden: actScenes.length + 1,
    titulo: `Nueva Escena ${actScenes.length + 1}`,
    estado: 'Borrador',
    descripcion: '',
    escaleta: '',
    dialogos: '',
    conexiones: [],
  };
}

export function addSceneTo(scenes: Scene[], newScene: Scene): Scene[] {
  return [...scenes, newScene];
}

export function updateSceneIn(scenes: Scene[], updated: Scene): Scene[] {
  return scenes.map((s) => (s.id === updated.id ? updated : s));
}

export function deleteSceneFrom(scenes: Scene[], sceneId: string): Scene[] {
  return scenes
    .filter((s) => s.id !== sceneId)
    .map((s) => ({
      ...s,
      conexiones: (s.conexiones || []).filter((c) => c.target_scene_id !== sceneId),
    }));
}

export function moveSceneIn(scenes: Scene[], sceneId: string, direction: 'up' | 'down'): Scene[] {
  const sceneToMove = scenes.find((s) => s.id === sceneId);
  if (!sceneToMove) return scenes;

  const actScenes = scenes
    .filter((s) => s.act_id === sceneToMove.act_id)
    .sort((a, b) => a.orden - b.orden);

  const index = actScenes.findIndex((s) => s.id === sceneId);

  if (direction === 'up' && index > 0) {
    const prevScene = actScenes[index - 1];
    return scenes.map((s) => {
      if (s.id === sceneToMove.id) return { ...s, orden: prevScene.orden };
      if (s.id === prevScene.id) return { ...s, orden: sceneToMove.orden };
      return s;
    });
  }

  if (direction === 'down' && index < actScenes.length - 1) {
    const nextScene = actScenes[index + 1];
    return scenes.map((s) => {
      if (s.id === sceneToMove.id) return { ...s, orden: nextScene.orden };
      if (s.id === nextScene.id) return { ...s, orden: sceneToMove.orden };
      return s;
    });
  }

  return scenes;
}
