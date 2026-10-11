import { useState } from 'react';

import type { EventoTimeline } from '../lib/entities';
import type { Scene } from '../lib/types';

export function TimelinePanel({
  timeline,
  scenes,
  onChange,
}: {
  timeline: EventoTimeline[];
  scenes: Scene[];
  onChange: (t: EventoTimeline[]) => void;
}) {
  const [nuevo, setNuevo] = useState<Partial<EventoTimeline>>({ titulo: '', orden: timeline.length + 1 });

  const agregar = () => {
    if (!nuevo.titulo?.trim()) return;
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onChange([
      ...timeline,
      {
        id,
        orden: nuevo.orden && nuevo.orden > 0 ? nuevo.orden : timeline.length + 1,
        titulo: nuevo.titulo.trim(),
        descripcion: nuevo.descripcion || '',
        escena_id: nuevo.escena_id || '',
        fecha: nuevo.fecha || '',
      },
    ]);
    setNuevo({ titulo: '', orden: timeline.length + 2, descripcion: '', escena_id: '', fecha: '' });
  };

  const eliminar = (id: string) => {
    onChange(timeline.filter((t) => t.id !== id));
  };

  const reordenar = () => {
    const ordenados = [...timeline].sort((a, b) => a.orden - b.orden).map((t, i) => ({ ...t, orden: i + 1 }));
    onChange(ordenados);
  };

  return (
    <div className="bg-brand-surface/80 border border-brand-surface rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-brand-text">Línea Temporal</h3>
        <button onClick={reordenar} className="text-[10px] text-slate-300 hover:text-brand-text px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700">
          Reordenar
        </button>
      </div>
      <div className="space-y-2">
        {timeline.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
            <div>
              <div className="text-xs text-brand-text font-semibold">#{t.orden} {t.titulo}</div>
              {t.escena_id && <div className="text-[10px] text-slate-400">Escena: {t.escena_id}</div>}
            </div>
            <button onClick={() => eliminar(t.id)} className="text-[10px] text-rose-400 hover:text-rose-300 px-1">
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <input
          value={nuevo.titulo || ''}
          onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })}
          placeholder="Título"
          className="col-span-2 px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          type="number"
          value={nuevo.orden || timeline.length + 1}
          onChange={(e) => setNuevo({ ...nuevo, orden: Number(e.target.value) })}
          placeholder="Orden"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          value={nuevo.fecha || ''}
          onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })}
          placeholder="Fecha/Marcador"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <select
          value={nuevo.escena_id || ''}
          onChange={(e) => setNuevo({ ...nuevo, escena_id: e.target.value })}
          className="col-span-2 px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        >
          <option value="">Sin escena vinculada</option>
          {scenes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.titulo}
            </option>
          ))}
        </select>
        <input
          value={nuevo.descripcion || ''}
          onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
          placeholder="Descripción"
          className="col-span-2 px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
      </div>
      <button onClick={agregar} className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-brand-text">
        + Añadir Evento
      </button>
    </div>
  );
}
