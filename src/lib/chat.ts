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
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import { isFollowing } from "./social";

export type ChatSummary = {
  id: string;
  participants: string[];
  lastMessage: string;
  lastAt: number;
  lastSender: string;
};

export type Message = { id: string; from: string; text: string; createdAt: number };

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
  await setDoc(
    doc(db, "chats", id),
    {
      participants: [me, other],
      lastMessage: clean.slice(0, 200),
      lastSender: me,
      lastAt: serverTimestamp(),
    },
    { merge: true }
  );
  await addDoc(collection(db, "chats", id, "messages"), {
    from: me,
    text: clean.slice(0, 2000),
    createdAt: serverTimestamp(),
  });
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
