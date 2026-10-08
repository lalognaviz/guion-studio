import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  saveProjectToStorage,
  loadProjectFromStorage,
  INITIAL_ACTS,
  INITIAL_SCENES,
} from '../lib/storage';
import { fetchDetallesProyecto } from '../api/client';
import type { Act, Scene, ProjectData } from '../lib/types';
import { MaximizedSceneModal } from '../components/MaximizedSceneModal';

// -------------------------------------------------------------
// 2. DASHBOARD DEL GUION & DETALLES UNIFICADO (path="/tablero/:id" & "/proyecto/:id")
// -------------------------------------------------------------
export function DashboardGuion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState<string | number>(id || 'proj-1');
  const [projectTitle, setProjectTitle] = useState<string>('CyberNights');
  const [projectSynopsis, setProjectSynopsis] = useState<string>('Un thriller cyberpunk sobre conspiraciones corporativas y redes de clonación subterráneas.');
  const [acts, setActs] = useState<Act[]>(INITIAL_ACTS);
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);

  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [maximizedScene, setMaximizedScene] = useState<Scene | null>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTitleInput, setSaveAsTitleInput] = useState('');
  const [isMdReaderOpen, setIsMdReaderOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'formatted' | 'raw' | 'json'>('formatted');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notification, setNotification] = useState<string | null>(null);
  const [isTweeExportOpen, setIsTweeExportOpen] = useState(false);
  const [tweeFormat, setTweeFormat] = useState<'Harlowe' | 'SugarCube'>('Harlowe');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load project from localStorage or IPC on mount
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
          if (!id || String(data.id) === String(id) || id.startsWith('proj-') || id.startsWith('new-')) {
            setProjectId(data.id || `proj-${id || '1'}`);
            setProjectTitle(data.title);
            if (data.synopsis !== undefined) setProjectSynopsis(data.synopsis);
            setActs(data.acts);
            setScenes(data.scenes);
            return;
          }
        }
      } catch (e) {
        console.error("Error al cargar proyecto guardado:", e);
      }
    }

    if (id) {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        fetchDetallesProyecto(numericId).then((det) => {
          if (det) {
            if (det.titulo) setProjectTitle(det.titulo);
            if (det.sinopsis) setProjectSynopsis(det.sinopsis);
            setProjectId(`proj-${det.id}`);
          }
        }).catch(() => {});
      }
    }
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const saveState = (
    newTitle: string = projectTitle,
    newSynopsis: string = projectSynopsis,
    newActs: Act[] = acts,
    newScenes: Scene[] = scenes
  ) => {
    const data: ProjectData = {
      id: projectId,
      title: newTitle,
      synopsis: newSynopsis,
      acts: newActs,
      scenes: newScenes,
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(data);
  };

  const handleAddScene = (act_id: string) => {
    const actScenes = scenes.filter((s) => s.act_id === act_id);
    const newScene: Scene = {
      id: `scn-${Date.now()}`,
      act_id,
      orden: actScenes.length + 1,
      titulo: `Nueva Escena ${actScenes.length + 1}`,
      estado: 'Borrador',
      descripcion: '',
      escaleta: '',
      dialogos: '',
      conexiones: [],
    };
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
    showNotification(`Escena creada en Acto ${acts.find((a) => a.id === act_id)?.orden}`);
  };

  const handleUpdateScene = (updated: Scene) => {
    const updatedScenes = scenes.map((s) => (s.id === updated.id ? updated : s));
    setScenes(updatedScenes);
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
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
    saveState(projectTitle, projectSynopsis, acts, updatedScenes);
    showNotification('Escena eliminada');
  };

  const handleMoveScene = (sceneId: string, direction: 'up' | 'down') => {
    const sceneToMove = scenes.find((s) => s.id === sceneId);
    if (!sceneToMove) return;

    const actScenes = scenes
      .filter((s) => s.act_id === sceneToMove.act_id)
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
      saveState(projectTitle, projectSynopsis, acts, updatedScenes);
    } else if (direction === 'down' && index < actScenes.length - 1) {
      const nextScene = actScenes[index + 1];
      const updatedScenes = scenes.map((s) => {
        if (s.id === sceneToMove.id) return { ...s, orden: nextScene.orden };
        if (s.id === nextScene.id) return { ...s, orden: sceneToMove.orden };
        return s;
      });
      setScenes(updatedScenes);
      saveState(projectTitle, projectSynopsis, acts, updatedScenes);
    }
  };

  const generateMarkdownText = () => {
    let md = `# ${projectTitle} - Guion Narrativo\n\n`;
    md += `**Sinopsis General:** ${projectSynopsis}\n\n`;
    acts.forEach(act => {
      md += `## ACTO ${act.orden}: ${act.nombre}\n`;
      if (act.sinopsis) md += `*Sinopsis:* ${act.sinopsis}\n`;
      md += `> **Plot Point ${act.orden}:** ${act.plot_point}\n\n`;
      const actScenes = scenes.filter(s => s.act_id === act.id).sort((a, b) => a.orden - b.orden);
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
              const target = scenes.find((sc) => sc.id === conn.target_scene_id);
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
  };

  const generateProjectJson = () => {
    const data: ProjectData = {
      id: projectId,
      title: projectTitle,
      synopsis: projectSynopsis,
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const applyInlineStyles = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={keyIdx++} className="font-bold text-brand-text">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={keyIdx++} className="italic text-slate-400">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={keyIdx++} className="bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[11px] font-mono">{match[4]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  const renderFormattedMarkdown = (mdText: string) => {
    const lines = mdText.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### '))
        return <h3 key={i} className="text-sm font-bold text-indigo-300 mt-4 mb-1">{applyInlineStyles(line.slice(4))}</h3>;
      if (line.startsWith('## '))
        return <h2 key={i} className="text-base font-bold text-violet-300 mt-5 mb-1.5 border-b border-[#3B3E47] pb-1">{applyInlineStyles(line.slice(3))}</h2>;
      if (line.startsWith('# '))
        return <h1 key={i} className="text-xl font-black text-white mt-2 mb-2">{applyInlineStyles(line.slice(2))}</h1>;
      if (line.startsWith('> '))
        return <blockquote key={i} className="border-l-2 border-amber-500/60 pl-3 text-xs text-amber-200/80 italic my-1">{applyInlineStyles(line.slice(2))}</blockquote>;
      if (line.trim() === '---')
        return <hr key={i} className="border-[#3B3E47] my-3" />;
      if (line.trim().startsWith('```'))
        return null;
      if (line.trim() === '')
        return <div key={i} className="h-2" />;
      return <p key={i} className="text-xs text-slate-300 leading-relaxed my-0.5">{applyInlineStyles(line)}</p>;
    });
  };

  const renderColoredJson = (jsonText: string) => {
    const colored = jsonText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)"(?=\s*:)/g, '<span class="text-[#FD7014]">"$1"</span>')
      .replace(/:\s*"([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
      .replace(/:\s*(\d+)/g, ': <span class="text-amber-400">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-rose-400">$1</span>');
    return <pre className="text-xs leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: colored }} />;
  };

  const handleNewProject = () => {
    if (window.confirm('¿Deseas iniciar un nuevo proyecto? Los cambios no guardados se perderán.')) {
      const newId = `proj-${Date.now()}`;
      const newTitle = 'Nuevo Proyecto Guion';
      const newSynopsis = 'Escribe aquí la sinopsis argumental de tu nuevo proyecto...';
      setProjectId(newId);
      setProjectTitle(newTitle);
      setProjectSynopsis(newSynopsis);
      setActs(INITIAL_ACTS);
      setScenes([]);
      const newProject: ProjectData = {
        id: newId,
        title: newTitle,
        synopsis: newSynopsis,
        acts: INITIAL_ACTS,
        scenes: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toLocaleString(),
      };
      saveProjectToStorage(newProject);
      showNotification('Nuevo proyecto creado');
      setIsFileMenuOpen(false);
      navigate(`/tablero/${newId}`);
    }
  };

  const saveFileWithPicker = async (
    content: string,
    defaultName: string,
    mimeType: string,
    extension: string,
    description: string
  ) => {
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
  };

  const handleSaveJson = async () => {
    const data: ProjectData = {
      id: projectId,
      title: projectTitle,
      synopsis: projectSynopsis,
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(data);
    const jsonStr = JSON.stringify(data, null, 2);
    const saved = await saveFileWithPicker(
      jsonStr,
      `${projectTitle.toLowerCase().replace(/\s+/g, '_')}.json`,
      'application/json',
      '.json',
      'Archivo JSON de GuionStudio'
    );
    if (saved) {
      showNotification(`Proyecto "${projectTitle}" guardado exitosamente (.json)`);
    }
    setIsFileMenuOpen(false);
  };

  const handleSaveAsSubmit = async () => {
    if (!saveAsTitleInput.trim()) return;
    const newTitle = saveAsTitleInput.trim();
    setProjectTitle(newTitle);
    const data: ProjectData = {
      id: projectId,
      title: newTitle,
      synopsis: projectSynopsis,
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(data);
    const jsonStr = JSON.stringify(data, null, 2);
    const saved = await saveFileWithPicker(
      jsonStr,
      `${newTitle.toLowerCase().replace(/\s+/g, '_')}.json`,
      'application/json',
      '.json',
      'Archivo JSON de GuionStudio'
    );
    if (saved) {
      showNotification(`Proyecto guardado como "${newTitle}"`);
    }
    setIsSaveAsModalOpen(false);
  };

  const handleOpenJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ProjectData = JSON.parse(content);
        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          const loadedId = data.id || `proj-${Date.now()}`;
          const loadedData: ProjectData = {
            ...data,
            id: loadedId,
          };
          setProjectId(loadedId);
          setProjectTitle(loadedData.title);
          if (loadedData.synopsis !== undefined) setProjectSynopsis(loadedData.synopsis);
          setActs(loadedData.acts);
          setScenes(loadedData.scenes);
          saveProjectToStorage(loadedData);
          showNotification(`Proyecto "${loadedData.title}" cargado correctamente`);
        } else {
          alert('El archivo JSON no tiene la estructura de GuionStudio válida.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    setIsFileMenuOpen(false);
  };

  const handleSaveMd = async () => {
    const mdContent = generateMarkdownText();
    const saved = await saveFileWithPicker(
      mdContent,
      `${projectTitle}.md`,
      'text/markdown',
      '.md',
      'Documento Markdown'
    );
    if (saved) {
      showNotification(`Guion guardado como "${projectTitle}.md"`);
    }
    setIsFileMenuOpen(false);
  };

  const generateTweeText = (format: 'Harlowe' | 'SugarCube') => {
    const ifid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }).toUpperCase();

    let twee = '';
    twee += `:: StoryTitle\n${projectTitle}\n\n`;

    const sortedActs = [...acts].sort((a, b) => a.orden - b.orden);
    const firstAct = sortedActs[0];
    const firstScene = firstAct
      ? scenes.filter((s) => s.act_id === firstAct.id).sort((a, b) => a.orden - b.orden)[0]
      : null;

    const passageNameMap = new Map<string, string>();
    const titleCounts = new Map<string, number>();
    for (const scene of scenes) {
      titleCounts.set(scene.titulo, (titleCounts.get(scene.titulo) || 0) + 1);
    }
    for (const scene of scenes) {
      if ((titleCounts.get(scene.titulo) || 0) > 1) {
        const act = acts.find((a) => a.id === scene.act_id);
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
    twee += JSON.stringify({ ifid, format, 'format-version': formatVersion, start: startPassageName }, null, 2);
    twee += '\n\n';

    const PASSAGE_WIDTH = 100;
    const PASSAGE_HEIGHT = 100;
    const COL_GAP = 220;
    const ROW_GAP = 160;
    const START_X = 100;
    const START_Y = 100;

    for (let actIdx = 0; actIdx < sortedActs.length; actIdx++) {
      const act = sortedActs[actIdx];
      const actScenes = scenes
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
  };

  const handleSaveTwee = async (format: 'Harlowe' | 'SugarCube') => {
    const tweeContent = generateTweeText(format);
    const saved = await saveFileWithPicker(
      tweeContent,
      `${projectTitle}.twee`,
      'text/plain',
      '.twee',
      'Archivo de Twine (Twee 3)'
    );
    if (saved) {
      showNotification(`Guion exportado como "${projectTitle}.twee" (${format})`);
    }
    setIsTweeExportOpen(false);
    setIsFileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-brand-bg text-brand-text' : 'bg-brand-bg text-brand-text'} flex flex-col font-sans transition-colors duration-200 selection:bg-[#FD7014]/30 selection:text-brand-text`}>
      {/* Top Bar Header */}
      <header className="bg-brand-surface/90 backdrop-blur-md text-white px-6 py-3.5 flex items-center justify-between border-b border-[#3B3E47] shadow-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5"
            title="Volver a la lista de proyectos"
          >
            ← Proyectos
          </button>

          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            Guion<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
          </h1>

          {/* Archivo Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              className="bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5"
            >
              <span>📂 Archivo</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isFileMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-brand-surface border border-[#3B3E47] rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-md">
                <button
                  onClick={handleNewProject}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  📄 Nuevo Proyecto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  📂 Abrir Proyecto...
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleOpenJson}
                  accept=".json,.guion"
                  className="hidden"
                />
                <hr className="border-[#3B3E47] my-1" />
                <button
                  onClick={handleSaveJson}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  💾 Guardar
                </button>
                <button
                  onClick={() => {
                    setSaveAsTitleInput(projectTitle);
                    setIsSaveAsModalOpen(true);
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  📑 Guardar Como...
                </button>
                <button
                  onClick={handleSaveMd}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  📝 Guardar en .md
                </button>
                <button
                  onClick={() => {
                    setIsTweeExportOpen(true);
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  🎮 Exportar a Twine (.twee)
                </button>
                <hr className="border-[#3B3E47] my-1" />
                <button
                  onClick={() => {
                    setPreviewTab('formatted');
                    setIsMdReaderOpen(true);
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#FD7014] hover:bg-slate-800 font-medium flex items-center gap-2"
                >
                  vista previa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Header controls */}
        <div className="flex items-center gap-3">
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
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-[#FD7014] to-[#e65f0f] text-white px-5 py-2.5 rounded-xl shadow-2xl text-xs font-bold z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Main Script Dashboard Body */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          
          {/* UNIFIED PROJECT DETAILS CARD (EDITABLE) */}
          <div className="bg-brand-surface/80 backdrop-blur-sm border border-[#3B3E47]/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3B3E47] pb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-[11px] font-black tracking-wider text-violet-300 bg-[#FD7014]/10/60 border border-violet-800/60 px-3 py-1.5 rounded-lg uppercase shrink-0">
                  Proyecto Activo
                </span>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectTitle(val);
                    saveState(val, projectSynopsis, acts, scenes);
                  }}
                  className="text-2xl md:text-3xl font-black text-brand-text bg-brand-bg/80 border border-[#3B3E47] focus:border-[#FD7014] rounded-xl px-3.5 py-1.5 w-full transition focus:outline-none tracking-tight"
                  placeholder="Nombre del proyecto..."
                  title="Haz clic para editar el nombre del proyecto"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sinopsis Argumental del Proyecto:
              </label>
              <textarea
                value={projectSynopsis}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectSynopsis(val);
                  saveState(projectTitle, val, acts, scenes);
                }}
                rows={2}
                className="w-full bg-brand-bg/80 border border-[#3B3E47]/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#FD7014] leading-relaxed transition font-sans"
                placeholder="Escribe la sinopsis argumental del proyecto..."
                title="Haz clic para editar la sinopsis del proyecto"
              />
            </div>
          </div>

          {/* 3 SECTIONS FOR 3 ACTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {acts.map((act) => {
              const actScenes = scenes
                .filter((s) => s.act_id === act.id)
                .sort((a, b) => a.orden - b.orden);

              // Distinct color styles per Act for clear visual grouping
              const actBadgeStyle = act.orden === 1
                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                : act.orden === 2
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';

              return (
                <div
                  key={act.id}
                  className="bg-brand-surface/80 backdrop-blur-sm border border-[#3B3E47]/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-200 min-w-0"
                >
                  {/* Act Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${actBadgeStyle}`}>
                          Acto {act.orden}: {act.nombre}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {actScenes.length} escena(s)
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
                          onClick={() => handleAddScene(act.id)}
                          className="bg-[#FD7014]/20 hover:bg-[#FD7014]/30 text-violet-300 border border-[#FD7014]/40 hover:border-[#FD7014] text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                        >
                          + Nueva Escena
                        </button>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {actScenes.length === 0 ? (
                          <div className="text-xs text-slate-500 italic p-4 text-center bg-brand-bg/40 rounded-xl border border-[#3B3E47]/50">
                            No hay escenas en este acto. ¡Haz clic en "+ Nueva Escena" para añadir una!
                          </div>
                        ) : (
                          actScenes.map((scene) => {
                            const isExpanded = expandedSceneId === scene.id;

                            return (
                              <div
                                key={scene.id}
                                className="bg-brand-bg/80 border border-[#3B3E47] hover:border-slate-700 rounded-xl p-3 space-y-2 transition min-w-0"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className="font-mono text-slate-400 font-bold text-xs shrink-0">
                                      #{scene.orden}
                                    </span>
                                    <input
                                      type="text"
                                      value={scene.titulo}
                                      onChange={(e) => handleUpdateScene({ ...scene, titulo: e.target.value })}
                                      className="bg-transparent text-brand-text font-semibold text-xs focus:outline-none focus:bg-brand-surface px-1.5 py-0.5 rounded truncate flex-1 min-w-0 border border-transparent focus:border-slate-700"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Estado Selector */}
                                    <select
                                      value={scene.estado}
                                      onChange={(e) =>
                                        handleUpdateScene({
                                          ...scene,
                                          estado: e.target.value as 'Borrador' | 'Revisado' | 'Final',
                                        })
                                      }
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
                                        scene.estado === 'Final'
                                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                          : scene.estado === 'Revisado'
                                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                          : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                                      }`}
                                    >
                                      <option value="Borrador">Borrador</option>
                                      <option value="Revisado">Revisado</option>
                                      <option value="Final">Final</option>
                                    </select>

                                    {/* Reorder */}
                                    <button
                                      onClick={() => handleMoveScene(scene.id, 'up')}
                                      className="text-slate-400 hover:text-slate-200 text-[10px] px-1"
                                      title="Mover arriba"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => handleMoveScene(scene.id, 'down')}
                                      className="text-slate-400 hover:text-slate-200 text-[10px] px-1"
                                      title="Mover abajo"
                                    >
                                      ▼
                                    </button>

                                    {/* Toggle Inline Desplegable */}
                                    <button
                                      onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                                        isExpanded
                                          ? 'bg-gradient-to-r from-[#FD7014] to-[#e65f0f] text-white border-transparent shadow-md'
                                          : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/80 border-slate-700/80'
                                      }`}
                                      title={isExpanded ? 'Contraer escena' : 'Desplegar detalles de escena'}
                                    >
                                      <span>{isExpanded ? '➖' : '➕'}</span>
                                    </button>

                                    {/* Maximize */}
                                    <button
                                      onClick={() => setMaximizedScene(scene)}
                                      className="text-slate-400 hover:text-[#FD7014] text-xs px-1"
                                      title="Maximizar escena para edición completa"
                                    >
                                      ⛶
                                    </button>

                                    {/* Delete */}
                                    <button
                                      onClick={() => handleDeleteScene(scene.id)}
                                      className="text-slate-500 hover:text-rose-400 text-xs px-1"
                                      title="Eliminar escena"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                {/* Inline Expanded Form */}
                                {isExpanded && (
                                  <div className="pt-2 border-t border-[#3B3E47] space-y-2 text-[11px]">
                                    <div>
                                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                        Descripción / Sinopsis:
                                      </label>
                                      <textarea
                                        value={scene.descripcion}
                                        onChange={(e) => handleUpdateScene({ ...scene, descripcion: e.target.value })}
                                        rows={2}
                                        className="w-full bg-brand-surface border border-[#3B3E47] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FD7014]"
                                        placeholder="Descripción de la escena..."
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                        Escaleta (Beat Sheet):
                                      </label>
                                      <textarea
                                        value={scene.escaleta}
                                        onChange={(e) => handleUpdateScene({ ...scene, escaleta: e.target.value })}
                                        rows={2}
                                        className="w-full bg-brand-surface border border-[#3B3E47] rounded-lg p-2 text-slate-200 font-mono text-[10px] focus:outline-none focus:border-[#FD7014]"
                                        placeholder="Escaleta paso a paso..."
                                      />
                                    </div>
                                  </div>
                                )}
                                {(scene.conexiones || []).length > 0 && (
                                  <div className="flex items-center gap-1 text-[9px] text-[#FD7014] font-semibold bg-[#FD7014]/10/40 border border-violet-800/40 px-2 py-0.5 rounded-md w-fit mt-1">
                                    <span>🔗</span>
                                    <span>{(scene.conexiones || []).length} conexión{(scene.conexiones || []).length > 1 ? 'es' : ''}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary Action: Go to Focused Editor for this Act */}
                  <div className="pt-4 mt-5 border-t border-[#3B3E47]/80">
                    <button
                      onClick={() => navigate(`/tablero/${id || '1'}/acto/${act.id}`)}
                      className="w-full bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-950/40 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Twee Export Format Modal */}
      {isTweeExportOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-brand-surface border border-[#3B3E47] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
              <span>🎮</span> Exportar a Twine (.twee)
            </h3>
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Selecciona el formato de historia:
              </label>
              <div className="space-y-2.5">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  tweeFormat === 'Harlowe'
                    ? 'bg-[#FD7014]/10/40 border-[#FD7014]/60 text-violet-200'
                    : 'bg-brand-bg/60 border-[#3B3E47] text-slate-400 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="twee-format"
                    value="Harlowe"
                    checked={tweeFormat === 'Harlowe'}
                    onChange={() => setTweeFormat('Harlowe')}
                    className="mt-0.5 accent-violet-500"
                  />
                  <div>
                    <span className="text-xs font-bold block text-brand-text">Harlowe 3.x (Recomendado)</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Formato estándar de Twine para narrativa interactiva y ficción. Fácil de usar y predeterminado.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  tweeFormat === 'SugarCube'
                    ? 'bg-[#FD7014]/10/40 border-[#FD7014]/60 text-violet-200'
                    : 'bg-brand-bg/60 border-[#3B3E47] text-slate-400 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="twee-format"
                    value="SugarCube"
                    checked={tweeFormat === 'SugarCube'}
                    onChange={() => setTweeFormat('SugarCube')}
                    className="mt-0.5 accent-violet-500"
                  />
                  <div>
                    <span className="text-xs font-bold block text-brand-text">SugarCube 2.x</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Formato avanzado con integración de JavaScript, inventarios y estado de juego completo.</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsTweeExportOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveTwee(tweeFormat)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Exportar .twee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Modal */}
      {isSaveAsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-brand-surface border border-[#3B3E47] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-brand-text mb-2">Guardar Proyecto Como...</h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa un nuevo nombre para el archivo de proyecto.
            </p>
            <input
              type="text"
              value={saveAsTitleInput}
              onChange={(e) => setSaveAsTitleInput(e.target.value)}
              className="w-full bg-brand-bg border border-[#3B3E47] rounded-xl p-3 text-sm text-brand-text mb-6 focus:outline-none focus:border-[#FD7014]"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsSaveAsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsSubmit}
                className="px-4 py-2 bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Descarga Directa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal with Tabs */}
      {isMdReaderOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-brand-surface border border-[#3B3E47] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-brand-surface border-b border-[#3B3E47] flex items-center justify-between">
              <h3 className="text-lg font-bold text-violet-300 flex items-center gap-2">
                <span>📖</span> Vista Previa del Guion
              </h3>
              <button
                onClick={() => setIsMdReaderOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-[#3B3E47] bg-brand-surface/80 px-6">
              {([
                { key: 'formatted' as const, label: '📖 Formateado' },
                { key: 'raw' as const, label: '📝 Markdown' },
                { key: 'json' as const, label: '📦 JSON' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPreviewTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                    previewTab === tab.key
                      ? 'text-violet-300 border-[#FD7014] bg-[#FD7014]/10/30'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-brand-bg scrollbar-hide">
              {previewTab === 'formatted' && (
                <div className="prose-custom">
                  {renderFormattedMarkdown(generateMarkdownText())}
                </div>
              )}
              {previewTab === 'raw' && (
                <div className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {generateMarkdownText()}
                </div>
              )}
              {previewTab === 'json' && (
                <div className="font-mono text-slate-200">
                  {renderColoredJson(generateProjectJson())}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-brand-surface border-t border-[#3B3E47] flex items-center justify-between">
              <button
                onClick={() => {
                  const content = previewTab === 'json'
                    ? generateProjectJson()
                    : generateMarkdownText();
                  navigator.clipboard.writeText(content);
                  showNotification(
                    previewTab === 'json'
                      ? 'JSON copiado al portapapeles'
                      : 'Markdown copiado al portapapeles'
                  );
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5"
              >
                📋 Copiar {previewTab === 'json' ? 'JSON' : 'Markdown'}
              </button>
              <button
                onClick={() => setIsMdReaderOpen(false)}
                className="bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export for route compatibility
export function DetallesProyecto() {
  return <DashboardGuion />;
}

