import { describe, expect, it, vi } from 'vitest';

import {
  generateMarkdownText,
  generateProjectJson,
  generateTweeText,
  saveFileWithPicker,
  toProjectData,
} from './export';
import type { Act, Scene } from './types';
import type { ProjectSnapshot } from './export';

const acts: Act[] = [
  {
    id: 'act-1',
    orden: 1,
    nombre: 'Planteamiento',
    sinopsis: 'Inicio',
    plot_point: 'Evento disparador',
  },
];

const scenes: Scene[] = [
  {
    id: 'scn-1',
    act_id: 'act-1',
    orden: 1,
    titulo: 'Escena 1',
    estado: 'Borrador',
    descripcion: 'Descripción',
    escaleta: '- Paso 1',
    dialogos: 'JOHN\nHola',
    conexiones: [{ id: 'con-1', target_scene_id: 'scn-2', label: 'Continuar' }],
  },
  {
    id: 'scn-2',
    act_id: 'act-1',
    orden: 2,
    titulo: 'Escena 2',
    estado: 'Revisado',
    descripcion: '',
    escaleta: '',
  },
];

const snapshot: ProjectSnapshot = {
  id: 'p1',
  title: 'Proyecto Test',
  synopsis: 'Sinopsis',
  acts,
  scenes,
};

describe('export', () => {
  it('genera Markdown con estructura completa', () => {
    const md = generateMarkdownText(snapshot);
    expect(md).toContain('# Proyecto Test');
    expect(md).toContain('**Sinopsis General:** Sinopsis');
    expect(md).toContain('## ACTO 1: Planteamiento');
    expect(md).toContain('Plot Point 1');
    expect(md).toContain('Escena 1 [Borrador]');
    expect(md).toContain('JOHN');
    expect(md).toContain('[Continuar]');
    expect(md).toContain('Escena 2');
  });

  it('genera JSON válido con updatedAt', () => {
    const json = generateProjectJson(snapshot);
    const parsed = JSON.parse(json) as any;
    expect(parsed.id).toBe('p1');
    expect(parsed.title).toBe('Proyecto Test');
    expect(parsed.acts.length).toBe(1);
    expect(parsed.scenes.length).toBe(2);
    expect(typeof parsed.updatedAt).toBe('string');
  });

  it('genera Twee para Harlowe con enlaces', () => {
    const twee = generateTweeText(snapshot, 'Harlowe');
    expect(twee).toContain(':: StoryTitle');
    expect(twee).toContain('Proyecto Test');
    expect(twee).toContain('format": "Harlowe"');
    expect(twee).toContain('[[Continuar|Escena 2]]');
  });

  it('genera Twee para SugarCube', () => {
    const twee = generateTweeText(snapshot, 'SugarCube');
    expect(twee).toContain('format": "SugarCube"');
    expect(twee).toContain('Escena 1');
    expect(twee).toContain('Escena 2');
  });

  it('toProjectData añade updatedAt', () => {
    const data = toProjectData(snapshot);
    expect(data.updatedAt).toBeDefined();
  });
});

describe('saveFileWithPicker', () => {
  it('usa fallback blob si no existe showSaveFilePicker', async () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    (globalThis as any).URL.createObjectURL = createObjectURL;
    (globalThis as any).URL.revokeObjectURL = revokeObjectURL;
    const anchor = { href: '', download: '', click } as any;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const ok = await saveFileWithPicker('contenido', 'test.txt', 'text/plain', '.txt', 'Texto');
    expect(ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });
});
