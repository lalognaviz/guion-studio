import { ObtenerProyectosRecientes, ObtenerDetallesProyecto } from '../../wailsjs/go/main/App';
import type { ProyectoDetalle, ProyectoResumen } from '../lib/types';
import {
  getStoredProjectsMap,
  getHiddenProjectIds,
  loadProjectFromStorage,
} from '../lib/storage';

// IPC Helper Functions (Wails bindings con fallback a localStorage)
export async function fetchProyectosRecientes(): Promise<ProyectoResumen[]> {
  const map = getStoredProjectsMap();
  const hiddenIds = getHiddenProjectIds();
  const localProjects: ProyectoResumen[] = Object.values(map)
    .filter((p) => !hiddenIds.includes(String(p.id)))
    .map((p) => ({
      id: p.id,
      titulo: p.title,
      sinopsis: p.synopsis,
      ruta_archivo: `/proyectos/${p.title.toLowerCase().replace(/\s+/g, '_')}.json`,
      creado_en: p.createdAt || p.updatedAt || '2026-07-25 12:00:00',
    }));

  try {
    const ipcProjects = await ObtenerProyectosRecientes();
    if (Array.isArray(ipcProjects) && ipcProjects.length > 0) {
      const mergedMap = new Map<string, ProyectoResumen>();
      for (const p of ipcProjects) {
        if (hiddenIds.includes(String(p.id))) continue;
        const stored = map[String(p.id)];
        if (stored) {
          mergedMap.set(String(p.id), {
            id: stored.id,
            titulo: stored.title,
            sinopsis: stored.synopsis,
            ruta_archivo: p.ruta_archivo || `/proyectos/${stored.title.toLowerCase().replace(/\s+/g, '_')}.json`,
            creado_en: p.creado_en || stored.createdAt || stored.updatedAt,
          });
        } else {
          mergedMap.set(String(p.id), p);
        }
      }
      for (const p of localProjects) {
        if (!mergedMap.has(String(p.id))) {
          mergedMap.set(String(p.id), p);
        }
      }
      return Array.from(mergedMap.values());
    }
  } catch (e) {
    console.warn("IPC unavailable, using localStorage projects:", e);
  }
  return localProjects;
}

export async function fetchDetallesProyecto(proyectoId: number): Promise<ProyectoDetalle> {
  const loaded = loadProjectFromStorage(proyectoId);
  if (loaded) {
    return {
      id: Number(loaded.id) || proyectoId,
      titulo: loaded.title,
      ruta_archivo: `/proyectos/${loaded.title.toLowerCase().replace(/\s+/g, '_')}.json`,
      sinopsis: loaded.synopsis || '',
      actos: loaded.acts.map((a) => ({
        id: typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace('act-', ''), 10) || 1,
        titulo: a.nombre,
        orden: a.orden,
      })),
    };
  }

  try {
    return await ObtenerDetallesProyecto(proyectoId);
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
