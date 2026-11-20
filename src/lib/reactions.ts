import { deleteField, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Reaction set. To use your own Islamic emoji images, drop PNG/WebP files into public/reactions/
 * and add `img: "name.png"` to an entry (the emoji is then only a fallback).
 */
export type Reaction = { id: string; emoji: string; label: string; img?: string };
export const REACTIONS: Reaction[] = [
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "ameen", emoji: "🤲", label: "Ameen" },
  { id: "subhanallah", emoji: "📿", label: "SubhanAllah" },
  { id: "mashallah", emoji: "✨", label: "MashaAllah" },
  { id: "mubarak", emoji: "🌙", label: "Mubarak" },
  { id: "alhamdulillah", emoji: "🕌", label: "Alhamdulillah" },
  { id: "smile", emoji: "😊", label: "Smile" },
  { id: "sad", emoji: "😢", label: "Sad" },
];
export const reactionById = (id: string | undefined) => REACTIONS.find((r) => r.id === id);

/** path = the Firestore message document path, e.g. ["chats", chatId, "messages", msgId] */
export async function reactToMessage(path: string[], uid: string, id: string | null) {
  const [a, ...rest] = path;
  await updateDoc(doc(db, a, ...rest), { [`reactions.${uid}`]: id === null ? deleteField() : id });
}
