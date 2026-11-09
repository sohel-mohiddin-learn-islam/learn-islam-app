import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "./firebase";

const WORKER = ((import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "").replace(/\/$/, "");
const PUSH_TEXT: Record<string, string> = {
  follow: "started following you",
  like: "liked your post",
  comment: "commented on your post",
  request: "sent you a follow request",
  mention: "mentioned you",
  message: "sent you a message",
};

/** Ask the free push server to wake the other phone (works even when the app is closed). */
async function sendPush(toUid: string, type: string, text?: string) {
  if (!WORKER || !auth.currentUser) return;
  try {
    const token = await auth.currentUser.getIdToken();
    const name = auth.currentUser.displayName || "Someone";
    await fetch(`${WORKER}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUid, title: "Learn Islam", body: `${name} ${PUSH_TEXT[type] || "sent a notification"}${type === "comment" && text ? `: ${text}` : ""}` }),
    });
  } catch {}
}

export type NotifType = "follow" | "like" | "comment" | "request" | "mention" | "message";

export type Notif = {
  id: string;
  type: NotifType;
  fromId: string;
  postId?: string;
  thumb?: string | null;
  text?: string;
  createdAt: number;
  read: boolean;
};

/** Tell `toUid` that `fromId` did something. The id is fixed per action so repeating it never duplicates. */
export async function notify(
  toUid: string,
  fromId: string,
  type: NotifType,
  extra: { postId?: string; thumb?: string | null; text?: string; key?: string } = {}
) {
  if (toUid === fromId) return;
  const id = `${type}_${fromId}_${extra.key || extra.postId || ""}`;
  await setDoc(doc(db, "users", toUid, "notifications", id), {
    type,
    fromId,
    postId: extra.postId || null,
    thumb: extra.thumb || null,
    text: extra.text || "",
    createdAt: Date.now(),
    read: false,
  }).catch((e) => console.warn("Could not send notification:", e));
  void sendPush(toUid, type, extra.text);
}

export function watchNotifications(uid: string, cb: (n: Notif[]) => void, onError?: (e: any) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(100)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as Notif)),
    onError
  );
}

export async function markAllRead(uid: string, items: Notif[]) {
  await Promise.all(
    items.filter((n) => !n.read).map((n) => updateDoc(doc(db, "users", uid, "notifications", n.id), { read: true }).catch(() => {}))
  );
}

export async function clearAll(uid: string) {
  const snap = await getDocs(collection(db, "users", uid, "notifications"));
  const { deleteDoc } = await import("firebase/firestore");
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
}
