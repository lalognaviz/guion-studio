// API tipada de proyectos: fachada de repositorio usada por hooks y páginas.
import {
  actualizarActosProyecto,
  actualizarEntidadesAuxiliares,
  actualizarEscenasProyecto,
  actualizarSinopsisProyecto,
  actualizarTituloProyecto,
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
  actualizarTituloProyecto(id: string, titulo: string): Promise<void> {
    return actualizarTituloProyecto(id, titulo);
  },
  actualizarSinopsisProyecto(id: string, sinopsis: string): Promise<void> {
    return actualizarSinopsisProyecto(id, sinopsis);
  },
  actualizarActosProyecto(id: string, actos: any[]): Promise<void> {
    return actualizarActosProyecto(id, actos);
  },
  actualizarEscenasProyecto(id: string, escenas: any[]): Promise<void> {
    return actualizarEscenasProyecto(id, escenas);
  },
  actualizarEntidadesAuxiliares(id: string, pers: any[], ubi: any[], vars: any[], tl: any[]): Promise<void> {
    return actualizarEntidadesAuxiliares(id, pers, ubi, vars, tl);
  },
};

export type ProjectApi = typeof projectApi;