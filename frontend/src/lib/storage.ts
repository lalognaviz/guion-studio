import type { Act, ProjectData, ProyectoResumen, Scene } from './types';

export const INITIAL_ACTS: Act[] = [
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

export const INITIAL_SCENES: Scene[] = [
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

// Default empty map — no demo projects pre-populated
export const DEFAULT_PROJECTS_MAP: Record<string, ProjectData> = {};

// Demo project data available for "Create example project" and tests
export const DEMO_CYBERNIGHTS: ProjectData = {
  id: 1,
  title: 'CyberNights',
  synopsis: 'Un thriller cyberpunk sobre conspiraciones corporativas.',
  acts: INITIAL_ACTS,
  scenes: INITIAL_SCENES,
  updatedAt: new Date().toISOString(),
  createdAt: '2026-07-25 12:00:00',
};

export const DEMO_SHADOW_REALM: ProjectData = {
  id: 2,
  title: 'Shadow Realm',
  synopsis: 'Fantasía oscura y supervivencia en el reino de las sombras.',
  acts: [
    { id: 'act-4', orden: 1, nombre: 'El Despertar', sinopsis: 'Despertar en la oscuridad.', plot_point: 'Encuentro con la sombra.' },
    { id: 'act-5', orden: 2, nombre: 'La Caída', sinopsis: 'Descenso al abismo.', plot_point: 'Traición del aliado.' },
    { id: 'act-6', orden: 3, nombre: 'El Eclipse', sinopsis: 'Batalla final contra la sombra.', plot_point: 'El eclipse total.' },
  ],
  scenes: [],
  updatedAt: new Date().toISOString(),
  createdAt: '2026-07-25 11:30:00',
};

export function seedDemoProjects(): void {
  const map = getStoredProjectsMap();
  map['1'] = DEMO_CYBERNIGHTS;
  map['2'] = DEMO_SHADOW_REALM;
  localStorage.setItem('guionstudio_projects_map', JSON.stringify(map));
}

export function getStoredProjectsMap(): Record<string, ProjectData> {
  const raw = localStorage.getItem('guionstudio_projects_map');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      console.error("Error parsing guionstudio_projects_map:", e);
    }
  }
  return {};
}

export function saveProjectToStorage(project: ProjectData) {
  const map = getStoredProjectsMap();
  map[String(project.id)] = project;
  localStorage.setItem('guionstudio_projects_map', JSON.stringify(map));
  localStorage.setItem('guionstudio_active_project', JSON.stringify(project));
}

export function loadProjectFromStorage(id: string | number): ProjectData | null {
  const map = getStoredProjectsMap();
  const idStr = String(id);
  if (map[idStr]) {
    return map[idStr];
  }
  const keys = Object.keys(map);
  const matchedKey = keys.find((k) => k === idStr || `proj-${k}` === idStr || k === idStr.replace('proj-', ''));
  if (matchedKey && map[matchedKey]) {
    return map[matchedKey];
  }
  return null;
}

// Project Visibility & Deletion Storage Helpers
export function getHiddenProjectIds(): string[] {
  const raw = localStorage.getItem('guionstudio_hidden_projects');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      console.error("Error parsing guionstudio_hidden_projects:", e);
    }
  }
  return [];
}

export function hideProjectFromDashboard(id: string | number) {
  const hidden = getHiddenProjectIds();
  const idStr = String(id);
  if (!hidden.includes(idStr)) {
    hidden.push(idStr);
    localStorage.setItem('guionstudio_hidden_projects', JSON.stringify(hidden));
  }
}

export function restoreProjectToDashboard(id: string | number) {
  const hidden = getHiddenProjectIds();
  const idStr = String(id);
  const updated = hidden.filter((hId) => hId !== idStr);
  localStorage.setItem('guionstudio_hidden_projects', JSON.stringify(updated));
}

export function deleteProjectPermanently(id: string | number) {
  const map = getStoredProjectsMap();
  const idStr = String(id);
  delete map[idStr];
  const matchedKey = Object.keys(map).find(
    (k) => k === idStr || `proj-${k}` === idStr || k === idStr.replace('proj-', '')
  );
  if (matchedKey) {
    delete map[matchedKey];
  }
  localStorage.setItem('guionstudio_projects_map', JSON.stringify(map));
  restoreProjectToDashboard(id);

  const activeRaw = localStorage.getItem('guionstudio_active_project');
  if (activeRaw) {
    try {
      const active = JSON.parse(activeRaw);
      if (active && String(active.id) === idStr) {
        localStorage.removeItem('guionstudio_active_project');
      }
    } catch (e) {}
  }
}

export function fetchProyectosOcultos(): ProyectoResumen[] {
  const map = getStoredProjectsMap();
  const hiddenIds = getHiddenProjectIds();
  return Object.values(map)
    .filter((p) => hiddenIds.includes(String(p.id)))
    .map((p) => ({
      id: p.id,
      titulo: p.title,
      sinopsis: p.synopsis,
      ruta_archivo: `/proyectos/${p.title.toLowerCase().replace(/\s+/g, '_')}.json`,
      creado_en: p.createdAt || p.updatedAt || '2026-07-25 12:00:00',
    }));
}
