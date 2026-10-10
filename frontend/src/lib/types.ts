// Tipos del contrato IPC (espejo de internal/store/store.go)
export type ProyectoResumen = {
  id: string;
  titulo: string;
  ruta_archivo?: string | null;
  sinopsis?: string;
  creado_en: string;
};

// Exportar entidades auxiliares
export * from './entities';

// Types for Narrative Board
export type SceneConnection = {
  id: string;
  target_scene_id: string;
  label?: string;
};

export type Scene = {
  id: string;
  act_id: string;
  orden: number;
  titulo: string;
  estado: 'Borrador' | 'Revisado' | 'Final';
  descripcion: string;
  escaleta: string;
  diseno_nivel?: string;
  sonido?: string;
  texto_juego?: string;
  dialogos?: string;
  conexiones?: SceneConnection[];
};

export type Act = {
  id: string;
  orden: number;
  nombre: string;
  sinopsis?: string;
  plot_point: string;
};

export type ProjectData = {
  id: string;
  title: string;
  synopsis?: string;
  acts: Act[];
  scenes: Scene[];
  updatedAt: string;
  createdAt?: string;
  personajes?: import('./entities').Personaje[];
  ubicaciones?: import('./entities').Ubicacion[];
  variables?: import('./entities').Variable[];
  timeline?: import('./entities').EventoTimeline[];
};
