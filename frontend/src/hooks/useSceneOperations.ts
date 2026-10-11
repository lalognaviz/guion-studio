import type { Act, Scene } from '../lib/types';
import {
  addSceneTo,
  createSceneInAct,
  deleteSceneFrom,
  moveSceneIn,
  updateSceneIn,
} from '../lib/sceneOperations';

type SaveState = (title: string, synopsis: string, acts: Act[], scenes: Scene[]) => void;

// Encapsula las mutaciones de escenas y su persistencia asociada.
export function useSceneOperations(params: {
  projectTitle: string;
  projectSynopsis: string;
  acts: Act[];
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  saveState: SaveState;
  showNotification: (msg: string) => void;
}) {
  const { projectTitle, projectSynopsis, acts, scenes, setScenes, saveState, showNotification } =
    params;

  const handleAddScene = (actId: string) => {
    const newScene = createSceneInAct(scenes, actId);
    const updatedScenes = addSceneTo(scenes, newScene);
    setScenes(updatedScenes);
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
    showNotification(`Escena creada en Acto ${acts.find((a) => a.id === actId)?.orden}`);
  };

  const handleUpdateScene = (updated: Scene) => {
    const updatedScenes = updateSceneIn(scenes, updated);
    setScenes(updatedScenes);
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
  };

  const handleDeleteScene = (sceneId: string) => {
    const updatedScenes = deleteSceneFrom(scenes, sceneId);
    setScenes(updatedScenes);
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
    showNotification('Escena eliminada');
  };

  const handleMoveScene = (sceneId: string, direction: 'up' | 'down') => {
    const updatedScenes = moveSceneIn(scenes, sceneId, direction);
    if (updatedScenes === scenes) return;
    setScenes(updatedScenes);
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
  };

  return { handleAddScene, handleUpdateScene, handleDeleteScene, handleMoveScene };
}
