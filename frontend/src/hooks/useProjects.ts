import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { DEMO_CYBERNIGHTS, INITIAL_ACTS, hideProjectFromDashboard } from '../lib/storage';
import { projectApi } from '../api/projectApi';
import type { ProjectData, ProyectoResumen } from '../lib/types';
import { useNotification } from './useNotification';

export function useProjects() {
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [projectToDismiss, setProjectToDismiss] = useState<ProyectoResumen | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();

  const loadProjectsData = useCallback(() => {
    setLoading(true);
    projectApi
      .migrarLegacy()
      .then(() => projectApi.listar())
      .then((data) => {
        setProyectos(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los proyectos recientes.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProjectsData();
  }, [loadProjectsData]);

  const hideProject = (p: ProyectoResumen) => {
    hideProjectFromDashboard(p.id);
    loadProjectsData();
    showNotification(`El proyecto "${p.titulo}" se quitó de la vista de inicio.`);
  };

  const deleteProject = (p: ProyectoResumen) => {
    projectApi
      .eliminar(p.id)
      .then(() => {
        showNotification(`El proyecto "${p.titulo}" ha sido eliminado definitivamente.`);
        loadProjectsData();
      })
      .catch(() => showNotification('No se pudo eliminar el proyecto.'));
  };

  const createNewProject = () => {
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
projectApi.guardar(newProject).then(() => navigate(`/tablero/${newId}`));
  };

  const createExampleProject = () => {
    const exampleProject: ProjectData = {
      ...DEMO_CYBERNIGHTS,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toISOString(),
    };
projectApi.guardar(exampleProject).then(() => navigate(`/tablero/${exampleProject.id}`));
  };

  const openProjectFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ProjectData = JSON.parse(content);
        if (data.title && Array.isArray(data.acts) && Array.isArray(data.scenes)) {
          const loadedId = data.id || `proj-${Date.now()}`;
          const loadedData: ProjectData = { ...data, id: loadedId };
          projectApi.guardar(loadedData).then(() => navigate(`/tablero/${loadedId}`));
        } else {
          showNotification('El archivo no tiene la estructura válida de GuionStudio.');
        }
      } catch {
        showNotification('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.guion'))) {
      openProjectFile(file);
    } else {
      showNotification('Por favor, suelta un archivo con extensión .json o .guion');
    }
  };

  return {
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
  };
}
