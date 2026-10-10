import { projectApi } from '../api/projectApi';
import {
  generateMarkdownText,
  generateProjectJson,
  generateTweeText,
  saveFileWithPicker,
  toProjectData,
  type ProjectSnapshot,
} from '../lib/export';

const slug = (title: string) => title.toLowerCase().replace(/\s+/g, '_');

// Exportación y guardado del proyecto en sus distintos formatos.
export function useProjectExport(params: {
  snapshot: ProjectSnapshot;
  showNotification: (msg: string) => void;
}) {
  const { snapshot, showNotification } = params;

  const handleSaveJson = async () => {
    await projectApi.guardar(toProjectData(snapshot));
    const saved = await saveFileWithPicker(
      generateProjectJson(snapshot),
      `${slug(snapshot.title)}.json`,
      'application/json',
      '.json',
      'Archivo JSON de GuionStudio'
    );
    if (saved) showNotification(`Proyecto "${snapshot.title}" guardado exitosamente (.json)`);
    return saved;
  };

  const handleSaveAs = async (newTitle: string) => {
    if (!newTitle.trim()) return false;
    const titulo = newTitle.trim();
    const next = { ...snapshot, title: titulo };
    await projectApi.guardar(toProjectData(next));
    const saved = await saveFileWithPicker(
      generateProjectJson(next),
      `${slug(titulo)}.json`,
      'application/json',
      '.json',
      'Archivo JSON de GuionStudio'
    );
    if (saved) showNotification(`Proyecto guardado como "${titulo}"`);
    return saved;
  };

  const handleSaveMd = async () => {
    const saved = await saveFileWithPicker(
      generateMarkdownText(snapshot),
      `${snapshot.title}.md`,
      'text/markdown',
      '.md',
      'Documento Markdown'
    );
    if (saved) showNotification(`Guion guardado como "${snapshot.title}.md"`);
    return saved;
  };

  const handleSaveTwee = async (format: 'Harlowe' | 'SugarCube') => {
    const saved = await saveFileWithPicker(
      generateTweeText(snapshot, format),
      `${snapshot.title}.twee`,
      'text/plain',
      '.twee',
      'Archivo de Twine (Twee 3)'
    );
    if (saved) showNotification(`Guion exportado como "${snapshot.title}.twee" (${format})`);
    return saved;
  };

  return { handleSaveJson, handleSaveAs, handleSaveMd, handleSaveTwee };
}
