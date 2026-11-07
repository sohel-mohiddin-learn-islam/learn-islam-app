import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getProfile } from "@/lib/social";

const CHANNEL = "li-social";

const bodyFor = (type: string, text?: string) =>
  type === "like" ? "liked your reel"
  : type === "comment" ? `commented: ${text || ""}`
  : type === "follow" ? "started following you"
  : type === "request" ? "requested to follow you"
  : type === "mention" ? "mentioned you in their story"
  : type === "message" ? text || "sent you a message"
  : "sent you a notification";

/**
 * Shows a phone alert whenever a new like, comment, follow, request, mention or message arrives.
 * It works while the app is open or recently used. Alerts with the app fully closed need a push server (not part of the free setup).
 */
export default function NotificationWatcher() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    let stop = () => {};
    let cancelled = false;

    (async () => {
      try {
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
        if (perm.display !== "granted" || cancelled) return;
        await LocalNotifications.createChannel({ id: CHANNEL, name: "Likes, comments, follows and messages", importance: 4, visibility: 1 });
      } catch {
        return;
      }

      const seen = new Set<string>();
      let first = true;
      stop = onSnapshot(
        query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(30)),
        (snap) => {
          snap.docs.forEach(async (d) => {
            const n: any = d.data();
            const key = `${d.id}:${n.createdAt}`;
            if (seen.has(key)) return;
            seen.add(key);
            if (first || n.read) return; // existing items on start are not re-announced
            const from = await getProfile(n.fromId).catch(() => null);
            LocalNotifications.schedule({
              notifications: [{
                id: Math.floor(Math.random() * 2_000_000_000),
                title: from?.displayName || "Learn Islam",
                body: bodyFor(n.type, n.text),
                schedule: { at: new Date(Date.now() + 400) },
                smallIcon: "ic_stat_icon",
                channelId: CHANNEL,
              }],
            }).catch(() => {});
          });
          first = false;
        },
        () => {}
      );
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [user?.uid]);

  return null;
}
