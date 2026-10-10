import { describe, expect, it } from 'vitest';

import type { Scene } from './types';
import { createSceneInAct, deleteSceneFrom, moveSceneIn, updateSceneIn } from './sceneOperations';

function scene(id: string, actId: string, orden: number): Scene {
  return {
    id,
    act_id: actId,
    orden,
    titulo: id,
    estado: 'Borrador',
    descripcion: '',
    escaleta: '',
  };
}

describe('sceneOperations', () => {
  it('creates a scene numbered after the last one in the act', () => {
    const scenes = [scene('a', 'act-1', 1), scene('b', 'act-1', 2)];
    const nueva = createSceneInAct(scenes, 'act-1');
    expect(nueva.act_id).toBe('act-1');
    expect(nueva.orden).toBe(3);
    expect(nueva.titulo).toBe('Nueva Escena 3');
  });

  it('moves a scene up by swapping order with the previous one', () => {
    const scenes = [scene('a', 'act-1', 1), scene('b', 'act-1', 2)];
    const moved = moveSceneIn(scenes, 'b', 'up');
    expect(moved.find((s) => s.id === 'b')?.orden).toBe(1);
    expect(moved.find((s) => s.id === 'a')?.orden).toBe(2);
  });

  it('does not move a scene past the edges', () => {
    const scenes = [scene('a', 'act-1', 1), scene('b', 'act-1', 2)];
    expect(moveSceneIn(scenes, 'a', 'up')).toBe(scenes);
    expect(moveSceneIn(scenes, 'b', 'down')).toBe(scenes);
  });

  it('deletes a scene and every connection pointing to it', () => {
    const scenes: Scene[] = [
      { ...scene('a', 'act-1', 1), conexiones: [{ id: 'c1', target_scene_id: 'b' }, { id: 'c2', target_scene_id: 'c' }] },
      scene('b', 'act-1', 2),
      scene('c', 'act-1', 3),
    ];
    const result = deleteSceneFrom(scenes, 'b');
    expect(result.map((s) => s.id)).toEqual(['a', 'c']);
    expect(result[0].conexiones).toEqual([{ id: 'c2', target_scene_id: 'c' }]);
  });

  it('updates a scene in place', () => {
    const scenes = [scene('a', 'act-1', 1), scene('b', 'act-1', 2)];
    const result = updateSceneIn(scenes, { ...scene('a', 'act-1', 1), titulo: 'Editada' });
    expect(result.find((s) => s.id === 'a')?.titulo).toBe('Editada');
    expect(result.find((s) => s.id === 'b')?.titulo).toBe('b');
  });
});
