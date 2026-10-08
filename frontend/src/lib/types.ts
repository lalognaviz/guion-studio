// Types for IPC Rust Models
export type ProyectoResumen = {
  id: number | string;
  titulo: string;
  ruta_archivo?: string | null;
  sinopsis?: string;
  creado_en: string;
};

export type ActoResumen = {
  id: number;
  titulo: string;
  orden: number;
};

export type ProyectoDetalle = {
  id: number;
  titulo: string;
  ruta_archivo?: string | null;
  sinopsis: string;
  actos: ActoResumen[];
};

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
  id: string | number;
  title: string;
  synopsis?: string;
  acts: Act[];
  scenes: Scene[];
  updatedAt: string;
  createdAt?: string;
};
