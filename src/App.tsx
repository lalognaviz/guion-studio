import React, { useState, useEffect, useRef } from 'react';

type Scene = {  
  id: string;  
  act_id: string;  
  orden: number;  
  titulo: string;  
  estado: 'Borrador' | 'Revisado' | 'Final';  
  descripcion: string; // Sinopsis breve
  escaleta: string;    // Escena detallada / Beat sheet
  diseno_nivel?: string;  
  sonido?: string;  
  texto_juego?: string;  
  dialogos?: string;  
};

type Act = {  
  id: string;  
  orden: number;  
  nombre: string;  
  plot_point: string;  
};

type ProjectData = {
  id: string;
  title: string;
  acts: Act[];
  scenes: Scene[];
  updatedAt: string;
};

const INITIAL_ACTS: Act[] = [  
  { id: 'act-1', orden: 1, nombre: 'Planteamiento', plot_point: 'La guardia ataca el mercado; el jugador huye a las alcantarillas.' },  
  { id: 'act-2', orden: 2, nombre: 'Confrontación', plot_point: 'El jugador descubre que es un clon y debe decidir su lealtad.' },  
  { id: 'act-3', orden: 3, nombre: 'Resolución', plot_point: 'Batalla final en la aguja corporativa.' },  
];

const INITIAL_SCENES: Scene[] = [  
  { 
    id: 'scn-1', 
    act_id: 'act-1', 
    orden: 1, 
    titulo: 'El Callejón de Inicio', 
    estado: 'Revisado', 
    descripcion: 'El protagonista despierta en un callejón oscuro tras la explosión.',
    escaleta: '1. El personaje recupera el sentido entre escombros.\n2. Encuentra una linterna averiada y escucha pasos sospechosos.\n3. Huye por la rejilla del alcantarillado antes de ser visto por la patrulla.',
    dialogos: 'JUGADOR\n(Confundido)\n¿Dónde estoy?... Mi cabeza me va a explotar.' 
  },  
  { 
    id: 'scn-2', 
    act_id: 'act-1', 
    orden: 2, 
    titulo: 'Encuentro con el Mercader', 
    estado: 'Borrador', 
    descripcion: 'Llegada al mercado subterráneo e interactuación con el mercader.',
    escaleta: '1. Entrada al mercado iluminado por neones subterráneos.\n2. Conversación con Jax el Mercader.\n3. Intercambio de piezas por la primera arma corta.',
    dialogos: 'MERCADER\n¡Ey, tú! Acércate al fuego antes de que te congelas.' 
  },  
  { 
    id: 'scn-3', 
    act_id: 'act-2', 
    orden: 1, 
    titulo: 'Las Alcantarillas', 
    estado: 'Borrador', 
    descripcion: 'Navegación y combate con mutantes en los túneles del sector 7.',
    escaleta: '1. Tramo sigiloso esquivando Mutantes Ciegos.\n2. Resolución del puzle de tuberías de gas.\n3. Emboscada en la tubería principal.' 
  },  
];

export default function App() {  
  // Project State
  const [projectId, setProjectId] = useState<string>('proj-1');
  const [projectTitle, setProjectTitle] = useState<string>('CyberNights');
  const [acts, setActs] = useState<Act[]>(INITIAL_ACTS);  
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);  

  // Dropdown & Expand state
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  // Save As Modal State
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTitleInput, setSaveAsTitleInput] = useState('');

  // Maximized Scene Modal state
  const [maximizedScene, setMaximizedScene] = useState<Scene | null>(null);

  // Markdown Reader Modal state
  const [isMdReaderOpen, setIsMdReaderOpen] = useState(false);

  // UI theme and drawers
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');  
  const [isAiOpen, setIsAiOpen] = useState(false);  
  const [notification, setNotification] = useState<string | null>(null);

  // File input ref for opening projects
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load project from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('guionstudio_active_project');
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          setProjectId(data.id || 'proj-1');
          setProjectTitle(data.title);
          setActs(data.acts);
          setScenes(data.scenes);
        }
      } catch (e) {
        console.error("Error al cargar proyecto guardado:", e);
      }
    }
  }, []);

  // Sync theme
  useEffect(() => {  
    if (theme === 'dark') {  
      document.documentElement.classList.add('dark');  
    } else {  
      document.documentElement.classList.remove('dark');  
    }  
  }, [theme]);

  // Close dropdown menu when clicking outside
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

  // GENERATE MARKDOWN CONTENT
  const generateMarkdownText = () => {
    let md = `# ${projectTitle} - Guion Narrativo\n\n`;
    acts.forEach(act => {
      md += `## ACTO ${act.orden}: ${act.nombre}\n`;
      md += `> **Plot Point ${act.orden}:** ${act.plot_point}\n\n`;
      const actScenes = scenes.filter(s => s.act_id === act.id).sort((a, b) => a.orden - b.orden);
      if (actScenes.length === 0) {
        md += `*(Sin escenas en este acto)*\n\n`;
      } else {
        actScenes.forEach(scene => {
          md += `### Escena ${scene.orden}: ${scene.titulo}\n`;
          md += `* **Estado:** ${scene.estado}\n`;
          md += `* **Descripción:** ${scene.descripcion}\n\n`;
          md += `#### Escaleta Detallada\n${scene.escaleta}\n\n`;
          if (scene.dialogos) {
            md += `**[Diálogos]**\n${scene.dialogos}\n\n`;
          }
          if (scene.diseno_nivel) {
            md += `* **Diseño de Nivel:** ${scene.diseno_nivel}\n\n`;
          }
          if (scene.sonido) {
            md += `* **Sonido:** ${scene.sonido}\n\n`;
          }
          md += `---\n\n`;
        });
      }
    });
    return md;
  };

  // PROJECT MANAGEMENT HANDLERS
  const handleNewProject = () => {
    setIsFileMenuOpen(false);
    if (scenes.length > 0) {
      const confirmNew = window.confirm("¿Deseas crear un nuevo proyecto? Asegúrate de haber guardado tus cambios.");
      if (!confirmNew) return;
    }
    const title = prompt("Título del Nuevo Proyecto:", "Nuevo Proyecto") || "Nuevo Proyecto";
    setProjectId(`proj-${Date.now()}`);
    setProjectTitle(title);
    setActs(INITIAL_ACTS);
    setScenes([]);
    setExpandedSceneId(null);
    showNotification(`Proyecto "${title}" creado.`);
  };

  const saveProjectToFile = (titleToUse: string) => {
    const projectData: ProjectData = {
      id: projectId,
      title: titleToUse,
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('guionstudio_active_project', JSON.stringify(projectData));

    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleToUse.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guion.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProject = () => {
    setIsFileMenuOpen(false);
    saveProjectToFile(projectTitle);
    showNotification(`Proyecto "${projectTitle}" guardado exitosamente.`);
  };

  // OPEN GUARDAR COMO MODAL
  const handleOpenSaveAsModal = () => {
    setIsFileMenuOpen(false);
    setSaveAsTitleInput(projectTitle);
    setIsSaveAsModalOpen(true);
  };

  // EXECUTE GUARDAR COMO WITH NATIVE FILE PICKER DIALOG OR DOWNLOAD FALLBACK
  const handleExecuteSaveAs = async (useNativePicker: boolean) => {
    if (!saveAsTitleInput || !saveAsTitleInput.trim()) return;

    const titleToUse = saveAsTitleInput.trim();
    setProjectTitle(titleToUse);

    const projectData: ProjectData = {
      id: projectId,
      title: titleToUse,
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('guionstudio_active_project', JSON.stringify(projectData));
    const jsonStr = JSON.stringify(projectData, null, 2);
    const defaultFilename = `${titleToUse.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guion.json`;

    setIsSaveAsModalOpen(false);

    if (useNativePicker && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: 'Proyecto GuionStudio (*.json, *.guion)',
            accept: { 'application/json': ['.json', '.guion'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        showNotification(`Proyecto guardado en la ruta seleccionada.`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled file picker dialog
        console.warn("showSaveFilePicker no se pudo completar, usando descarga directa", err);
      }
    }

    // Fallback direct download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Proyecto guardado como "${titleToUse}".`);
  };

  // SAVE AS .MD WITH FILE PICKER RUTA
  const handleSaveAsMarkdown = async () => {
    setIsFileMenuOpen(false);
    const mdContent = generateMarkdownText();
    const defaultFilename = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: 'Documento Markdown (*.md)',
            accept: { 'text/markdown': ['.md'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(mdContent);
        await writable.close();
        showNotification(`Guion .md guardado en la ruta seleccionada.`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn("showSaveFilePicker no disponible o cancelado", err);
      }
    }

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`Guion guardado como "${projectTitle}.md".`);
  };

  const handleOpenReader = () => {
    setIsFileMenuOpen(false);
    setIsMdReaderOpen(true);
  };

  const handleCopyMdToClipboard = () => {
    const mdText = generateMarkdownText();
    navigator.clipboard.writeText(mdText);
    showNotification("Texto Markdown copiado al portapapeles.");
  };

  const handleLoadProjectClick = () => {
    setIsFileMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileLoaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data: ProjectData = JSON.parse(content);

        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          setProjectId(data.id || `proj-${Date.now()}`);
          setProjectTitle(data.title);
          setActs(data.acts);
          setScenes(data.scenes);
          setExpandedSceneId(null);
          showNotification(`Proyecto "${data.title}" cargado exitosamente.`);
        } else {
          alert("El archivo seleccionado no tiene una estructura válida de GuionStudio.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // MOVE SCENE TO ANOTHER ACT
  const handleMoveSceneToAct = (sceneId: string, targetActId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setScenes(prev => {
      const movingScene = prev.find(s => s.id === sceneId);
      if (!movingScene || movingScene.act_id === targetActId) return prev;

      const targetActScenes = prev.filter(s => s.act_id === targetActId);
      const newOrden = targetActScenes.length + 1;

      return prev.map(s => s.id === sceneId ? { ...s, act_id: targetActId, orden: newOrden } : s);
    });
  };

  // MOVE SCENE ORDER UP OR DOWN WITHIN ACT
  const handleMoveSceneOrder = (sceneId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setScenes(prev => {
      const scene = prev.find(s => s.id === sceneId);
      if (!scene) return prev;

      const actScenes = prev.filter(s => s.act_id === scene.act_id).sort((a, b) => a.orden - b.orden);
      const currentIndex = actScenes.findIndex(s => s.id === sceneId);
      if (currentIndex === -1) return prev;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= actScenes.length) return prev;

      const reordered = [...actScenes];
      const temp = reordered[currentIndex];
      reordered[currentIndex] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      const updatedActScenes = reordered.map((s, idx) => ({ ...s, orden: idx + 1 }));

      return prev.map(s => {
        if (s.act_id === scene.act_id) {
          return updatedActScenes.find(u => u.id === s.id) || s;
        }
        return s;
      });
    });
  };

  // ADD SCENE - STARTS COLLAPSED
  const handleAddScene = (actId: string) => {
    const actScenes = scenes.filter(s => s.act_id === actId);
    const newSceneId = `scn-${Date.now()}`;
    const newScene: Scene = {
      id: newSceneId,
      act_id: actId,
      orden: actScenes.length + 1,
      titulo: `Nueva Escena ${actScenes.length + 1}`,
      estado: 'Borrador',
      descripcion: 'Breve sinopsis de la escena...',
      escaleta: 'Desglose detallado paso a paso de la escena...',
    };
    setScenes(prev => [...prev, newScene]);
    setExpandedSceneId(null);
  };

  const handleUpdateSceneField = (sceneId: string, field: keyof Scene, value: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [field]: value } : s));
  };

  const handleDeleteScene = (sceneId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    if (expandedSceneId === sceneId) setExpandedSceneId(null);
    if (maximizedScene?.id === sceneId) setMaximizedScene(null);
  };

  const handleToggleStateInline = (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      const nextState: Scene['estado'] = s.estado === 'Borrador' ? 'Revisado' : s.estado === 'Revisado' ? 'Final' : 'Borrador';
      return { ...s, estado: nextState };
    }));
  };

  const handleToggleExpandScene = (sceneId: string) => {
    setExpandedSceneId(prev => prev === sceneId ? null : sceneId);
  };

  // MAXIMIZE SCENE HANDLERS (Aceptar / Cancelar)
  const handleOpenMaximizeScene = (scene: Scene, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMaximizedScene({ ...scene }); // Draft clone
  };

  const handleAcceptMaximizedScene = () => {
    if (!maximizedScene) return;
    setScenes(prev => prev.map(s => s.id === maximizedScene.id ? maximizedScene : s));
    setMaximizedScene(null);
    showNotification(`Cambios en "${maximizedScene.titulo}" aceptados.`);
  };

  const handleCancelMaximizedScene = () => {
    setMaximizedScene(null);
  };

  const handleUpdatePlotPoint = (actId: string, plotPoint: string) => {
    setActs(prev => prev.map(a => a.id === actId ? { ...a, plot_point: plotPoint } : a));
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (  
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#18181b] text-gray-100' : 'bg-gray-100 text-gray-900'}`}>  
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileLoaded} 
        accept=".json,.guion" 
        className="hidden" 
      />

      {/* RESPONSIVE HEADER */}  
      <header className={`px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3 z-10 shrink-0 shadow-sm border-b ${theme === 'dark' ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-gray-200'}`}>  
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">  
          <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500 select-none tracking-wide shrink-0">  
            GuionStudio  
          </h1>  
          <div className={`hidden sm:block h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#3f3f46]' : 'bg-gray-300'}`}></div>  
          
          {/* Editable Project Title */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[140px] max-w-[280px]">
            <span className="text-xs font-semibold text-zinc-400 shrink-0 hidden xs:inline">Proyecto:</span>
            <input   
              type="text"   
              value={projectTitle}   
              onChange={(e) => setProjectTitle(e.target.value)}
              className={`w-full bg-transparent border rounded border-transparent hover:border-zinc-600 focus:border-emerald-500 text-sm sm:text-base font-semibold px-2 py-0.5 outline-none transition-colors truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}   
            />  
          </div>
        </div>  
          
        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">  
          
          {/* DROPDOWN ARCHIVO */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition-colors ${
                theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              📂 Archivo
              <span className="text-[10px]">▼</span>
            </button>

            {isFileMenuOpen && (
              <div className={`absolute right-0 sm:left-0 mt-1 w-56 rounded-lg shadow-xl border z-50 py-1 font-sans ${
                theme === 'dark' ? 'bg-[#27272a] border-[#3f3f46] text-zinc-100' : 'bg-white border-gray-200 text-gray-800'
              }`}>
                <button
                  onClick={handleNewProject}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📄 <span>Nuevo Proyecto</span>
                </button>

                <button
                  onClick={handleLoadProjectClick}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📂 <span>Abrir Proyecto...</span>
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#3f3f46]' : 'border-gray-200'}`}></div>

                <button
                  onClick={handleSaveProject}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                  }`}
                >
                  💾 <span>Guardar (.json)</span>
                </button>

                <button
                  onClick={handleOpenSaveAsModal}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📑 <span>Guardar Como...</span>
                </button>

                <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#3f3f46]' : 'border-gray-200'}`}></div>

                <button
                  onClick={handleSaveAsMarkdown}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 font-semibold transition-colors text-emerald-400 ${
                    theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📝 <span>Guardar en .md</span>
                </button>

                <button
                  onClick={handleOpenReader}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 font-semibold transition-colors text-purple-400 ${
                    theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📖 <span>Lector Markdown (.md)</span>
                </button>
              </div>
            )}
          </div>

          <button onClick={toggleTheme} className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-200 text-gray-700'}`}>  
            {theme === 'dark'   
              ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>  
              : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>  
            }  
          </button>  
          <button onClick={() => setIsAiOpen(!isAiOpen)} className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-purple-900/30 text-purple-400' : 'hover:bg-purple-100 text-purple-600'}`}>  
             <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"></path></svg>  
          </button>  
        </div>  
      </header>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span>✓</span> {notification}
        </div>
      )}

      {/* DYNAMIC RESPONSIVE MAIN CORKBOARD */}
      <main className="flex-1 flex overflow-hidden relative">  
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 p-4 sm:p-6 w-full h-full overflow-y-auto md:overflow-y-hidden md:overflow-x-auto">  
            
          {acts.map((act) => {
            const actScenes = scenes.filter(s => s.act_id === act.id).sort((a, b) => a.orden - b.orden);

            return (  
              <div   
                key={act.id}  
                className={`flex-1 min-w-[270px] flex flex-col border rounded-xl overflow-hidden shadow-sm transition-all duration-150 h-full ${
                  theme === 'dark' ? 'bg-[#202023] border-[#3f3f46]' : 'bg-white border-gray-200'
                }`}  
              >  
                {/* Act Header */}  
                <div className={`px-4 py-3 border-b flex justify-between items-center shrink-0 ${theme === 'dark' ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-gray-50 border-gray-200'}`}>  
                  <h2 className="font-bold uppercase tracking-wider text-xs flex items-center gap-2 select-none truncate">  
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${act.orden === 1 ? 'bg-blue-500' : act.orden === 2 ? 'bg-amber-500' : 'bg-teal-500'}`}></div>  
                    <span className="truncate">Acto {act.orden}: {act.nombre}</span>
                  </h2>  
                  <span className="text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-800/50 select-none shrink-0 ml-2">  
                    {actScenes.length} escenas  
                  </span>  
                </div>

                {/* COMPACT ESCENAS LIST */}  
                <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 min-h-[140px]">  
                  {actScenes.map((scene, index) => {
                    const isExpanded = expandedSceneId === scene.id;
                    const isFirst = index === 0;
                    const isLast = index === actScenes.length - 1;

                    return (  
                      <div   
                        key={scene.id}  
                        className={`border rounded-lg transition-all duration-150 group overflow-hidden ${
                          isExpanded 
                            ? (theme === 'dark' ? 'bg-[#27272a] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30' : 'bg-emerald-50/20 border-emerald-400 shadow-md')
                            : (theme === 'dark' ? 'bg-[#27272a]/70 border-[#3f3f46] hover:border-zinc-500' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300')
                        }`}  
                      >  
                        {/* COMPACT HEADER / ROW */}
                        <div 
                          onClick={() => handleToggleExpandScene(scene.id)}
                          className="px-3 py-2 flex items-center justify-between cursor-pointer select-none gap-2 hover:bg-zinc-700/20 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {/* Up / Down reordering buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button 
                                disabled={isFirst}
                                onClick={(e) => handleMoveSceneOrder(scene.id, 'up', e)}
                                className={`text-[9px] px-1 rounded leading-none ${isFirst ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                                title="Subir orden"
                              >
                                ▲
                              </button>
                              <button 
                                disabled={isLast}
                                onClick={(e) => handleMoveSceneOrder(scene.id, 'down', e)}
                                className={`text-[9px] px-1 rounded leading-none ${isLast ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                                title="Bajar orden"
                              >
                                ▼
                              </button>
                            </div>

                            <span className="text-xs font-semibold text-zinc-400 font-mono shrink-0">#{scene.orden}</span>
                            <h3 className="font-semibold text-xs truncate text-zinc-100">{scene.titulo}</h3>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Maximize Button */}
                            <button
                              onClick={(e) => handleOpenMaximizeScene(scene, e)}
                              className="text-[11px] p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700/50 rounded transition-colors"
                              title="Maximizar escena para edición cómoda"
                            >
                              ⛶
                            </button>

                            {/* Fast Move Act selector */}
                            <select
                              value={scene.act_id}
                              onChange={(e) => handleMoveSceneToAct(scene.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-[10px] py-0.5 px-1 rounded border font-medium cursor-pointer outline-none ${
                                theme === 'dark' ? 'bg-[#18181b] border-zinc-700 text-zinc-300 hover:border-zinc-500' : 'bg-white border-gray-300 text-gray-700'
                              }`}
                              title="Mover de acto"
                            >
                              {acts.map(a => (
                                <option key={a.id} value={a.id}>Acto {a.orden}</option>
                              ))}
                            </select>

                            {/* Status Badge */}
                            <span 
                              onClick={(e) => handleToggleStateInline(scene.id, e)}
                              title="Click para cambiar estado"
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${  
                                scene.estado === 'Final'
                                  ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200')
                                  : scene.estado === 'Revisado'   
                                  ? (theme === 'dark' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-800 border-green-200')  
                                  : (theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-800 border-yellow-200')  
                              }`}  
                            >  
                              {scene.estado}  
                            </span>

                            {/* Expand Chevron icon */}
                            <span className="text-xs text-zinc-400 font-bold ml-0.5 transition-transform">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {/* EXPANDED DETAILS SECTION */}
                        {isExpanded && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className={`px-3 py-3 border-t space-y-3 ${theme === 'dark' ? 'border-[#3f3f46] bg-[#18181b]/50' : 'border-gray-200 bg-white'}`}
                          >
                            {/* Editable Title */}
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">Título de Escena</label>
                              <input 
                                type="text"
                                value={scene.titulo}
                                onChange={(e) => handleUpdateSceneField(scene.id, 'titulo', e.target.value)}
                                className={`w-full text-xs p-2 rounded border focus:ring-1 outline-none font-medium ${
                                  theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                                }`}
                              />
                            </div>

                            {/* Editable Descripción */}
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">Descripción / Sinopsis</label>
                              <input
                                type="text"
                                value={scene.descripcion || ''}
                                onChange={(e) => handleUpdateSceneField(scene.id, 'descripcion', e.target.value)}
                                placeholder="Breve sinopsis de la escena..."
                                className={`w-full text-xs p-2 rounded border focus:ring-1 outline-none font-medium ${
                                  theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                                }`}
                              />
                            </div>

                            {/* Editable Escaleta Detallada */}
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-emerald-400 mb-1">Escaleta (Escena Detallada)</label>
                              <textarea 
                                rows={3}
                                value={scene.escaleta}
                                onChange={(e) => handleUpdateSceneField(scene.id, 'escaleta', e.target.value)}
                                placeholder="Desglose detallado paso a paso de la escena..."
                                className={`w-full text-xs p-2 rounded border focus:ring-1 outline-none resize-none ${
                                  theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                                }`}
                              />
                            </div>

                            {/* Editable Diálogos */}
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-purple-400 mb-1">Diálogos y Guion</label>
                              <textarea 
                                rows={3}
                                value={scene.dialogos || ''}
                                onChange={(e) => handleUpdateSceneField(scene.id, 'dialogos', e.target.value)}
                                placeholder="JUGADOR&#10;¿Dónde estoy?"
                                className={`w-full text-xs p-2 rounded border font-mono focus:ring-1 outline-none resize-none ${
                                  theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-purple-200 focus:ring-purple-500' : 'bg-purple-50 border-purple-200 text-purple-900 focus:ring-purple-500'
                                }`}
                              />
                            </div>

                            {/* Action Bar inside Expanded Card */}
                            <div className="flex justify-between items-center pt-1 border-t border-zinc-700/50">
                              <button 
                                onClick={(e) => handleOpenMaximizeScene(scene, e)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                              >
                                ⛶ Maximizar Ventana
                              </button>
                              <button 
                                onClick={() => setExpandedSceneId(null)}
                                className="text-[10px] text-zinc-400 hover:text-zinc-200 font-semibold"
                              >
                                ✓ Listo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>  
                    );
                  })}
                  {actScenes.length === 0 && (
                    <div className={`flex-1 border-2 border-dashed rounded-lg flex items-center justify-center p-6 text-xs text-zinc-400 italic select-none ${
                      theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                    }`}>
                      Sin escenas en este acto
                    </div>
                  )}
                </div>

                {/* Botón Nueva Escena */}  
                <div className={`p-2 border-t shrink-0 ${theme === 'dark' ? 'border-[#3f3f46] bg-[#18181b]' : 'border-gray-200 bg-gray-50/50'}`}>  
                  <button 
                    onClick={() => handleAddScene(act.id)}
                    className={`w-full py-1.5 border border-dashed rounded-lg text-xs font-semibold transition-colors ${theme === 'dark' ? 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500' : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'}`}
                  >  
                    + Nueva Escena  
                  </button>  
                </div>

                {/* Plot Point Textarea */}  
                <div className={`p-3 border-t shrink-0 ${  
                  act.orden === 1 ? (theme === 'dark' ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100') :  
                  act.orden === 2 ? (theme === 'dark' ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100') :  
                  (theme === 'dark' ? 'bg-teal-900/10 border-teal-900/30' : 'bg-teal-50 border-teal-100')  
                }`}>  
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${  
                    act.orden === 1 ? 'text-blue-500' : act.orden === 2 ? 'text-amber-500' : 'text-teal-500'  
                  }`}>  
                    {act.orden === 3 ? 'Clímax / Resolución' : `Plot Point ${act.orden}`}  
                  </label>  
                  <textarea   
                    value={act.plot_point}  
                    onChange={(e) => handleUpdatePlotPoint(act.id, e.target.value)}
                    className={`w-full text-xs bg-transparent border rounded p-2 focus:ring-1 outline-none resize-none h-14 ${  
                      theme === 'dark' ? 'border-zinc-700 focus:ring-zinc-500 text-zinc-300' : 'border-gray-300 focus:ring-gray-400'  
                    }`}  
                  />  
                </div>  
              </div>  
            );
          })}  
        </div>

        {/* SIDEBAR IA */}  
        <aside className={`w-full sm:w-80 max-w-full border-l flex flex-col shadow-xl absolute right-0 top-0 bottom-0 transform transition-transform duration-300 ease-in-out z-20 ${isAiOpen ? 'translate-x-0' : 'translate-x-full'} ${theme === 'dark' ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-gray-200'}`}>  
          <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#3f3f46] bg-purple-900/10' : 'border-gray-200 bg-purple-50'}`}>  
            <h3 className="font-bold text-purple-500 text-sm sm:text-base">Asistente Narrativo</h3>  
            <button onClick={() => setIsAiOpen(false)} className="text-zinc-400 hover:text-zinc-200 text-base">✕</button>  
          </div>  
          <div className="flex-1 p-4 overflow-y-auto">  
            <div className={`p-3 rounded-lg rounded-tl-none text-xs self-start max-w-[85%] border ${theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46]' : 'bg-gray-100 border-gray-200'}`}>  
              ¡Hola! Soy tu asistente de diseño narrativo que corre en local. ¿Necesitas ideas para un "bark" de enemigo?  
            </div>  
          </div>  
          <div className={`p-3 border-t ${theme === 'dark' ? 'border-[#3f3f46]' : 'border-gray-200'}`}>  
            <input type="text" className={`w-full border rounded-full px-4 py-2 text-xs focus:outline-none ${theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-white' : 'bg-gray-100 border-gray-200'}`} placeholder="Pregúntale a la IA..." />  
          </div>  
        </aside>

        {/* MODAL GUARDAR PROYECTO COMO */}
        {isSaveAsModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex justify-center items-center p-4">
            <div className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden border p-6 space-y-4 ${
              theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-900'
            }`}>
              <div className="flex justify-between items-center border-b pb-3 border-zinc-700/50">
                <h3 className="font-bold text-base flex items-center gap-2">
                  📑 Guardar Proyecto Como...
                </h3>
                <button onClick={() => setIsSaveAsModalOpen(false)} className="text-zinc-400 hover:text-zinc-200 font-bold">
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Nuevo Nombre del Proyecto</label>
                <input 
                  type="text"
                  value={saveAsTitleInput}
                  onChange={(e) => setSaveAsTitleInput(e.target.value)}
                  placeholder="Ej: CyberNights Edición Director"
                  className={`w-full text-sm font-semibold p-2.5 rounded border outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-[#18181b] border-zinc-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Selecciona cómo deseas guardar tu archivo: puedes elegir la carpeta de destino con el Explorador de Archivos o realizar una descarga directa.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleExecuteSaveAs(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  📂 Elegir Ruta en explorador (Save As...)
                </button>
                <button
                  onClick={() => handleExecuteSaveAs(false)}
                  className="w-full py-2 px-4 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  📥 Descarga Directa (.json)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ESCENA MAXIMIZADA (EDICIÓN CÓMODA CON ACEPTAR / CANCELAR) */}
        {maximizedScene && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex justify-center items-center p-3 sm:p-6 md:p-8">
            <div className={`w-full max-w-5xl h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border ${
              theme === 'dark' ? 'bg-[#18181b] border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-900'
            }`}>
              {/* Maximized Header */}
              <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
                theme === 'dark' ? 'bg-[#27272a] border-zinc-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">⛶</span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Escena #{maximizedScene.orden}: {maximizedScene.titulo}</h3>
                    <p className="text-xs text-zinc-400">Edición Cómoda de Escena y Escaleta Detallada</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCancelMaximizedScene}
                    className="px-3.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAcceptMaximizedScene}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    ✓ Aceptar
                  </button>
                </div>
              </div>

              {/* Maximized Body Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                
                {/* Header Metadata: Title, Act, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Título de la Escena</label>
                    <input 
                      type="text"
                      value={maximizedScene.titulo}
                      onChange={(e) => setMaximizedScene({ ...maximizedScene, titulo: e.target.value })}
                      className={`w-full text-sm sm:text-base font-semibold p-2.5 rounded border outline-none focus:ring-1 ${
                        theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Acto</label>
                      <select 
                        value={maximizedScene.act_id}
                        onChange={(e) => setMaximizedScene({ ...maximizedScene, act_id: e.target.value })}
                        className={`w-full text-xs p-2.5 rounded border outline-none ${
                          theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-white' : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        {acts.map(a => (
                          <option key={a.id} value={a.id}>Acto {a.orden}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Estado</label>
                      <select 
                        value={maximizedScene.estado}
                        onChange={(e) => setMaximizedScene({ ...maximizedScene, estado: e.target.value as Scene['estado'] })}
                        className={`w-full text-xs p-2.5 rounded border outline-none ${
                          theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-white' : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <option value="Borrador">Borrador</option>
                        <option value="Revisado">Revisado</option>
                        <option value="Final">Final</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 1: Descripción / Sinopsis */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Descripción / Sinopsis Breve</label>
                  <textarea 
                    rows={2}
                    value={maximizedScene.descripcion || ''}
                    onChange={(e) => setMaximizedScene({ ...maximizedScene, descripcion: e.target.value })}
                    placeholder="Escribe un breve resumen de lo que ocurre en la escena..."
                    className={`w-full text-xs sm:text-sm p-3 rounded border outline-none resize-none focus:ring-1 ${
                      theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-200 focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* Section 2: Escaleta (Escena Detallada) */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-emerald-400 mb-1">Escaleta (Escena Detallada / Beat Sheet)</label>
                  <textarea 
                    rows={8}
                    value={maximizedScene.escaleta || ''}
                    onChange={(e) => setMaximizedScene({ ...maximizedScene, escaleta: e.target.value })}
                    placeholder="Escribe el desglose detallado paso a paso de la escena..."
                    className={`w-full text-xs sm:text-sm p-3 rounded border outline-none leading-relaxed focus:ring-1 ${
                      theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-100 focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* Section 3: Diálogos y Guion */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-purple-400 mb-1">Diálogos y Guion</label>
                  <textarea 
                    rows={6}
                    value={maximizedScene.dialogos || ''}
                    onChange={(e) => setMaximizedScene({ ...maximizedScene, dialogos: e.target.value })}
                    placeholder="JUGADOR&#10;(Mirando al horizonte)&#10;No hay vuelta atrás..."
                    className={`w-full text-xs sm:text-sm p-3 rounded border font-mono outline-none leading-relaxed focus:ring-1 ${
                      theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-purple-200 focus:ring-purple-500' : 'bg-purple-50 border-purple-200 text-purple-900 focus:ring-purple-500'
                    }`}
                  />
                </div>

                {/* Section 4: Diseño de Nivel y Sonido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Notas de Diseño de Nivel</label>
                    <input 
                      type="text"
                      value={maximizedScene.diseno_nivel || ''}
                      onChange={(e) => setMaximizedScene({ ...maximizedScene, diseno_nivel: e.target.value })}
                      placeholder="Ej: Iluminación de neón verde, callejón estrecho"
                      className={`w-full text-xs p-2.5 rounded border outline-none ${
                        theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Notas de Sonido / FX</label>
                    <input 
                      type="text"
                      value={maximizedScene.sonido || ''}
                      onChange={(e) => setMaximizedScene({ ...maximizedScene, sonido: e.target.value })}
                      placeholder="Ej: Eco distante de sirenas, synthwave"
                      className={`w-full text-xs p-2.5 rounded border outline-none ${
                        theme === 'dark' ? 'bg-[#27272a] border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Maximized Footer */}
              <div className={`px-6 py-4 border-t flex justify-between items-center ${
                theme === 'dark' ? 'bg-[#27272a] border-zinc-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <button 
                  onClick={() => handleDeleteScene(maximizedScene.id)}
                  className="px-3.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors"
                >
                  🗑️ Eliminar Escena
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={handleCancelMaximizedScene}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAcceptMaximizedScene}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    ✓ Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL LECTOR MARKDOWN (.MD) */}
        {isMdReaderOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-center items-center p-3 sm:p-6 md:p-8">
            <div className={`w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border ${
              theme === 'dark' ? 'bg-[#18181b] border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-900'
            }`}>
              {/* Reader Header */}
              <div className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap justify-between items-center gap-2 shrink-0 ${
                theme === 'dark' ? 'bg-[#27272a] border-zinc-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg sm:text-xl">📖</span>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm md:text-base">Lector de Guion Markdown (.md)</h3>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400">{projectTitle} — Documento Compilado</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopyMdToClipboard}
                    className="px-2.5 sm:px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Copiar contenido Markdown al portapapeles"
                  >
                    📋 Copiar
                  </button>
                  <button 
                    onClick={handleSaveAsMarkdown}
                    className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                    title="Descargar archivo .md"
                  >
                    💾 Descargar .md
                  </button>
                  <button 
                    onClick={() => setIsMdReaderOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 text-base font-bold ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Reader Content Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 font-serif leading-relaxed text-xs sm:text-sm whitespace-pre-wrap select-text selection:bg-emerald-500 selection:text-white">
                {generateMarkdownText()}
              </div>

              {/* Reader Footer */}
              <div className={`px-4 sm:px-6 py-3 border-t flex justify-between items-center text-xs text-zinc-400 ${
                theme === 'dark' ? 'bg-[#27272a] border-zinc-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <span>Total Actos: {acts.length} | Escenas Totales: {scenes.length}</span>
                <button 
                  onClick={() => setIsMdReaderOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-semibold transition-colors"
                >
                  Cerrar Lector
                </button>
              </div>
            </div>
          </div>
        )}
      </main>  
    </div>  
  );  
}
