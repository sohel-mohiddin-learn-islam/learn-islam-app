import { addDoc, collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { autoThumbnailUrl } from "./posts";
import type { Story } from "./stories";

export type HighlightItem = { mediaUrl: string; type: "image" | "video"; caption?: string };
export type Highlight = { id: string; title: string; cover: string; items: HighlightItem[]; createdAt: number };

export const coverOf = (it: HighlightItem) => (it.type === "image" ? it.mediaUrl : autoThumbnailUrl(it.mediaUrl) || "");

export async function getHighlights(owner: string): Promise<Highlight[]> {
  try {
    const snap = await getDocs(collection(db, "users", owner, "highlights"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Highlight)).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return []; // private account the viewer does not follow
  }
}

export async function createHighlight(owner: string, title: string, stories: Story[]) {
  const items: HighlightItem[] = stories.map((s) => ({ mediaUrl: s.mediaUrl, type: s.type, caption: s.caption || "" }));
  await addDoc(collection(db, "users", owner, "highlights"), {
    title: title.trim() || "Highlights",
    cover: coverOf(items[0]),
    items,
    createdAt: Date.now(),
  });
}

export const deleteHighlight = (owner: string, id: string) => deleteDoc(doc(db, "users", owner, "highlights", id));
