type ProjectDetailsCardProps = {
  title: string;
  synopsis: string;
  onTitleChange: (value: string) => void;
  onSynopsisChange: (value: string) => void;
};

export function ProjectDetailsCard({
  title,
  synopsis,
  onTitleChange,
  onSynopsisChange,
}: ProjectDetailsCardProps) {
  return (
    <div className="bg-brand-surface/80 backdrop-blur-sm border border-[#3B3E47]/80 rounded-2xl p-6 shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3B3E47] pb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[11px] font-black tracking-wider text-violet-300 bg-[#FD7014]/10/60 border border-violet-800/60 px-3 py-1.5 rounded-lg uppercase shrink-0">
            Proyecto Activo
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-2xl md:text-3xl font-black text-brand-text bg-brand-bg/80 border border-[#3B3E47] focus:border-[#FD7014] rounded-xl px-3.5 py-1.5 w-full transition focus:outline-none tracking-tight"
            placeholder="Nombre del proyecto..."
            title="Haz clic para editar el nombre del proyecto"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Sinopsis Argumental del Proyecto:
        </label>
        <textarea
          value={synopsis}
          onChange={(e) => onSynopsisChange(e.target.value)}
          rows={2}
          className="w-full bg-brand-bg/80 border border-[#3B3E47]/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#FD7014] leading-relaxed transition font-sans"
          placeholder="Escribe la sinopsis argumental del proyecto..."
          title="Haz clic para editar la sinopsis del proyecto"
        />
      </div>
    </div>
  );
}
