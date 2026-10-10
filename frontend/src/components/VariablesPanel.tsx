import { useState } from 'react';

import type { Variable } from '../lib/entities';

export function VariablesPanel({
  variables,
  onChange,
}: {
  variables: Variable[];
  onChange: (v: Variable[]) => void;
}) {
  const [nuevo, setNuevo] = useState<Partial<Variable>>({ nombre: '' });

  const agregar = () => {
    if (!nuevo.nombre?.trim()) return;
    const id = `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onChange([
      ...variables,
      {
        id,
        nombre: nuevo.nombre.trim(),
        valor: nuevo.valor || '',
        tipo: nuevo.tipo || '',
        descripcion: nuevo.descripcion || '',
      },
    ]);
    setNuevo({ nombre: '', valor: '', tipo: '', descripcion: '' });
  };

  const eliminar = (id: string) => {
    onChange(variables.filter((v) => v.id !== id));
  };

  return (
    <div className="bg-brand-surface/80 border border-brand-surface rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-brand-text">Variables</h3>
      <div className="space-y-2">
        {variables.map((v) => (
          <div key={v.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
            <div>
              <div className="text-xs text-brand-text font-semibold">{v.nombre}{v.valor ? ` = ${v.valor}` : ''}</div>
              {v.tipo && <div className="text-[10px] text-slate-400">Tipo: {v.tipo}</div>}
            </div>
            <button onClick={() => eliminar(v.id)} className="text-[10px] text-rose-400 hover:text-rose-300 px-1">
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <input
          value={nuevo.nombre || ''}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          placeholder="Nombre"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          value={nuevo.valor || ''}
          onChange={(e) => setNuevo({ ...nuevo, valor: e.target.value })}
          placeholder="Valor"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          value={nuevo.tipo || ''}
          onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
          placeholder="Tipo"
          className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
        <input
          value={nuevo.descripcion || ''}
          onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
          placeholder="Descripción"
          className="col-span-2 px-2 py-1 rounded bg-slate-800/70 border border-slate-700 text-brand-text"
        />
      </div>
      <button onClick={agregar} className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-brand-text">
        + Añadir Variable
      </button>
    </div>
  );
}
