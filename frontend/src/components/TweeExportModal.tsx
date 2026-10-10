type TweeExportModalProps = {
  open: boolean;
  format: 'Harlowe' | 'SugarCube';
  onFormatChange: (format: 'Harlowe' | 'SugarCube') => void;
  onCancel: () => void;
  onExport: () => void;
};

export function TweeExportModal({
  open,
  format,
  onFormatChange,
  onCancel,
  onExport,
}: TweeExportModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-surface border border-[#3B3E47] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
          <span>🎮</span> Exportar a Twine (.twee)
        </h3>
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Selecciona el formato de historia:
          </label>
          <div className="space-y-2.5">
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              format === 'Harlowe'
                ? 'bg-[#FD7014]/10/40 border-[#FD7014]/60 text-violet-200'
                : 'bg-brand-bg/60 border-[#3B3E47] text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="twee-format"
                value="Harlowe"
                checked={format === 'Harlowe'}
                onChange={() => onFormatChange('Harlowe')}
                className="mt-0.5 accent-violet-500"
              />
              <div>
                <span className="text-xs font-bold block text-brand-text">Harlowe 3.x (Recomendado)</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Formato estándar de Twine para narrativa interactiva y ficción. Fácil de usar y predeterminado.</p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              format === 'SugarCube'
                ? 'bg-[#FD7014]/10/40 border-[#FD7014]/60 text-violet-200'
                : 'bg-brand-bg/60 border-[#3B3E47] text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="twee-format"
                value="SugarCube"
                checked={format === 'SugarCube'}
                onChange={() => onFormatChange('SugarCube')}
                className="mt-0.5 accent-violet-500"
              />
              <div>
                <span className="text-xs font-bold block text-brand-text">SugarCube 2.x</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Formato avanzado con integración de JavaScript, inventarios y estado de juego completo.</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onExport}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold rounded-xl shadow-lg transition"
          >
            Exportar .twee
          </button>
        </div>
      </div>
    </div>
  );
}
