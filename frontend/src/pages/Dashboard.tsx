import { useNavigate } from 'react-router-dom';

import { useProjects } from '../hooks/useProjects';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardToast } from '../components/DashboardToast';
import { DismissProjectModal } from '../components/DismissProjectModal';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { ProjectsGrid } from '../components/ProjectsGrid';
import { WelcomeEmptyState } from '../components/WelcomeEmptyState';

// -------------------------------------------------------------
// DASHBOARD INICIO COMPONENT (path="/")
// -------------------------------------------------------------
export function Dashboard() {
  const navigate = useNavigate();
  const {
    proyectos,
    projectToDismiss,
    setProjectToDismiss,
    loading,
    error,
    notification,
    isDragOver,
    fileInputRef,
    hideProject,
    deleteProject,
    createNewProject,
    createExampleProject,
    openProjectFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useProjects();

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 relative"
    >
      {isDragOver && <DragDropOverlay />}
      <DashboardToast message={notification} />

      {projectToDismiss && (
        <DismissProjectModal
          proyecto={projectToDismiss}
          onHide={() => {
            hideProject(projectToDismiss);
            setProjectToDismiss(null);
          }}
          onDelete={() => {
            deleteProject(projectToDismiss);
            setProjectToDismiss(null);
          }}
          onClose={() => setProjectToDismiss(null)}
        />
      )}

      <DashboardHeader fileInputRef={fileInputRef} onOpenFile={openProjectFile} onCreateNew={createNewProject} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-8">
        <div className="mb-8 flex items-center justify-between border-b border-brand-surface/80 pb-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Proyectos Recientes</h2>
            <p className="text-xs text-slate-400 mt-1">
              Accede a tus proyectos narrativos o arrastra un archivo .json para abrirlo.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 bg-brand-surface/60 backdrop-blur-sm rounded-2xl border border-brand-surface/80 shadow-2xl">
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
          <WelcomeEmptyState onCreateNew={createNewProject} onCreateExample={createExampleProject} />
        ) : (
          <ProjectsGrid
            proyectos={proyectos}
            onOpen={(id) => navigate(`/tablero/${id}`)}
            onManage={setProjectToDismiss}
          />
        )}
      </main>
    </div>
  );
}