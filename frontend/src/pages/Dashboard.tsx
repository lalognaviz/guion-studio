import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  saveProjectToStorage,
  hideProjectFromDashboard,
  deleteProjectPermanently,
  DEMO_CYBERNIGHTS,
  INITIAL_ACTS,
} from '../lib/storage';
import { fetchProyectosRecientes } from '../api/client';
import type { ProjectData, ProyectoResumen } from '../lib/types';

// -------------------------------------------------------------
// 1. DASHBOARD INICIO COMPONENT (path="/")
// -------------------------------------------------------------
export function Dashboard() {
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [projectToDismiss, setProjectToDismiss] = useState<ProyectoResumen | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const loadProjectsData = useCallback(() => {
    setLoading(true);
    fetchProyectosRecientes()
      .then((data) => {
        setProyectos(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los proyectos recientes.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProjectsData();
  }, [loadProjectsData]);

  const showToast = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const handleHideProject = (p: ProyectoResumen) => {
    hideProjectFromDashboard(p.id);
    loadProjectsData();
    showToast(`El proyecto "${p.titulo}" se quitó de la vista de inicio.`);
  };

  const handleExecuteDeleteDirect = (p: ProyectoResumen) => {
    deleteProjectPermanently(p.id);
    showToast(`El proyecto "${p.titulo}" ha sido eliminado definitivamente.`);
    loadProjectsData();
  };

  const handleCreateNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProject: ProjectData = {
      id: newId,
      title: 'Nuevo Proyecto Guion',
      synopsis: 'Escribe aquí la sinopsis argumental de tu nuevo proyecto...',
      acts: INITIAL_ACTS,
      scenes: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toLocaleString(),
    };
    saveProjectToStorage(newProject);
    navigate(`/tablero/${newId}`);
  };

  const handleCreateExampleProject = () => {
    const exampleProject: ProjectData = {
      ...DEMO_CYBERNIGHTS,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(exampleProject);
    navigate(`/tablero/${exampleProject.id}`);
  };

  const handleOpenProjectFile = (file: File) => {
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
          saveProjectToStorage(loadedData);
          navigate(`/tablero/${loadedId}`);
        } else {
          showToast('El archivo no tiene la estructura válida de GuionStudio.');
        }
      } catch (err) {
        showToast('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.guion'))) {
      handleOpenProjectFile(file);
    } else {
      showToast('Por favor, suelta un archivo con extensión .json o .guion');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 relative"
    >
      {/* Visual Overlay for Drag and Drop */}
      {isDragOver && (
        <div className="fixed inset-0 bg-[#FD7014]/10 border-4 border-dashed border-[#FD7014]/60 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
          <div className="bg-brand-surface/95 px-8 py-6 rounded-2xl text-center border border-[#FD7014]/40 shadow-2xl space-y-2">
            <span className="text-5xl">📂</span>
            <p className="text-brand-text/90 font-bold text-base">Soltar archivo para abrir proyecto</p>
            <p className="text-slate-400 text-xs">Acepta archivos de guion .json o .guion</p>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {notificacion && (
        <div className="fixed bottom-5 right-5 z-50 bg-brand-surface border border-[#FD7014]/50 text-brand-text text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-[#FD7014]">✨</span>
          <span>{notificacion}</span>
        </div>
      )}

      {/* Unified Dismiss/Delete Options Modal */}
      {projectToDismiss && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-surface rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-800 border border-[#FD7014]/30 rounded-xl text-xl">📋</div>
              <div>
                <h3 className="text-lg font-bold text-brand-text">{projectToDismiss.titulo}</h3>
                <p className="text-xs text-slate-400">¿Qué deseas hacer con este proyecto?</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  handleHideProject(projectToDismiss);
                  setProjectToDismiss(null);
                }}
                className="w-full text-left px-4 py-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-[#FD7014]/30/50 transition flex items-center gap-3 group"
              >
                <span className="text-lg">👁️</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-text/90 transition">Quitar de la vista</p>
                  <p className="text-xs text-slate-400">El proyecto se oculta de la pantalla de inicio sin borrar datos.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  handleExecuteDeleteDirect(projectToDismiss);
                  setProjectToDismiss(null);
                }}
                className="w-full text-left px-4 py-3 bg-rose-950/30 hover:bg-rose-950/50 rounded-xl border border-rose-800/40 transition flex items-center gap-3 group"
              >
                <span className="text-lg">🗑️</span>
                <div>
                  <p className="text-sm font-semibold text-rose-300">Eliminar definitivamente</p>
                  <p className="text-xs text-slate-400">Se borrarán todos sus datos y escenas. No se puede deshacer.</p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setProjectToDismiss(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-[#FD7014]/30 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-brand-surface/90 backdrop-blur-md border-b border-brand-surface px-6 py-4 flex items-center justify-between shadow-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-[#FD7014] to-[#e65f0f] rounded-xl shadow-lg shadow-orange-950/40">
            <span className="text-xl">✍️</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Guion<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#FD7014]/30/80 transition flex items-center gap-2"
          >
            <span>📂</span> Abrir Proyecto...
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleOpenProjectFile(file);
            }}
            accept=".json,.guion"
            className="hidden"
          />
          <button
            onClick={handleCreateNewProject}
            className="bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-950/50 transition-all duration-200 flex items-center gap-2"
          >
            <span>+</span> Nuevo Guion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8">
        <div className="mb-8 flex items-center justify-between border-b border-brand-surface/80 pb-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Proyectos Recientes</h2>
            <p className="text-xs text-slate-400 mt-1">Accede a tus proyectos narrativos o arrastra un archivo .json para abrirlo.</p>
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
          <div className="flex flex-col items-center justify-center p-16 bg-brand-surface/40 rounded-2xl border border-dashed border-[#FD7014]/30/80 text-center space-y-6">
            <div className="p-4 bg-gradient-to-tr from-[#FD7014]/20 to-[#e65f0f]/20 rounded-2xl border border-[#FD7014]/20">
              <span className="text-5xl">✍️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-1">¡Bienvenido a GuionStudio!</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Comienza creando un nuevo proyecto narrativo, abriendo un archivo existente o arrastrando un archivo .json a este panel.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateNewProject}
                className="bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>+</span> Nuevo Proyecto
              </button>
              <button
                onClick={handleCreateExampleProject}
                className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-xl border border-[#FD7014]/30/80 transition flex items-center gap-2"
              >
                <span>📘</span> Crear Proyecto de Ejemplo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((p) => (
              <div
                key={p.id}
                className="bg-brand-surface/80 backdrop-blur-sm border border-brand-surface hover:border-[#FD7014]/40 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-orange-950/20 transition-all duration-300 flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3
                      className="text-lg font-bold text-brand-text group-hover:text-brand-text/90 transition cursor-pointer pr-6"
                      onClick={() => navigate(`/tablero/${p.id}`)}
                    >
                      {p.titulo}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDismiss(p);
                      }}
                      className="opacity-0 group-hover:opacity-100 -mt-1 -mr-1 p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all duration-200"
                      title="Gestionar proyecto"
                    >
                      ✕
                    </button>
                  </div>
                  {p.sinopsis && (
                    <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                      {p.sinopsis}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mb-3 truncate flex items-center gap-1.5 font-mono">
                    <span className="text-indigo-400">📁</span> {p.ruta_archivo || 'Sin ruta definida'}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-6 flex items-center gap-1.5">
                    <span>📅</span> Creado: {p.creado_en}
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-surface/80">
                  <button
                    onClick={() => navigate(`/tablero/${p.id}`)}
                    className="w-full bg-slate-800/90 hover:bg-gradient-to-r hover:from-[#FD7014] hover:to-[#e65f0f] text-slate-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-[#FD7014]/30/80 hover:border-transparent transition-all duration-200 text-center shadow-sm"
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

