export function NotificationToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-gradient-to-r from-[#FD7014] to-[#e65f0f] text-white px-5 py-2.5 rounded-xl shadow-2xl text-xs font-bold z-50 animate-bounce">
      {message}
    </div>
  );
}
