import React, { useState, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';

// Types for IPC Rust Models
export type ProyectoResumen = {
  id: number;
  titulo: string;
  ruta_archivo?: string | null;
  creado_en: string;
};

export type ActoResumen = {
  id: number;
  titulo: string;
  orden: number;
};

export type ProyectoDetalle = {
  id: number;
  titulo: string;
  ruta_archivo?: string | null;
  sinopsis: string;
  actos: ActoResumen[];
};

// Types for Narrative Board
export type Scene = {  
  id: string;  
  act_id: string;  
  orden: number;  
  titulo: string;  
  estado: 'Borrador' | 'Revisado' | 'Final';  
  descripcion: string;
  escaleta: string;
  diseno_nivel?: string;  
  sonido?: string;  
  texto_juego?: string;  
  dialogos?: string;  
};

export type Act = {  
  id: string;  
  orden: number;  
  nombre: string;  
  sinopsis?: string;
  plot_point: string;  
};

export type ProjectData = {
  id: string;
  title: string;
  acts: Act[];
  scenes: Scene[];
  updatedAt: string;
};

const INITIAL_ACTS: Act[] = [
  { 
    id: 'act-1', 
    orden: 1, 
    nombre: 'Planteamiento', 
    sinopsis: 'El protagonista despierta tras la explosión en el mercado y busca refugio.',
    plot_point: 'La guardia ataca el mercado; el jugador huye a las alcantarillas.' 
  },
  { 
    id: 'act-2', 
    orden: 2, 
    nombre: 'Confrontación', 
    sinopsis: 'Navegación por los niveles inferiores y descubrimiento de la red de clones.',
    plot_point: 'El jugador descubre que es un clon y debe decidir su lealtad.' 
  },
  { 
    id: 'act-3', 
    orden: 3, 
    nombre: 'Resolución', 
    sinopsis: 'Asalto final a la torre corporativa para liberar la ciudad.',
    plot_point: 'Batalla final en la aguja corporativa.' 
  },
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

// IPC Helper Functions
export async function fetchProyectosRecientes(): Promise<ProyectoResumen[]> {
  try {
    return await invoke<ProyectoResumen[]>('obtener_proyectos_recientes');
  } catch (e) {
    console.warn("IPC unavailable, using fallback projects:", e);
    return [
      { id: 1, titulo: 'CyberNights', ruta_archivo: '/proyectos/cybernights.json', creado_en: '2026-07-25 12:00:00' },
      { id: 2, titulo: 'Shadow Realm', ruta_archivo: '/proyectos/shadow.json', creado_en: '2026-07-25 11:30:00' },
    ];
  }
}

export async function fetchDetallesProyecto(proyectoId: number): Promise<ProyectoDetalle> {
  try {
    return await invoke<ProyectoDetalle>('obtener_detalles_proyecto', {
      proyectoId: proyectoId,
      proyecto_id: proyectoId,
    });
  } catch (e) {
    console.warn("IPC unavailable, using fallback detail:", e);
    if (proyectoId === 2) {
      return {
        id: 2,
        titulo: 'Shadow Realm',
        ruta_archivo: '/proyectos/shadow.json',
        sinopsis: 'Fantasía oscura y supervivencia en el reino de las sombras.',
        actos: [
          { id: 4, titulo: 'El Despertar', orden: 1 },
          { id: 5, titulo: 'La Caída', orden: 2 },
          { id: 6, titulo: 'El Eclipse', orden: 3 },
        ],
      };
    }
    return {
      id: 1,
      titulo: 'CyberNights',
      ruta_archivo: '/proyectos/cybernights.json',
      sinopsis: 'Un thriller cyberpunk sobre conspiraciones corporativas.',
      actos: [
        { id: 1, titulo: 'Planteamiento', orden: 1 },
        { id: 2, titulo: 'Confrontación', orden: 2 },
        { id: 3, titulo: 'Resolución', orden: 3 },
      ],
    };
  }
}

// -------------------------------------------------------------
// 1. DASHBOARD INICIO COMPONENT (path="/")
// -------------------------------------------------------------
export function Dashboard() {
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchProyectosRecientes()
      .then((data) => {
        if (isMounted) {
          setProyectos(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Error al cargar los proyectos recientes.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl shadow-lg shadow-violet-950/40">
            <span className="text-xl">✍️</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Guion<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/tablero/1')}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-950/50 transition-all duration-200 flex items-center gap-2"
        >
          <span>+</span> Nuevo Guion
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8">
        <div className="mb-8 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">Proyectos Recientes</h2>
            <p className="text-xs text-slate-400 mt-1">Accede a tus proyectos narrativos y guiones estructurados.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/80 shadow-2xl">
            <div className="flex items-center gap-3 text-indigo-400 font-medium">
              <span className="animate-spin text-2xl">⏳</span>
              <span className="text-sm">Cargando proyectos...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-5 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl text-sm shadow-xl">
            {error}
          </div>
        ) : proyectos.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-400 shadow-xl">
            No hay proyectos recientes registrados en la base de datos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-violet-500/40 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-violet-950/20 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3
                      className="text-lg font-bold text-slate-100 group-hover:text-violet-300 transition cursor-pointer"
                      onClick={() => navigate(`/tablero/${p.id}`)}
                    >
                      {p.titulo}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 truncate flex items-center gap-1.5 font-mono">
                    <span className="text-indigo-400">📁</span> {p.ruta_archivo || 'Sin ruta definida'}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-6 flex items-center gap-1.5">
                    <span>📅</span> Creado: {p.creado_en}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => navigate(`/tablero/${p.id}`)}
                    className="w-full bg-slate-800/90 hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 text-slate-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700/80 hover:border-transparent transition-all duration-200 text-center shadow-sm"
                  >
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// 2. DASHBOARD DEL GUION & DETALLES UNIFICADO (path="/tablero/:id" & "/proyecto/:id")
// -------------------------------------------------------------
export function DashboardGuion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState<string>(id || 'proj-1');
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync project details from IPC
  useEffect(() => {
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

  // Load project from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('guionstudio_active_project');
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          setProjectId(data.id || `proj-${id || '1'}`);
          setProjectTitle(data.title);
          setActs(data.acts);
          setScenes(data.scenes);
        }
      } catch (e) {
        console.error("Error al cargar proyecto guardado:", e);
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

  const saveState = (newActs: Act[], newScenes: Scene[]) => {
    const data: ProjectData = {
      id: projectId,
      title: projectTitle,
      acts: newActs,
      scenes: newScenes,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('guionstudio_active_project', JSON.stringify(data));
  };

  // Scene Operations inside Dashboard
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
    };
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    saveState(acts, updatedScenes);
    showNotification(`Escena creada en Acto ${acts.find((a) => a.id === act_id)?.orden}`);
  };

  const handleUpdateScene = (updated: Scene) => {
    const updatedScenes = scenes.map((s) => (s.id === updated.id ? updated : s));
    setScenes(updatedScenes);
    saveState(acts, updatedScenes);
  };

  const handleDeleteScene = (sceneId: string) => {
    const updatedScenes = scenes.filter((s) => s.id !== sceneId);
    setScenes(updatedScenes);
    saveState(acts, updatedScenes);
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
          md += `---\n\n`;
        });
      }
    });
    return md;
  };

  const handleNewProject = () => {
    if (window.confirm('¿Deseas iniciar un nuevo proyecto? Los cambios no guardados se perderán.')) {
      setProjectId(`proj-${Date.now()}`);
      setProjectTitle('Nuevo Proyecto Guion');
      setScenes([]);
      showNotification('Nuevo proyecto creado');
      setIsFileMenuOpen(false);
    }
  };

  const handleSaveJson = () => {
    const data: ProjectData = {
      id: projectId,
      title: projectTitle,
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('guionstudio_active_project', JSON.stringify(data));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Proyecto "${projectTitle}" guardado exitosamente (.json)`);
    setIsFileMenuOpen(false);
  };

  const handleSaveAsSubmit = () => {
    if (!saveAsTitleInput.trim()) return;
    setProjectTitle(saveAsTitleInput.trim());
    const data: ProjectData = {
      id: projectId,
      title: saveAsTitleInput.trim(),
      acts,
      scenes,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('guionstudio_active_project', JSON.stringify(data));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${saveAsTitleInput.trim().toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsSaveAsModalOpen(false);
    showNotification(`Proyecto guardado como "${saveAsTitleInput.trim()}"`);
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
          setProjectId(data.id || `proj-${Date.now()}`);
          setProjectTitle(data.title);
          setActs(data.acts);
          setScenes(data.scenes);
          showNotification(`Proyecto "${data.title}" cargado correctamente`);
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

  const handleSaveMd = () => {
    const mdContent = generateMarkdownText();
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Guion guardado como "${projectTitle}.md"`);
    setIsFileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'} flex flex-col font-sans transition-colors duration-200 selection:bg-violet-500/30 selection:text-violet-200`}>
      {/* Top Bar Header */}
      <header className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xl sticky top-0 z-40">
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

          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-slate-800/90 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:border-violet-500 transition max-w-xs"
            title="Título del proyecto"
          />

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
              <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-md">
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
                <hr className="border-slate-800 my-1" />
                <button
                  onClick={handleSaveJson}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-violet-300 flex items-center gap-2"
                >
                  💾 Guardar (.json)
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
                <hr className="border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setIsMdReaderOpen(true);
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-violet-400 hover:bg-slate-800 font-medium flex items-center gap-2"
                >
                  📖 Lector Markdown (.md)
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
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-md flex items-center gap-1.5"
          >
            <span>✨ Asistente IA</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-2xl text-xs font-bold z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Main Script Dashboard Body */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          
          {/* UNIFIED PROJECT DETAILS CARD */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black tracking-wider text-violet-300 bg-violet-950/60 border border-violet-800/60 px-3 py-1 rounded-lg uppercase">
                  Proyecto Activo
                </span>
                <h2 className="text-3xl font-black text-slate-100 tracking-tight">{projectTitle}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Sinopsis Argumental del Proyecto:
                </span>
                <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 leading-relaxed italic">
                  {projectSynopsis || 'Sinopsis general del proyecto narrativo.'}
                </p>
              </div>
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
                  className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-200 min-w-0"
                >
                  {/* Act Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${actBadgeStyle}`}>
                        Acto {act.orden}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {actScenes.length} escena(s)
                      </span>
                    </div>
                    {/* Sinopsis del Acto */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Descripción:
                      </span>
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed italic">
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
                          className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 hover:border-violet-500 text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                        >
                          + Nueva Escena
                        </button>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {actScenes.length === 0 ? (
                          <div className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/40 rounded-xl border border-slate-800/50">
                            No hay escenas en este acto. ¡Haz clic en "+ Nueva Escena" para añadir una!
                          </div>
                        ) : (
                          actScenes.map((scene) => {
                            const isExpanded = expandedSceneId === scene.id;

                            return (
                              <div
                                key={scene.id}
                                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2 transition min-w-0"
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
                                      className="bg-transparent text-slate-100 font-semibold text-xs focus:outline-none focus:bg-slate-900 px-1.5 py-0.5 rounded truncate flex-1 min-w-0 border border-transparent focus:border-slate-700"
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
                                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md'
                                          : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/80 border-slate-700/80'
                                      }`}
                                      title={isExpanded ? 'Contraer escena' : 'Desplegar detalles de escena'}
                                    >
                                      <span>{isExpanded ? '➖' : '➕'}</span>
                                    </button>

                                    {/* Maximize */}
                                    <button
                                      onClick={() => setMaximizedScene(scene)}
                                      className="text-slate-400 hover:text-violet-400 text-xs px-1"
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
                                  <div className="pt-2 border-t border-slate-800 space-y-2 text-[11px]">
                                    <div>
                                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                        Descripción / Sinopsis:
                                      </label>
                                      <textarea
                                        value={scene.descripcion}
                                        onChange={(e) => handleUpdateScene({ ...scene, descripcion: e.target.value })}
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-violet-500"
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
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-[10px] focus:outline-none focus:border-violet-500"
                                        placeholder="Escaleta paso a paso..."
                                      />
                                    </div>
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
                  <div className="pt-4 mt-5 border-t border-slate-800/80">
                    <button
                      onClick={() => navigate(`/tablero/${id || '1'}/acto/${act.id}`)}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-950/40 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* AI Assistant Drawer */}
        {isAiOpen && (
          <aside className="w-80 bg-slate-900/90 backdrop-blur-md border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-violet-300 flex items-center gap-2">
                  <span>✨</span> Asistente Narrativo
                </h3>
                <button
                  onClick={() => setIsAiOpen(false)}
                  title="Cerrar asistente"
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  Hola. Puedo ayudarte a sugerir ideas para escenas, generar diálogos o revisar la estructura del guion.
                </p>

                <button
                  onClick={() => showNotification('Sugerencia: Añadir una revelación al final del Acto 2')}
                  className="w-full text-left bg-slate-800/70 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/80 text-violet-200 transition font-medium"
                >
                  💡 Sugerir giro argumental
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-center pt-4 border-t border-slate-800">
              Integración Local LLM Activa
            </div>
          </aside>
        )}
      </div>

      {/* Maximized Scene Modal */}
      {maximizedScene && (
        <MaximizedSceneModal
          scene={maximizedScene}
          onClose={() => setMaximizedScene(null)}
          onSave={(updated) => {
            handleUpdateScene(updated);
            setMaximizedScene(null);
            showNotification('Cambios guardados en la escena');
          }}
        />
      )}

      {/* Save As Modal */}
      {isSaveAsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Guardar Proyecto Como...</h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa un nuevo nombre para el archivo de proyecto (.json).
            </p>
            <input
              type="text"
              value={saveAsTitleInput}
              onChange={(e) => setSaveAsTitleInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 mb-6 focus:outline-none focus:border-violet-500"
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
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Descarga Directa (.json)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Reader Modal */}
      {isMdReaderOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-violet-300 flex items-center gap-2">
                <span>📖</span> Lector de Guion Markdown (.md)
              </h3>
              <button
                onClick={() => setIsMdReaderOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {generateMarkdownText()}
            </div>
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateMarkdownText());
                  showNotification('Copiado al portapapeles');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700"
              >
                📋 Copiar Texto
              </button>
              <button
                onClick={() => setIsMdReaderOpen(false)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg"
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

// -------------------------------------------------------------
// 3. EDITOR DE ACTO COMPONENT (path="/tablero/:id/acto/:actoId")
// -------------------------------------------------------------
export function EditorActo() {
  const { id, actoId } = useParams<{ id: string; actoId: string }>();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState<string>(id || 'proj-1');
  const [projectTitle, setProjectTitle] = useState<string>('CyberNights');
  const [acts, setActs] = useState<Act[]>(INITIAL_ACTS);
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);

  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [maximizedScene, setMaximizedScene] = useState<Scene | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load project state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('guionstudio_active_project');
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          setProjectId(data.id || `proj-${id || '1'}`);
          setProjectTitle(data.title);
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
      acts: newActs,
      scenes: newScenes,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('guionstudio_active_project', JSON.stringify(data));
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
    const updatedScenes = scenes.filter((s) => s.id !== sceneId);
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
            <span className="text-xs font-black uppercase bg-violet-950/70 text-violet-300 px-2.5 py-0.5 rounded-md border border-violet-800/60">
              Acto {currentAct.orden}
            </span>
            <h1 className="text-base font-bold text-slate-100">{currentAct.nombre}</h1>
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-violet-300 flex items-center gap-2 tracking-tight">
              <span>🎭</span> Editor Dedicado: Acto {currentAct.orden}
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {actScenes.length} escena(s) registradas
            </span>
          </div>

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
              <span>🎬</span> Escenas de {currentAct.nombre}
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

// -------------------------------------------------------------
// MAXIMIZED SCENE MODAL COMPONENT
// -------------------------------------------------------------
function MaximizedSceneModal({
  scene,
  onClose,
  onSave,
}: {
  scene: Scene;
  onClose: () => void;
  onSave: (updated: Scene) => void;
}) {
  const [draft, setDraft] = useState<Scene>({ ...scene });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-lg text-violet-400">⛶</span>
            <input
              type="text"
              value={draft.titulo}
              onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
              className="bg-slate-900 text-slate-100 font-bold text-lg px-3 py-1 rounded-xl border border-slate-800 focus:outline-none focus:border-violet-500 flex-1 max-w-md"
            />
          </div>
          <h4 className="text-xs text-slate-400 font-medium mr-4">
            Edición Cómoda de Escena y Escaleta Detallada
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Descripción / Sinopsis:
              </label>
              <textarea
                value={draft.descripcion}
                onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Escaleta Paso a Paso (Beat Sheet):
              </label>
              <textarea
                value={draft.escaleta}
                onChange={(e) => setDraft({ ...draft, escaleta: e.target.value })}
                rows={10}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Diálogos (Formato Guion):
              </label>
              <textarea
                value={draft.dialogos || ''}
                onChange={(e) => setDraft({ ...draft, dialogos: e.target.value })}
                rows={8}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Notas de Diseño de Nivel:
                </label>
                <textarea
                  value={draft.diseno_nivel || ''}
                  onChange={(e) => setDraft({ ...draft, diseno_nivel: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Efectos de Sonido (SFX):
                </label>
                <textarea
                  value={draft.sonido || ''}
                  onChange={(e) => setDraft({ ...draft, sonido: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
          >
            ✓ Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. MAIN APP ROUTER COMPONENT (MemoryRouter)
// -------------------------------------------------------------
export default function App({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/proyecto/:id" element={<DashboardGuion />} />
        <Route path="/tablero/:id" element={<DashboardGuion />} />
        <Route path="/tablero/:id/acto/:actoId" element={<EditorActo />} />
      </Routes>
    </MemoryRouter>
  );
}
