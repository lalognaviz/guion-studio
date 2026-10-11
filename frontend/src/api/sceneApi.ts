// API tipada de escenas.
//
// Proporciona el contrato de operaciones de grafo usado por el backend Wails
// (``internal/application/scene_service.go``) con el mismo significado
// semántico. Cuando Wails no está disponible (navegador/tests) se aplica la
// misma operación sobre el almacén en memoria vía `guardarProyecto`.
import {
  ActualizarEscena,
  CambiarEstadoEscena,
  ConectarEscenas,
  CrearEscena,
  DesconectarEscenas,
  EliminarEscena,
  MoverEscena,
  ReordenarEscena,
} from '../../wailsjs/go/main/App';
import { domain } from '../../wailsjs/go/models';
import { deleteSceneFrom, updateSceneIn } from '../lib/sceneOperations';
import type { SceneConnection, ProjectData, Scene } from '../lib/types';
import { getProyectoCached, guardarProyecto } from './client';

export type EstadoEscena = Scene['estado'];

export const ESTADOS_ESCENA: readonly EstadoEscena[] = ['Borrador', 'Revisado', 'Final'];

export function esEstadoEscenaValido(estado: string): estado is EstadoEscena {
  return (ESTADOS_ESCENA as readonly string[]).includes(estado);
}

function hasWails(): boolean {
  return typeof window !== 'undefined' && !!(window as any).go?.main?.App;
}

function nuevoId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clonar<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function escenaDe(proyecto: ProjectData, escenaID: string): Scene {
  const escena = proyecto.scenes.find((s) => s.id === escenaID);
  if (!escena) throw new Error(`Escena "${escenaID}" no encontrada.`);
  return escena;
}

function renumerar(escenas: Scene[]): Scene[] {
  return escenas
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((s, i) => ({ ...s, orden: i + 1 }));
}

/**
 * Aplica `mutar` sobre una copia clonada del proyecto y persiste el resultado.
 * Resuelve con el valor devuelto por `mutar`.
 */
function editarProyecto<T>(proyectoID: string, mutar: (p: ProjectData) => T): Promise<T> {
  const proyecto = clonar(getProyectoCached(proyectoID));
  if (!proyecto) return Promise.reject(new Error(`Proyecto "${proyectoID}" no encontrado.`));
  const resultado = mutar(proyecto);
  return guardarProyecto(proyecto).then(() => resultado);
}

export const sceneApi = {
  crear(proyectoID: string, actoID: string, titulo: string): Promise<Scene> {
    if (hasWails()) {
      return CrearEscena(proyectoID, actoID, titulo) as Promise<Scene>;
    }
    return editarProyecto(proyectoID, (proyecto) => {
      const orden = proyecto.scenes
        .filter((s) => s.act_id === actoID)
        .reduce((max, s) => Math.max(max, s.orden), 0) + 1;
      const nueva: Scene = {
        id: nuevoId('scn'),
        act_id: actoID,
        orden,
        titulo,
        estado: 'Borrador',
        descripcion: '',
        escaleta: '',
      };
      proyecto.scenes.push(nueva);
      return nueva;
    });
  },

  actualizar(proyectoID: string, escena: Scene): Promise<void> {
    if (hasWails()) {
      return ActualizarEscena(proyectoID, new domain.Escena(escena));
    }
    return editarProyecto(proyectoID, (proyecto) => {
      proyecto.scenes = updateSceneIn(proyecto.scenes, escena);
    });
  },

  eliminar(proyectoID: string, escenaID: string): Promise<void> {
    if (hasWails()) {
      return EliminarEscena(proyectoID, escenaID);
    }
    return editarProyecto(proyectoID, (proyecto) => {
      proyecto.scenes = deleteSceneFrom(proyecto.scenes, escenaID);
    });
  },

  mover(proyectoID: string, escenaID: string, actoDestinoID: string, posicion: number): Promise<void> {
    if (hasWails()) {
      return MoverEscena(proyectoID, escenaID, actoDestinoID, posicion);
    }
    return editarProyecto(proyectoID, (proyecto) => {
      const movida = { ...escenaDe(proyecto, escenaID) };
      const actoOrigenID = movida.act_id;
      const resto = proyecto.scenes.filter((s) => s.id !== escenaID);

      movida.act_id = actoDestinoID;
      const destino = resto.filter((s) => s.act_id === actoDestinoID);
      const pos = Math.max(1, Math.min(posicion, destino.length + 1));
      destino.splice(pos - 1, 0, movida);

      const otros = resto.filter((s) => s.act_id !== actoOrigenID && s.act_id !== actoDestinoID);
      const origen = actoOrigenID === actoDestinoID ? [] : resto.filter((s) => s.act_id === actoOrigenID);
      proyecto.scenes = [...renumerar(origen), ...otros, ...renumerar(destino)];
    });
  },

  reordenar(proyectoID: string, escenaID: string, posicion: number): Promise<void> {
    if (hasWails()) {
      return ReordenarEscena(proyectoID, escenaID, posicion);
    }
    return editarProyecto(proyectoID, (proyecto) => {
      const movida = { ...escenaDe(proyecto, escenaID) };
      const acto = movida.act_id;
      const resto = proyecto.scenes.filter((s) => s.id !== escenaID);
      const mismoActo = resto.filter((s) => s.act_id === acto);
      const pos = Math.max(1, Math.min(posicion, mismoActo.length + 1));
      mismoActo.splice(pos - 1, 0, movida);
      proyecto.scenes = [...resto.filter((s) => s.act_id !== acto), ...renumerar(mismoActo)];
    });
  },

  conectar(proyectoID: string, originSceneID: string, targetSceneID: string, label?: string): Promise<SceneConnection> {
    if (hasWails()) {
      return ConectarEscenas(proyectoID, originSceneID, targetSceneID, label ?? '') as Promise<SceneConnection>;
    }
    return editarProyecto(proyectoID, (proyecto) => {
      if (originSceneID === targetSceneID) {
        throw new Error('No se puede conectar una escena consigo misma.');
      }
      const origen = escenaDe(proyecto, originSceneID);
      escenaDe(proyecto, targetSceneID);
      const yaExiste = (origen.conexiones || []).some((c) => c.target_scene_id === targetSceneID);
      if (yaExiste) {
        throw new Error('Ya existe una conexión hacia esa escena.');
      }
      const conexion: SceneConnection = { id: nuevoId('con'), target_scene_id: targetSceneID, label: label };
      origen.conexiones = [...(origen.conexiones || []), conexion];
      return conexion;
    });
  },

  desconectar(proyectoID: string, sceneConnectionID: string): Promise<void> {
    if (hasWails()) {
      return DesconectarEscenas(proyectoID, sceneConnectionID);
    }
    return editarProyecto(proyectoID, (proyecto) => {
      proyecto.scenes = proyecto.scenes.map((s) =>
        s.conexiones?.some((c) => c.id === sceneConnectionID)
          ? { ...s, conexiones: s.conexiones.filter((c) => c.id !== sceneConnectionID) }
          : s
      );
    });
  },

  cambiarEstado(proyectoID: string, escenaID: string, estado: string): Promise<void> {
    if (hasWails()) {
      return CambiarEstadoEscena(proyectoID, escenaID, estado);
    }
    return editarProyecto(proyectoID, (proyecto) => {
      if (!esEstadoEscenaValido(estado)) {
        throw new Error(`Estado de escena inválido: "${estado}".`);
      }
      const escena = escenaDe(proyecto, escenaID);
      escena.estado = estado;
    });
  },
};

export type SceneApi = typeof sceneApi;