// API tipada de proyectos: fachada de repositorio usada por hooks y páginas.
import {
  eliminarProyecto,
  fetchDetallesProyecto,
  fetchProyectosRecientes,
  guardarProyecto,
  migrarProyectosLegacy,
} from './client';
import type { ProjectData, ProyectoResumen } from '../lib/types';

export const projectApi = {
  listar(): Promise<ProyectoResumen[]> {
    return fetchProyectosRecientes();
  },
  obtener(id: string): Promise<ProjectData | null> {
    return fetchDetallesProyecto(id);
  },
  guardar(data: ProjectData): Promise<void> {
    return guardarProyecto(data);
  },
  eliminar(id: string): Promise<void> {
    return eliminarProyecto(id);
  },
  migrarLegacy(): Promise<void> {
    return migrarProyectosLegacy();
  },
};

export type ProjectApi = typeof projectApi;