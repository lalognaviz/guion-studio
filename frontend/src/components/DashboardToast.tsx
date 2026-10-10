export function DashboardToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-brand-surface border border-[#FD7014]/50 text-brand-text text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
      <span className="text-[#FD7014]">✨</span>
      <span>{message}</span>
    </div>
  );
}