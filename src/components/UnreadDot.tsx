import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { watchInbox } from "@/lib/chat";

/** Number of chats whose newest message was sent by someone else and not read yet. */
export function useUnreadMessages(): number {
  const { user } = useAuth();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!user) { setN(0); return; }
    return watchInbox(
      user.uid,
      (chats) => setN(chats.filter((c) => !c.muted?.[user.uid] && c.lastSender && c.lastSender !== user.uid && c.lastAt > (c.lastRead[user.uid] || 0)).length),
      () => {}
    );
  }, [user?.uid]);
  return n;
}

/** Small green dot shown on top of an icon (put it inside a `relative` parent). */
export default function UnreadDot({ className = "-top-0.5 -right-0.5" }: { className?: string }) {
  const n = useUnreadMessages();
  if (n <= 0) return null;
  return <span className={`absolute ${className} w-3 h-3 rounded-full bg-green-500 border-2 border-background`} aria-label="Unread messages" />;
}
