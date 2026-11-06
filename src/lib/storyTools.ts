import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { uploadVideo } from "./posts";

export type Overlay = {
  id: string;
  kind: "text" | "sticker" | "mention";
  text: string;
  style: string; // text style or sticker style key
  color: string;
  x: number; // centre, percent of the story width
  y: number; // centre, percent of the story height
  scale: number;
  uid?: string; // mentions
};

export const TEXT_STYLES = [
  { key: "classic", label: "Classic" },
  { key: "bold", label: "Bold" },
  { key: "typewriter", label: "Typewriter" },
  { key: "neon", label: "Neon" },
  { key: "serif", label: "Serif" },
  { key: "box", label: "Box" },
  { key: "arabic", label: "Arabic" },
] as const;

export const COLORS = ["#ffffff", "#000000", "#facc15", "#34d399", "#38bdf8", "#f472b6", "#f87171", "#a78bfa"];

export type StickerDef = { text: string; style: "arabic" | "pill" | "emoji" | "gold"; sub?: string };

export const STICKERS: StickerDef[] = [
  { text: "بسم الله الرحمن الرحيم", style: "gold", sub: "Bismillah" },
  { text: "سبحان الله", style: "gold", sub: "SubhanAllah" },
  { text: "الحمد لله", style: "gold", sub: "Alhamdulillah" },
  { text: "الله أكبر", style: "gold", sub: "Allahu Akbar" },
  { text: "ما شاء الله", style: "gold", sub: "MashaAllah" },
  { text: "إن شاء الله", style: "gold", sub: "InshaAllah" },
  { text: "جزاك الله خيرا", style: "gold", sub: "JazakAllahu Khairan" },
  { text: "لا إله إلا الله", style: "gold", sub: "La ilaha illallah" },
  { text: "Jumu'ah Mubarak 🕌", style: "pill" },
  { text: "Ramadan Kareem 🌙", style: "pill" },
  { text: "Eid Mubarak ✨", style: "pill" },
  { text: "Assalamu Alaikum", style: "pill" },
  { text: "Allah is with you 🤍", style: "pill" },
  { text: "Make dua for me 🤲", style: "pill" },
  { text: "Alhamdulillah for everything", style: "pill" },
  { text: "🕌", style: "emoji" }, { text: "🕋", style: "emoji" }, { text: "🌙", style: "emoji" }, { text: "☪️", style: "emoji" },
  { text: "⭐", style: "emoji" }, { text: "📿", style: "emoji" }, { text: "📖", style: "emoji" }, { text: "🤲", style: "emoji" },
  { text: "🕯️", style: "emoji" }, { text: "🌴", style: "emoji" }, { text: "🤍", style: "emoji" }, { text: "🌹", style: "emoji" },
];

export async function searchUsers(q: string): Promise<{ uid: string; name: string; photo: string | null }[]> {
  const t = q.trim();
  if (t.length < 1) return [];
  const snap = await getDocs(query(collection(db, "users"), where("displayName", ">=", t), where("displayName", "<=", t + ""), limit(12)));
  return snap.docs.map((d) => {
    const x: any = d.data();
    return { uid: d.id, name: x.displayName || "User", photo: x.photoURL || null };
  });
}

// ---- Naat library (the admin uploads tracks they have the right to share) ----
export type Naat = { id: string; title: string; artist: string; url: string; license: string };

export async function getNaats(): Promise<Naat[]> {
  try {
    const snap = await getDocs(collection(db, "naats"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Naat)).sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}
export const addNaat = (n: Omit<Naat, "id">) => addDoc(collection(db, "naats"), { ...n, createdAt: Date.now() });
export const deleteNaat = (id: string) => deleteDoc(doc(db, "naats", id));

export type PickedAudio = { title: string; url?: string; file?: File };

/** Uploads the user's own audio file when needed and returns what the story document stores. */
export async function prepareAudio(a: PickedAudio | null, uid: string): Promise<{ audioUrl: string; audioTitle: string }> {
  if (!a) return { audioUrl: "", audioTitle: "" };
  const url = a.url || (a.file ? await uploadVideo(a.file, uid) : "");
  return { audioUrl: url, audioTitle: a.title };
}
