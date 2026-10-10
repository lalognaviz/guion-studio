import type { Act, ProjectData, Scene } from './types';

// Instantánea editable del proyecto que consumen los generadores de export.
export type ProjectSnapshot = {
  id: string;
  title: string;
  synopsis: string;
  acts: Act[];
  scenes: Scene[];
};

// Construye el objeto persistible con la marca de tiempo actual.
export function toProjectData(snapshot: ProjectSnapshot): ProjectData {
  return {
    id: snapshot.id,
    title: snapshot.title,
    synopsis: snapshot.synopsis,
    acts: snapshot.acts,
    scenes: snapshot.scenes,
    updatedAt: new Date().toISOString(),
  };
}

export function generateMarkdownText(project: ProjectSnapshot): string {
  let md = `# ${project.title} - Guion Narrativo\n\n`;
  md += `**Sinopsis General:** ${project.synopsis}\n\n`;
  project.acts.forEach((act) => {
    md += `## ACTO ${act.orden}: ${act.nombre}\n`;
    if (act.sinopsis) md += `*Sinopsis:* ${act.sinopsis}\n`;
    md += `> **Plot Point ${act.orden}:** ${act.plot_point}\n\n`;
    const actScenes = project.scenes
      .filter((s) => s.act_id === act.id)
      .sort((a, b) => a.orden - b.orden);
    if (actScenes.length === 0) {
      md += `*Sin escenas en este acto.*\n\n`;
    } else {
      actScenes.forEach((s) => {
        md += `### Escena ${s.orden}: ${s.titulo} [${s.estado}]\n`;
        if (s.descripcion) md += `**Descripción:** ${s.descripcion}\n\n`;
        if (s.escaleta) md += `**Escaleta:**\n${s.escaleta}\n\n`;
        if (s.dialogos) md += `**Diálogos:**\n\`\`\`text\n${s.dialogos}\n\`\`\`\n\n`;
        const sceneConns = s.conexiones || [];
        if (sceneConns.length > 0) {
          md += `**Conexiones:**\n`;
          sceneConns.forEach((conn) => {
            const target = project.scenes.find((sc) => sc.id === conn.target_scene_id);
            const targetName = target?.titulo || '⚠️ Escena desconocida';
            if (conn.label) {
              md += `- [${conn.label}] ➔ *${targetName}*\n`;
            } else {
              md += `- ➔ *${targetName}*\n`;
            }
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
    }
  });
  return md;
}

export function generateProjectJson(project: ProjectSnapshot): string {
  return JSON.stringify(toProjectData(project), null, 2);
}

export function generateTweeText(project: ProjectSnapshot, format: 'Harlowe' | 'SugarCube'): string {
  const ifid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();

  let twee = '';
  twee += `:: StoryTitle\n${project.title}\n\n`;

  const sortedActs = [...project.acts].sort((a, b) => a.orden - b.orden);
  const firstAct = sortedActs[0];
  const firstScene = firstAct
    ? project.scenes.filter((s) => s.act_id === firstAct.id).sort((a, b) => a.orden - b.orden)[0]
    : null;

  const passageNameMap = new Map<string, string>();
  const titleCounts = new Map<string, number>();
  for (const scene of project.scenes) {
    titleCounts.set(scene.titulo, (titleCounts.get(scene.titulo) || 0) + 1);
  }
  for (const scene of project.scenes) {
    if ((titleCounts.get(scene.titulo) || 0) > 1) {
      const act = project.acts.find((a) => a.id === scene.act_id);
      passageNameMap.set(scene.id, `${scene.titulo} (${act?.nombre || 'Sin acto'})`);
    } else {
      passageNameMap.set(scene.id, scene.titulo);
    }
  }
  const getPassageName = (sceneId: string): string =>
    passageNameMap.get(sceneId) || 'Pasaje desconocido';

  const startPassageName = firstScene ? getPassageName(firstScene.id) : 'Start';
  const formatVersion = format === 'Harlowe' ? '3.3.9' : '2.36.1';

  twee += `:: StoryData\n`;
  twee += JSON.stringify(
    { ifid, format, 'format-version': formatVersion, start: startPassageName },
    null,
    2
  );
  twee += '\n\n';

  const PASSAGE_WIDTH = 100;
  const PASSAGE_HEIGHT = 100;
  const COL_GAP = 220;
  const ROW_GAP = 160;
  const START_X = 100;
  const START_Y = 100;

  for (let actIdx = 0; actIdx < sortedActs.length; actIdx++) {
    const act = sortedActs[actIdx];
    const actScenes = project.scenes
      .filter((s) => s.act_id === act.id)
      .sort((a, b) => a.orden - b.orden);

    for (let sceneIdx = 0; sceneIdx < actScenes.length; sceneIdx++) {
      const scene = actScenes[sceneIdx];
      const passageName = getPassageName(scene.id);
      const posX = START_X + actIdx * COL_GAP;
      const posY = START_Y + sceneIdx * ROW_GAP;
      const metadata = JSON.stringify({
        position: `${posX},${posY}`,
        size: `${PASSAGE_WIDTH},${PASSAGE_HEIGHT}`,
      });

      twee += `:: ${passageName} ${metadata}\n`;
      if (scene.descripcion) twee += `${scene.descripcion}\n\n`;
      if (scene.escaleta) twee += `${scene.escaleta}\n\n`;
      if (scene.dialogos) twee += `${scene.dialogos}\n\n`;
      const connections = scene.conexiones || [];
      if (connections.length > 0) {
        for (const conn of connections) {
          const targetName = getPassageName(conn.target_scene_id);
          if (conn.label) {
            twee += `[[${conn.label}|${targetName}]]\n`;
          } else {
            twee += `[[${targetName}]]\n`;
          }
        }
      }
      twee += '\n';
    }
  }
  return twee;
}

// Guarda contenido en disco usando el File System Access API cuando está
// disponible, con fallback a descarga por blob.
export async function saveFileWithPicker(
  content: string,
  defaultName: string,
  mimeType: string,
  extension: string,
  description: string
): Promise<boolean> {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description,
            accept: { [mimeType]: [extension] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false;
      }
    }
  }
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
