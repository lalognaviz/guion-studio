export type Personaje = {
  id: string;
  nombre: string;
  descripcion?: string;
  personalidad?: string;
  apariencia?: string;
  notas?: string;
};

export type Ubicacion = {
  id: string;
  nombre: string;
  descripcion?: string;
  notas?: string;
};

export type Variable = {
  id: string;
  nombre: string;
  valor?: string;
  tipo?: string;
  descripcion?: string;
};

export type EventoTimeline = {
  id: string;
  orden: number;
  titulo: string;
  descripcion?: string;
  escena_id?: string;
  fecha?: string;
};

export type Character = Personaje;
export type Location = Ubicacion;
export type TimelineEvent = EventoTimeline;

export type Opcion = {
  id: string;
  escena_id: string;
  target_scene_id?: string;
  texto: string;
  orden: number;
  condiciones?: string;
  consecuencias?: string;
};
export type Choice = Opcion;
