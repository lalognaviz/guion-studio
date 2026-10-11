type SaveAsModalProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function SaveAsModal({ open, value, onChange, onCancel, onSubmit }: SaveAsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-brand-surface border border-[#3B3E47] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-brand-text mb-2">Guardar Proyecto Como...</h3>
        <p className="text-xs text-slate-400 mb-4">
          Ingresa un nuevo nombre para el archivo de proyecto.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-brand-bg border border-[#3B3E47] rounded-xl p-3 text-sm text-brand-text mb-6 focus:outline-none focus:border-[#FD7014]"
        />
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold rounded-xl shadow-lg"
          >
            Descarga Directa
          </button>
        </div>
      </div>
    </div>
  );
}
