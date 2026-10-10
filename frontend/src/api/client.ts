import {
  ListarProyectos,
  ObtenerProyecto,
  GuardarProyecto,
  EliminarProyecto,
} from '../../wailsjs/go/main/App';
import type { ProjectData, ProyectoResumen } from '../lib/types';
import {
  DEMO_CYBERNIGHTS,
  DEMO_SHADOW_REALM,
  getHiddenProjectIds,
  restoreProjectToDashboard,
} from '../lib/storage';

// -----------------------------------------------------------------------------
// Repositorio de proyectos.
//
// Fuente de verdad única:
//   - En escritorio (Wails disponible) -> SQLite a través del backend Go.
//   - En navegador/tests (sin Wails)  -> almacén en memoria del módulo.
//
// localStorage NO se usa para persistir proyectos; sólo preferencias de UI
// (proyectos ocultos), gestionadas en lib/storage.ts.
// -----------------------------------------------------------------------------

const LEGACY_PROJECTS_KEY = 'guionstudio_projects_map';
const LEGACY_ACTIVE_KEY = 'guionstudio_active_project';

function hasWails(): boolean {
  return typeof window !== 'undefined' && !!(window as any).go?.main?.App;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

let memoryStore: Record<string, ProjectData> = {};

/** Reinicia el almacén en memoria con los proyectos de ejemplo (tests/navegador). */
export function seedDemoProjects(): void {
  memoryStore = {
    '1': clone(DEMO_CYBERNIGHTS),
    '2': clone(DEMO_SHADOW_REALM),
  };
}

/** Vacía el almacén en memoria (tests/navegador). */
export function clearProjectsStore(): void {
  memoryStore = {};
}

/**
 * Lectura síncrona del almacén en memoria. En escritorio devuelve null porque
 * los datos sólo viven en SQLite. Permite inicializar la UI sin parpadeo en
 * tests/navegador.
 */
export function getProyectoCached(id: string): ProjectData | null {
  if (hasWails()) return null;
  return memoryStore[String(id)] ?? null;
}

function toResumen(p: ProjectData): ProyectoResumen {
  return {
    id: String(p.id),
    titulo: p.title,
    sinopsis: p.synopsis || '',
    ruta_archivo: `/proyectos/${p.title.toLowerCase().replace(/\s+/g, '_')}.json`,
    creado_en: p.createdAt || p.updatedAt,
  };
}

function normalize(p: ProjectData): ProjectData {
  return { ...p, id: String(p.id) };
}

/** Lista los proyectos visibles ordenados por última edición. */
export async function fetchProyectosRecientes(): Promise<ProyectoResumen[]> {
  const hiddenIds = getHiddenProjectIds();

  if (hasWails()) {
    const projects = await ListarProyectos();
    return (projects || [])
      .filter((p) => !hiddenIds.includes(String(p.id)))
      .map((p) => ({
        id: String(p.id),
        titulo: p.titulo,
        sinopsis: p.sinopsis,
        ruta_archivo: p.ruta_archivo,
        creado_en: p.creado_en,
      }));
  }

  return Object.values(memoryStore)
    .filter((p) => !hiddenIds.includes(String(p.id)))
    .map(toResumen);
}

/** Carga el grafo completo de un proyecto. */
export async function fetchDetallesProyecto(id: string): Promise<ProjectData | null> {
  if (hasWails()) {
    const project = await ObtenerProyecto(String(id));
    return project ? (project as unknown as ProjectData) : null;
  }
  return memoryStore[String(id)] ?? null;
}

/** Persiste (crea o actualiza) un proyecto con todo su grafo. */
export async function guardarProyecto(data: ProjectData): Promise<void> {
  const payload = normalize(data);
  if (hasWails()) {
    await GuardarProyecto(payload as any);
    return;
  }
  memoryStore[payload.id] = clone(payload);
}

/** Elimina un proyecto y lo restituye por si estaba oculto. */
export async function eliminarProyecto(id: string): Promise<void> {
  if (hasWails()) {
    await EliminarProyecto(String(id));
  } else {
    delete memoryStore[String(id)];
  }
  restoreProjectToDashboard(id);
}

/**
 * Migración de una sola vez: importa los proyectos que vivían en localStorage
 * (versiones anteriores) a SQLite y limpia las claves antiguas.
 */
export async function migrarProyectosLegacy(): Promise<void> {
  if (!hasWails()) return;
  const raw = localStorage.getItem(LEGACY_PROJECTS_KEY);
  if (!raw) return;
  try {
    const map = JSON.parse(raw) as Record<string, ProjectData>;
    for (const project of Object.values(map)) {
      if (project && project.id !== undefined && project.title) {
        await GuardarProyecto(normalize(project) as any);
      }
    }
    localStorage.removeItem(LEGACY_PROJECTS_KEY);
    localStorage.removeItem(LEGACY_ACTIVE_KEY);
  } catch (e) {
    console.warn('No se pudieron migrar los proyectos antiguos:', e);
  }
}
