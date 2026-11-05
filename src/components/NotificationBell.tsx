import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { watchNotifications } from "@/lib/notifications";

export default function NotificationBell({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    return watchNotifications(user.uid, (list) => setUnread(list.filter((n) => !n.read).length), () => {});
  }, [user?.uid]);

  if (!user) return null;
  return (
    <button onClick={() => setLocation("/notifications")} aria-label="Notifications" className={`relative text-2xl px-2 ${className}`}>
      🔔
      {unread > 0 && (
        <span className="absolute -top-1 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-sans flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
