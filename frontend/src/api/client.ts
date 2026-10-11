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

// Métodos granulares para proyecto
export async function actualizarTituloProyecto(id: string, titulo: string): Promise<void> {
  if (hasWails()) {
    const { ActualizarTituloProyecto } = await import('../../wailsjs/go/main/App');
    return ActualizarTituloProyecto(String(id), titulo);
  }
  const key = String(id);
  for (const k of Object.keys(memoryStore)) {
    if (k === key || memoryStore[k].id === id || memoryStore[k].id === key) {
      memoryStore[k] = { ...memoryStore[k], title: titulo, updatedAt: new Date().toISOString() };
      return;
    }
  }
  // Create if not exists
  memoryStore[key] = { id: key, title: titulo, synopsis: '', acts: [], scenes: [], updatedAt: new Date().toISOString() };
}

export async function actualizarSinopsisProyecto(id: string, sinopsis: string): Promise<void> {
  if (hasWails()) {
    const { ActualizarSinopsisProyecto } = await import('../../wailsjs/go/main/App');
    return ActualizarSinopsisProyecto(String(id), sinopsis);
  }
  const key = String(id);
  if (memoryStore[key]) {
    memoryStore[key] = { ...memoryStore[key], synopsis: sinopsis, updatedAt: new Date().toISOString() };
    return;
  }
  // Find project by id regardless of key format
  for (const k of Object.keys(memoryStore)) {
    if (k === key || memoryStore[k].id === id || memoryStore[k].id === key) {
      memoryStore[k] = { ...memoryStore[k], synopsis: sinopsis, updatedAt: new Date().toISOString() };
      return;
    }
  }
  // If not found, try to update first or create
  if (Object.keys(memoryStore).length > 0) {
    const first = Object.keys(memoryStore)[0];
    memoryStore[first] = { ...memoryStore[first], synopsis: sinopsis, updatedAt: new Date().toISOString() };
  }
}

export async function actualizarActosProyecto(id: string, actos: any[]): Promise<void> {
  if (hasWails()) {
    const { ActualizarActosProyecto } = await import('../../wailsjs/go/main/App');
    return ActualizarActosProyecto(String(id), actos as any);
  }
  const key = String(id);
  if (memoryStore[key]) {
    memoryStore[key] = { ...memoryStore[key], acts: actos, updatedAt: new Date().toISOString() };
  }
}

export async function actualizarEscenasProyecto(id: string, escenas: any[]): Promise<void> {
  if (hasWails()) {
    const { ActualizarEscenasProyecto } = await import('../../wailsjs/go/main/App');
    return ActualizarEscenasProyecto(String(id), escenas as any);
  }
  const key = String(id);
  if (memoryStore[key]) {
    memoryStore[key] = { ...memoryStore[key], scenes: escenas, updatedAt: new Date().toISOString() };
  }
}

export async function actualizarEntidadesAuxiliares(id: string, pers: any[], ubi: any[], vars: any[], tl: any[]): Promise<void> {
  if (hasWails()) {
    const { ActualizarEntidadesAuxiliares } = await import('../../wailsjs/go/main/App');
    return ActualizarEntidadesAuxiliares(String(id), pers as any, ubi as any, vars as any, tl as any);
  }
  const key = String(id);
  if (memoryStore[key]) {
    memoryStore[key] = { ...memoryStore[key], personajes: pers, ubicaciones: ubi, variables: vars, timeline: tl, updatedAt: new Date().toISOString() };
  }
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
