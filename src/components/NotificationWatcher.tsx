import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getProfile } from "@/lib/social";

const CHANNEL = "li-social";
const st = (m: string) => { try { localStorage.setItem("li_push_status", m); } catch {} };

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
  const [, navigate] = useLocation();

  // Tapping an alert (push or local) opens the exact screen straight away, skipping the intro video
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const go = (route?: string) => {
      if (!route || !/^\/[A-Za-z0-9/_-]*$/.test(route)) return;
      window.dispatchEvent(new Event("li-skip-intro"));
      navigate(route);
    };
    const hs: Promise<{ remove: () => void }>[] = [
      PushNotifications.addListener("pushNotificationActionPerformed", (a: any) => go(a?.notification?.data?.route)),
      LocalNotifications.addListener("localNotificationActionPerformed", (a: any) => go(a?.notification?.extra?.route)),
    ];
    return () => { hs.forEach((h) => h.then((x) => x.remove()).catch(() => {})); };
  }, []);

  // Register this phone for push alerts (delivered even when the app is closed)
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    let handle: { remove: () => void } | undefined;
    (async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== "granted") perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") { st("notification permission DENIED - allow it in Android Settings > Apps > Learn Islam > Notifications"); return; }
        handle = await PushNotifications.addListener("registration", (t) => {
          setDoc(doc(db, "users", user.uid, "tokens", t.value), { token: t.value, updatedAt: Date.now() })
            .then(() => st("registered OK"))
            .catch((e) => st("token save failed: " + (e?.code || e?.message)));
        });
        await PushNotifications.addListener("registrationError", (e: any) => st("FCM registration error: " + (e?.error || JSON.stringify(e))));
        st("requesting token...");
        await PushNotifications.register();
      } catch (e: any) { st("push setup error: " + (e?.message || e)); }
    })();
    return () => handle?.remove();
  }, [user]);

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
            if (n.type === "message") {
              const cid = [user.uid, n.fromId].sort().join("_");
              const c: any = (await getDoc(doc(db, "chats", cid)).catch(() => null))?.data?.();
              if (c?.muted?.[user.uid]) return;
            }
            const from = await getProfile(n.fromId).catch(() => null);
            LocalNotifications.schedule({
              notifications: [{
                id: Math.floor(Math.random() * 2_000_000_000),
                title: from?.displayName || "Learn Islam",
                body: bodyFor(n.type, n.text),
                schedule: { at: new Date(Date.now() + 400) },
                smallIcon: "ic_stat_icon",
                channelId: CHANNEL,
                extra: { route: n.type === "message" ? (String(d.id).includes("_group_") ? `/group/${String(d.id).split("_group_")[1]}` : String(d.id).includes("_gcall_") ? "/messages" : `/chat/${n.fromId}`) : n.type === "follow" || n.type === "request" ? `/user/${n.fromId}` : "/notifications" },
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
