import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type GameId = "football" | "archery" | "horse" | "hockey" | "cricket" | "swimming";
export const GAME_IDS: GameId[] = ["football", "archery", "horse", "hockey", "cricket", "swimming"];
export const GAME_LABEL: Record<GameId, string> = { football: "⚽ Football", archery: "🏹 Archery", horse: "🐎 Horse", hockey: "🏑 Hockey", cricket: "🏏 Cricket", swimming: "🏊 Swimming" };
export const GAME_UNIT: Record<GameId, string> = { football: "goals", archery: "pts", horse: "pts", hockey: "goals", cricket: "runs", swimming: "pts" };

export type Stats = { best: Partial<Record<GameId, number>>; plays: Partial<Record<GameId, number>>; total: number };
export type Entry = Stats & { uid: string; name: string; photo: string | null };

export type Badge = { id: string; icon: string; name: string; desc: string; test: (s: Stats) => boolean };
const totalPlays = (s: Stats) => Object.values(s.plays).reduce((a, b) => a + (b || 0), 0);
export const BADGES: Badge[] = [
  { id: "rookie", icon: "🌱", name: "Rookie", desc: "Finish any game", test: (s) => totalPlays(s) >= 1 },
  { id: "allround", icon: "🎖️", name: "All-rounder", desc: "Play all six games", test: (s) => GAME_IDS.every((g) => (s.plays[g] || 0) >= 1) },
  { id: "striker", icon: "⚽", name: "Striker", desc: "Score 3 goals in football", test: (s) => (s.best.football || 0) >= 3 },
  { id: "stick", icon: "🏑", name: "Hockey hero", desc: "Score 3 goals in hockey", test: (s) => (s.best.hockey || 0) >= 3 },
  { id: "bat", icon: "🏏", name: "Run machine", desc: "Score 20 runs in cricket", test: (s) => (s.best.cricket || 0) >= 20 },
  { id: "eagle", icon: "🏹", name: "Eagle eye", desc: "Score 70+ in archery", test: (s) => (s.best.archery || 0) >= 70 },
  { id: "rider", icon: "🐎", name: "Fearless rider", desc: "Score 150+ on the horse", test: (s) => (s.best.horse || 0) >= 150 },
  { id: "fish", icon: "🏊", name: "Fast fish", desc: "Score 60+ in swimming", test: (s) => (s.best.swimming || 0) >= 60 },
  { id: "dedicated", icon: "🔥", name: "Dedicated", desc: "Play 25 games", test: (s) => totalPlays(s) >= 25 },
  { id: "champion", icon: "🏆", name: "Champion", desc: "Reach 300 total points", test: (s) => s.total >= 300 },
];

const emptyStats = (): Stats => ({ best: {}, plays: {}, total: 0 });
export async function getStats(uid: string): Promise<Stats> {
  const d = await getDoc(doc(db, "gameScores", uid));
  const x: any = d.exists() ? d.data() : {};
  return { best: x.best || {}, plays: x.plays || {}, total: x.total || 0 };
}

/** Saves a finished game. Returns whether it was a personal best, and the badges earned for the first time. */
export async function submitScore(uid: string, name: string, photo: string | null, game: GameId, score: number) {
  const before = await getStats(uid).catch(() => emptyStats());
  const best = { ...before.best }, plays = { ...before.plays };
  const wasBest = score > (best[game] || 0);
  if (wasBest) best[game] = score;
  plays[game] = (plays[game] || 0) + 1;
  const total = Object.values(best).reduce((a, b) => a + (b || 0), 0);
  const after: Stats = { best, plays, total };
  const earned = BADGES.filter((b) => !b.test(before) && b.test(after));
  await setDoc(doc(db, "gameScores", uid), { uid, name, photo, best, plays, total, updatedAt: Date.now() }, { merge: true });
  return { wasBest, earned, best: best[game] || score };
}

export async function getLeaderboard(game: GameId | "total", n = 20): Promise<Entry[]> {
  const field = game === "total" ? "total" : `best.${game}`;
  const snap = await getDocs(query(collection(db, "gameScores"), orderBy(field, "desc"), limit(n)));
  return snap.docs
    .map((d) => { const x: any = d.data(); return { uid: d.id, name: x.name || "Player", photo: x.photo || null, best: x.best || {}, plays: x.plays || {}, total: x.total || 0 } as Entry; })
    .filter((e) => (game === "total" ? e.total : e.best[game]) > 0);
}
