import { useState } from 'react';

import type { Ubicacion } from '../lib/entities';

export function LocationsPanel({
  ubicaciones,
  onChange,
}: {
  ubicaciones: Ubicacion[];
  onChange: (u: Ubicacion[]) => void;
}) {
  const [nuevo, setNuevo] = useState<Partial<Ubicacion>>({ nombre: '' });

  const agregar = () => {
    if (!nuevo.nombre?.trim()) return;
    const id = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onChange([
      ...ubicaciones,
      {
        id,
        nombre: nuevo.nombre.trim(),
        descripcion: nuevo.descripcion || '',
        notas: nuevo.notas || '',
      },
    ]);
    setNuevo({ nombre: '', descripcion: '', notas: '' });
  };

  const eliminar = (id: string) => {
    onChange(ubicaciones.filter((u) => u.id !== id));
  };

  return (
    <div className="bg-brand-surface/80 border border-brand-surface rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-brand-text">Ubicaciones</h3>
      <div className="space-y-2">
        {ubicaciones.map((u) => (
          <div key={u.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
            <div>
              <div className="text-xs text-brand-text font-semibold">{u.nombre}</div>
              {u.descripcion && <div className="text-[10px] text-slate-400 line-clamp-1">{u.descripcion}</div>}
            </div>
            <button onClick={() => eliminar(u.id)} className="text-[10px] text-rose-400 hover:text-rose-300 px-1">
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <input
          value={nuevo.nombre || ''}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          placeholder="Nombre"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          value={nuevo.descripcion || ''}
          onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
          placeholder="Descripción"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          value={nuevo.notas || ''}
          onChange={(e) => setNuevo({ ...nuevo, notas: e.target.value })}
          placeholder="Notas"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
      </div>
      <button onClick={agregar} className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-brand-text">
        + Añadir Ubicación
      </button>
    </div>
  );
}
