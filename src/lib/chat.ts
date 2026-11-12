import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import { isFollowing } from "./social";
import { notify } from "./notifications";

export type ChatSummary = {
  id: string;
  participants: string[];
  lastMessage: string;
  lastAt: number;
  lastSender: string;
  lastRead: Record<string, number>;
  sentBy: Record<string, boolean>;
  general: Record<string, boolean>;
  muted: Record<string, boolean>;
};

/** Settings shared by the two people in a chat (stored on the chat document). */
export type ChatSettings = {
  theme: string;
  font: string;
  disappear: number; // seconds, 0 = off
  muted: Record<string, boolean>;
  general: Record<string, boolean>;
  nicks: Record<string, string>; // nicks[viewerUid] = name that viewer gave the other person
  clearedAt: Record<string, number>;
};

export const THEMES: Record<string, { name: string; bubble: string }> = {
  default: { name: "Default", bubble: "" },
  green: { name: "Green", bubble: "#16a34a" },
  blue: { name: "Blue", bubble: "#2563eb" },
  purple: { name: "Purple", bubble: "#9333ea" },
  pink: { name: "Pink", bubble: "#db2777" },
  orange: { name: "Orange", bubble: "#ea580c" },
  teal: { name: "Teal", bubble: "#0d9488" },
  gold: { name: "Gold", bubble: "#b8860b" },
};
export const FONTS: Record<string, { name: string; css: string }> = {
  default: { name: "Default", css: "" },
  serif: { name: "Serif", css: "Georgia, serif" },
  mono: { name: "Typewriter", css: "ui-monospace, monospace" },
  arabic: { name: "Amiri", css: "'Amiri', serif" },
  rounded: { name: "Rounded", css: "'Trebuchet MS', sans-serif" },
};

export const DISAPPEAR_OPTIONS: [string, number][] = [["Off", 0], ["24 hours", 86400], ["7 days", 604800]];

const parseSettings = (x: any): ChatSettings => ({
  theme: x?.theme || "default",
  font: x?.font || "default",
  disappear: x?.disappear || 0,
  muted: x?.muted || {},
  general: x?.general || {},
  nicks: x?.nicks || {},
  clearedAt: x?.clearedAt || {},
});

export function watchSettings(me: string, other: string, cb: (s: ChatSettings) => void): Unsubscribe {
  return onSnapshot(doc(db, "chats", chatIdFor(me, other)), (d) => cb(parseSettings(d.data())), () => cb(parseSettings(null)));
}

/** Merge-updates settings (nested maps are merged, so each person only changes their own entry). */
export async function updateSettings(me: string, other: string, patch: Record<string, any>) {
  await setDoc(doc(db, "chats", chatIdFor(me, other)), { participants: [me, other], ...patch }, { merge: true });
}

/** Move a chat between General and Primary for me. Throws on failure. */
export async function moveChat(me: string, other: string, toGeneral: boolean) {
  const ref = doc(db, "chats", chatIdFor(me, other));
  try {
    await updateDoc(ref, { [`general.${me}`]: toGeneral });
  } catch {
    await setDoc(ref, { participants: [me, other], general: { [me]: toGeneral } }, { merge: true });
  }
}

export type Message = { id: string; from: string; text: string; createdAt: number; expiresAt?: number };

export const chatIdFor = (a: string, b: string) => [a, b].sort().join("_");

const millis = (t: any) => (t?.toMillis ? t.toMillis() : typeof t === "number" ? t : Date.now());

export type MessagesFrom = "everyone" | "following" | "nobody";

/** Throws a readable error if `other` does not accept messages from `me`. */
export async function assertCanMessage(me: string, other: string) {
  const snap = await getDoc(doc(db, "users", other));
  const setting: MessagesFrom = (snap.exists() && (snap.data() as any).messagesFrom) || "everyone";
  if (setting === "nobody") throw new Error("This person does not accept messages.");
  if (setting === "following" && !(await isFollowing(other, me))) {
    throw new Error("This person only accepts messages from people they follow.");
  }
}

export async function sendMessage(me: string, other: string, text: string) {
  const clean = text.trim();
  if (!clean) return;
  await assertCanMessage(me, other);
  const id = chatIdFor(me, other);
  const existing: any = (await getDoc(doc(db, "chats", id)).catch(() => null))?.data?.() || {};
  const disappear: number = existing.disappear || 0;
  await setDoc(
    doc(db, "chats", id),
    {
      participants: [me, other],
      lastMessage: clean.slice(0, 200),
      lastSender: me,
      lastAt: serverTimestamp(),
      sentBy: { [me]: true },
      lastRead: { [me]: Date.now() },
    },
    { merge: true }
  );
  await addDoc(collection(db, "chats", id, "messages"), {
    from: me,
    text: clean.slice(0, 2000),
    createdAt: serverTimestamp(),
    ...(disappear ? { expiresAt: Date.now() + disappear * 1000 } : {}),
  });
  // alert the other person (shows in their notifications and as a phone alert while the app is running)
  notify(other, me, "message", { text: clean.slice(0, 80) });
}

export function watchInbox(me: string, cb: (chats: ChatSummary[]) => void, onError?: (e: any) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "chats"), where("participants", "array-contains", me)),
    (snap) => {
      const list = snap.docs.map((d) => {
        const x: any = d.data();
        return {
          id: d.id,
          participants: x.participants || [],
          lastMessage: x.lastMessage || "",
          lastAt: millis(x.lastAt),
          lastSender: x.lastSender || "",
          lastRead: x.lastRead || {},
          sentBy: x.sentBy || {},
          general: x.general || {},
          muted: x.muted || {},
        } as ChatSummary;
      });
      cb(list.sort((a, b) => b.lastAt - a.lastAt));
    },
    onError
  );
}

export function watchMessages(me: string, other: string, cb: (m: Message[]) => void, onError?: (e: any) => void): Unsubscribe {
  const id = chatIdFor(me, other);
  return onSnapshot(
    query(collection(db, "chats", id, "messages"), orderBy("createdAt", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any), createdAt: millis((d.data() as any).createdAt) }))),
    onError
  );
}

/** Marks the chat as read by `me` (drives the blue dot and the "Seen" label). */
export async function markRead(me: string, other: string) {
  await setDoc(doc(db, "chats", chatIdFor(me, other)), { lastRead: { [me]: Date.now() } }, { merge: true }).catch(() => {});
}

export function watchChat(me: string, other: string, cb: (c: { lastRead: Record<string, number> }) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "chats", chatIdFor(me, other)),
    (d) => cb({ lastRead: ((d.data() as any)?.lastRead as Record<string, number>) || {} }),
    () => {}
  );
}

export const REEL_RE = /\/reels\?reel=([A-Za-z0-9]+)/;
export function parseReelMessage(text: string): { id: string; by: string; caption: string } | null {
  const m = REEL_RE.exec(text);
  if (!m) return null;
  const head = /^🎬 Reel by ([^:\n]*)(?::\s*([^\n]*))?/.exec(text);
  return { id: m[1], by: head?.[1]?.trim() || "", caption: head?.[2]?.trim() || "" };
}

/** Short label for the inbox row. */
export function previewOf(text: string): string {
  const r = parseReelMessage(text);
  if (r) return r.by ? `Sent a reel by ${r.by}` : "Sent a reel";
  return text;
}

/** Hides messages that expired or were cleared by `me`. */
export function visibleMessages(list: Message[], me: string, st: ChatSettings): Message[] {
  const now = Date.now();
  const cleared = st.clearedAt[me] || 0;
  return list.filter((m) => (!m.expiresAt || m.expiresAt > now) && m.createdAt > cleared);
}

export function timeAgo(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / (7 * 86400))}w`;
}
