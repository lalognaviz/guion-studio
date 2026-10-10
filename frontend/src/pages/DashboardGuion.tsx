import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { INITIAL_ACTS, INITIAL_SCENES } from '../lib/storage';
import { projectApi } from '../api/projectApi';
import type { Act, Scene, ProjectData } from '../lib/types';
import { getProyectoCached } from '../api/client';
import { useSceneOperations } from '../hooks/useSceneOperations';
import { useProjectExport } from '../hooks/useProjectExport';
import { useNotification } from '../hooks/useNotification';
import { toProjectData } from '../lib/export';
import { MaximizedSceneModal } from '../components/MaximizedSceneModal';
import { ProjectHeader } from '../components/ProjectHeader';
import { ProjectDetailsCard } from '../components/ProjectDetailsCard';
import { ActBoard } from '../components/ActBoard';
import { NotificationToast } from '../components/NotificationToast';
import { TweeExportModal } from '../components/TweeExportModal';
import { SaveAsModal } from '../components/SaveAsModal';
import { PreviewModal } from '../components/PreviewModal';
import { CharactersPanel } from '../components/CharactersPanel';
import { LocationsPanel } from '../components/LocationsPanel';
import { VariablesPanel } from '../components/VariablesPanel';
import { TimelinePanel } from '../components/TimelinePanel';

// -------------------------------------------------------------
// 2. DASHBOARD DEL GUION & DETALLES UNIFICADO (path="/tablero/:id" & "/proyecto/:id")
// -------------------------------------------------------------
export function DashboardGuion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const cached = id ? getProyectoCached(String(id)) : null;
  const [projectId, setProjectId] = useState<string>(cached ? String(cached.id) : id || '');
  const [projectTitle, setProjectTitle] = useState<string>(cached?.title ?? '');
  const [projectSynopsis, setProjectSynopsis] = useState<string>(cached?.synopsis ?? '');
  const [acts, setActs] = useState<Act[]>(cached?.acts ?? INITIAL_ACTS);
  const [scenes, setScenes] = useState<Scene[]>(cached?.scenes ?? INITIAL_SCENES);
  const [personajes, setPersonajes] = useState<import('../lib/entities').Personaje[]>(cached?.personajes ?? []);
  const [ubicaciones, setUbicaciones] = useState<import('../lib/entities').Ubicacion[]>(cached?.ubicaciones ?? []);
  const [variables, setVariables] = useState<import('../lib/entities').Variable[]>(cached?.variables ?? []);
  const [timeline, setTimeline] = useState<import('../lib/entities').EventoTimeline[]>(cached?.timeline ?? []);


  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [maximizedScene, setMaximizedScene] = useState<Scene | null>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTitleInput, setSaveAsTitleInput] = useState('');
  const [isMdReaderOpen, setIsMdReaderOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'formatted' | 'raw' | 'json'>('formatted');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isTweeExportOpen, setIsTweeExportOpen] = useState(false);
  const [tweeFormat, setTweeFormat] = useState<'Harlowe' | 'SugarCube'>('Harlowe');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { notification, showNotification } = useNotification();

  // Carga el proyecto desde el repositorio (SQLite o almacén en memoria)
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    projectApi.obtener(String(id))
      .then((loaded) => {
        if (cancelled || !loaded) return;
        setProjectId(String(loaded.id));
        setProjectTitle(loaded.title);
        if (loaded.synopsis !== undefined) setProjectSynopsis(loaded.synopsis);
        setActs(loaded.acts ?? []);
        setScenes(loaded.scenes ?? []);
        setPersonajes(loaded.personajes ?? []);
        setUbicaciones(loaded.ubicaciones ?? []);
        setVariables(loaded.variables ?? []);
        setTimeline(loaded.timeline ?? []);
      })
      .catch((e) => console.warn('No se pudo cargar el proyecto:', e));
    return () => {
      cancelled = true;
    };
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

  const saveState = (
    newTitle: string,
    newSynopsis: string,
    newActs: Act[],
    newScenes: Scene[],
    newPersonajes = personajes,
    newUbicaciones = ubicaciones,
    newVariables = variables,
    newTimeline = timeline
  ) => {
    const data = toProjectData({
      id: projectId,
      title: newTitle,
      synopsis: newSynopsis,
      acts: newActs,
      scenes: newScenes,
      personajes: newPersonajes,
      ubicaciones: newUbicaciones,
      variables: newVariables,
      timeline: newTimeline,
    });
    projectApi.guardar(data).catch((e) => console.error('No se pudo guardar el proyecto:', e));
  };

  const { handleAddScene, handleUpdateScene, handleDeleteScene, handleMoveScene } =
    useSceneOperations({
      projectTitle,
      projectSynopsis,
      acts,
      scenes,
      setScenes,
      saveState,
      showNotification,
    });

  const snapshot = { id: projectId, title: projectTitle, synopsis: projectSynopsis, acts, scenes };
  const { handleSaveJson, handleSaveAs, handleSaveMd, handleSaveTwee } = useProjectExport({
    snapshot,
    showNotification,
  });

  const handleTitleChange = (value: string) => {
    setProjectTitle(value);
    saveState(value, projectSynopsis, acts, scenes);
  };

  const handleSynopsisChange = (value: string) => {
    setProjectSynopsis(value);
    saveState(projectTitle, value, acts, scenes);
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
      projectApi.guardar(newProject).then(() => {
        showNotification('Nuevo proyecto creado');
        setIsFileMenuOpen(false);
        navigate(`/tablero/${newId}`);
      });
    }
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
          projectApi.guardar(loadedData).catch((e) => console.error('No se pudo guardar el proyecto:', e));
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

  const handleSaveAsSubmit = async () => {
    if (!saveAsTitleInput.trim()) return;
    const newTitle = saveAsTitleInput.trim();
    setProjectTitle(newTitle);
    await handleSaveAs(newTitle);
    setIsSaveAsModalOpen(false);
  };

  const handleExportTwee = async () => {
    await handleSaveTwee(tweeFormat);
    setIsTweeExportOpen(false);
    setIsFileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-brand-bg text-brand-text' : 'bg-brand-bg text-brand-text'} flex flex-col font-sans transition-colors duration-200 selection:bg-[#FD7014]/30 selection:text-brand-text`}>
      <ProjectHeader
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onBack={() => navigate('/')}
        menuRef={menuRef}
        fileInputRef={fileInputRef}
        isFileMenuOpen={isFileMenuOpen}
        onToggleMenu={() => setIsFileMenuOpen(!isFileMenuOpen)}
        onNewProject={handleNewProject}
        onOpenFile={() => fileInputRef.current?.click()}
        onFileSelected={handleOpenJson}
        onSaveJson={async () => {
          await handleSaveJson();
          setIsFileMenuOpen(false);
        }}
        onOpenSaveAs={() => {
          setSaveAsTitleInput(projectTitle);
          setIsSaveAsModalOpen(true);
          setIsFileMenuOpen(false);
        }}
        onSaveMd={async () => {
          await handleSaveMd();
          setIsFileMenuOpen(false);
        }}
        onOpenTwee={() => {
          setIsTweeExportOpen(true);
          setIsFileMenuOpen(false);
        }}
        onOpenPreview={() => {
          setPreviewTab('formatted');
          setIsMdReaderOpen(true);
          setIsFileMenuOpen(false);
        }}
      />

      <NotificationToast message={notification} />

      {/* Main Script Dashboard Body */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        <ProjectDetailsCard
          title={projectTitle}
          synopsis={projectSynopsis}
          onTitleChange={handleTitleChange}
          onSynopsisChange={handleSynopsisChange}
        />

        <ActBoard
          acts={acts}
          scenes={scenes}
          expandedSceneId={expandedSceneId}
          onAddScene={handleAddScene}
          onUpdateScene={handleUpdateScene}
          onMoveScene={handleMoveScene}
          onToggleExpand={(sceneId) =>
            setExpandedSceneId((prev) => (prev === sceneId ? null : sceneId))
          }
          onMaximize={(scene) => setMaximizedScene(scene)}
          onDeleteScene={handleDeleteScene}
          onEditAct={(actId) => navigate(`/tablero/${id || '1'}/acto/${actId}`)}
        />


        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <CharactersPanel
            personajes={personajes}
            onChange={(p) => {
              setPersonajes(p);
              saveState(projectTitle, projectSynopsis, acts, scenes, p, ubicaciones, variables, timeline);
            }}
          />
          <LocationsPanel
            ubicaciones={ubicaciones}
            onChange={(u) => {
              setUbicaciones(u);
              saveState(projectTitle, projectSynopsis, acts, scenes, personajes, u, variables, timeline);
            }}
          />
          <VariablesPanel
            variables={variables}
            onChange={(v) => {
              setVariables(v);
              saveState(projectTitle, projectSynopsis, acts, scenes, personajes, ubicaciones, v, timeline);
            }}
          />
          <TimelinePanel
            timeline={timeline}
            scenes={scenes}
            onChange={(t) => {
              setTimeline(t);
              saveState(projectTitle, projectSynopsis, acts, scenes, personajes, ubicaciones, variables, t);
            }}
          />
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

      <TweeExportModal
        open={isTweeExportOpen}
        format={tweeFormat}
        onFormatChange={setTweeFormat}
        onCancel={() => setIsTweeExportOpen(false)}
        onExport={handleExportTwee}
      />

      <SaveAsModal
        open={isSaveAsModalOpen}
        value={saveAsTitleInput}
        onChange={setSaveAsTitleInput}
        onCancel={() => setIsSaveAsModalOpen(false)}
        onSubmit={handleSaveAsSubmit}
      />

      <PreviewModal
        open={isMdReaderOpen}
        tab={previewTab}
        onTabChange={setPreviewTab}
        onClose={() => setIsMdReaderOpen(false)}
        snapshot={snapshot}
        showNotification={showNotification}
      />
    </div>
  );
}

// Re-export for route compatibility
export function DetallesProyecto() {
  return <DashboardGuion />;
}
