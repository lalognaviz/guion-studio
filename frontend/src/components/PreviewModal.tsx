import type { ReactNode } from 'react';

import { generateMarkdownText, generateProjectJson, type ProjectSnapshot } from '../lib/export';

type PreviewTab = 'formatted' | 'raw' | 'json';

type PreviewModalProps = {
  open: boolean;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  onClose: () => void;
  snapshot: ProjectSnapshot;
  showNotification: (message: string) => void;
};

function applyInlineStyles(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={keyIdx++} className="font-bold text-brand-text">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={keyIdx++} className="italic text-slate-400">{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={keyIdx++} className="bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[11px] font-mono">{match[4]}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function renderFormattedMarkdown(mdText: string) {
  const lines = mdText.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### '))
      return <h3 key={i} className="text-sm font-bold text-indigo-300 mt-4 mb-1">{applyInlineStyles(line.slice(4))}</h3>;
    if (line.startsWith('## '))
      return <h2 key={i} className="text-base font-bold text-violet-300 mt-5 mb-1.5 border-b border-[#3B3E47] pb-1">{applyInlineStyles(line.slice(3))}</h2>;
    if (line.startsWith('# '))
      return <h1 key={i} className="text-xl font-black text-white mt-2 mb-2">{applyInlineStyles(line.slice(2))}</h1>;
    if (line.startsWith('> '))
      return <blockquote key={i} className="border-l-2 border-amber-500/60 pl-3 text-xs text-amber-200/80 italic my-1">{applyInlineStyles(line.slice(2))}</blockquote>;
    if (line.trim() === '---')
      return <hr key={i} className="border-[#3B3E47] my-3" />;
    if (line.trim().startsWith('```'))
      return null;
    if (line.trim() === '')
      return <div key={i} className="h-2" />;
    return <p key={i} className="text-xs text-slate-300 leading-relaxed my-0.5">{applyInlineStyles(line)}</p>;
  });
}

function renderColoredJson(jsonText: string) {
  const colored = jsonText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="text-[#FD7014]">"$1"</span>')
    .replace(/:\s*"([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
    .replace(/:\s*(\d+)/g, ': <span class="text-amber-400">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="text-rose-400">$1</span>');
  return <pre className="text-xs leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: colored }} />;
}

export function PreviewModal({
  open,
  tab,
  onTabChange,
  onClose,
  snapshot,
  showNotification,
}: PreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-brand-surface border border-[#3B3E47] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-surface border-b border-[#3B3E47] flex items-center justify-between">
          <h3 className="text-lg font-bold text-violet-300 flex items-center gap-2">
            <span>📖</span> Vista Previa del Guion
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#3B3E47] bg-brand-surface/80 px-6">
          {([
            { key: 'formatted' as const, label: '📖 Formateado' },
            { key: 'raw' as const, label: '📝 Markdown' },
            { key: 'json' as const, label: '📦 JSON' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                tab === t.key
                  ? 'text-violet-300 border-[#FD7014] bg-[#FD7014]/10/30'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-brand-bg scrollbar-hide">
          {tab === 'formatted' && (
            <div className="prose-custom">{renderFormattedMarkdown(generateMarkdownText(snapshot))}</div>
          )}
          {tab === 'raw' && (
            <div className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {generateMarkdownText(snapshot)}
            </div>
          )}
          {tab === 'json' && (
            <div className="font-mono text-slate-200">{renderColoredJson(generateProjectJson(snapshot))}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-brand-surface border-t border-[#3B3E47] flex items-center justify-between">
          <button
            onClick={() => {
              const content = tab === 'json' ? generateProjectJson(snapshot) : generateMarkdownText(snapshot);
              navigator.clipboard.writeText(content);
              showNotification(
                tab === 'json' ? 'JSON copiado al portapapeles' : 'Markdown copiado al portapapeles'
              );
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5"
          >
            📋 Copiar {tab === 'json' ? 'JSON' : 'Markdown'}
          </button>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-[#FD7014] to-[#e65f0f] hover:from-[#f57f2b] hover:to-[#e65f0f] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
}
