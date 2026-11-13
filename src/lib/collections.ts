import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getPrefs, setPrefs } from "./prefs";

/** Instagram-style saved posts: users/{uid}/saved/{postId} {at, collections[]} and users/{uid}/collections/{id} {name, at}. */
export type Collection = { id: string; name: string; at: number };
export type SavedEntry = { postId: string; at: number; collections: string[] };

export async function listCollections(uid: string): Promise<Collection[]> {
  const s = await getDocs(collection(db, "users", uid, "collections"));
  return s.docs.map((d) => ({ id: d.id, name: (d.data() as any).name || "Collection", at: (d.data() as any).at || 0 })).sort((a, b) => b.at - a.at);
}

export async function listSaved(uid: string): Promise<SavedEntry[]> {
  const s = await getDocs(collection(db, "users", uid, "saved"));
  const out = s.docs.map((d) => ({ postId: d.id, at: (d.data() as any).at || 0, collections: ((d.data() as any).collections as string[]) || [] }));
  // reels saved before collections existed live only on this phone: copy them over once
  const have = new Set(out.map((x) => x.postId));
  const old = getPrefs().saved.filter((id) => !have.has(id));
  await Promise.all(old.map((id) => setDoc(doc(db, "users", uid, "saved", id), { at: Date.now(), collections: [] }).catch(() => {})));
  old.forEach((id) => out.push({ postId: id, at: 0, collections: [] }));
  return out.sort((a, b) => b.at - a.at);
}

export async function savePostCloud(uid: string, postId: string, collections: string[] = []) {
  await setDoc(doc(db, "users", uid, "saved", postId), { at: Date.now(), collections }, { merge: true });
  const p = getPrefs();
  if (!p.saved.includes(postId)) setPrefs({ saved: [...p.saved, postId] });
}

export async function unsavePostCloud(uid: string, postId: string) {
  await deleteDoc(doc(db, "users", uid, "saved", postId)).catch(() => {});
  const p = getPrefs();
  if (p.saved.includes(postId)) setPrefs({ saved: p.saved.filter((x) => x !== postId) });
}

export async function setPostCollections(uid: string, postId: string, collections: string[]) {
  await setDoc(doc(db, "users", uid, "saved", postId), { at: Date.now(), collections }, { merge: true });
  const p = getPrefs();
  if (!p.saved.includes(postId)) setPrefs({ saved: [...p.saved, postId] });
}

export async function createCollection(uid: string, name: string): Promise<Collection> {
  const id = Math.random().toString(36).slice(2, 11);
  const c = { name: name.trim().slice(0, 40) || "Collection", at: Date.now() };
  await setDoc(doc(db, "users", uid, "collections", id), c);
  return { id, ...c };
}

export async function deleteCollection(uid: string, id: string, entries: SavedEntry[]) {
  await deleteDoc(doc(db, "users", uid, "collections", id));
  await Promise.all(entries.filter((e) => e.collections.includes(id)).map((e) => setDoc(doc(db, "users", uid, "saved", e.postId), { collections: e.collections.filter((c) => c !== id) }, { merge: true })));
}
