import type { Act, Scene } from '../lib/types';
import { ActColumn } from './ActColumn';

type ActBoardProps = {
  acts: Act[];
  scenes: Scene[];
  expandedSceneId: string | null;
  onAddScene: (actId: string) => void;
  onUpdateScene: (scene: Scene) => void;
  onMoveScene: (sceneId: string, direction: 'up' | 'down') => void;
  onToggleExpand: (sceneId: string) => void;
  onMaximize: (scene: Scene) => void;
  onDeleteScene: (sceneId: string) => void;
  onEditAct: (actId: string) => void;
};

export function ActBoard({
  acts,
  scenes,
  expandedSceneId,
  onAddScene,
  onUpdateScene,
  onMoveScene,
  onToggleExpand,
  onMaximize,
  onDeleteScene,
  onEditAct,
}: ActBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      {acts.map((act) => {
        const actScenes = scenes
          .filter((s) => s.act_id === act.id)
          .sort((a, b) => a.orden - b.orden);

        return (
          <ActColumn
            key={act.id}
            act={act}
            scenes={actScenes}
            expandedSceneId={expandedSceneId}
            onAddScene={onAddScene}
            onUpdateScene={onUpdateScene}
            onMoveScene={onMoveScene}
            onToggleExpand={onToggleExpand}
            onMaximize={onMaximize}
            onDeleteScene={onDeleteScene}
            onEdit={onEditAct}
          />
        );
      })}
    </div>
  );
}
