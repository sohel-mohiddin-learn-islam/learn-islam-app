import { useEffect, useState } from "react";

export type Prefs = {
  textScale: number; // 1 = normal
  dataSaver: boolean;
  dailyLimit: number; // minutes, 0 = off
  saved: string[]; // saved reel ids
  hiddenWords: string[];
  notInterested: string[]; // reel ids
  jumuah: boolean; // Friday reminder
  ramadan: boolean; // Suhoor / Iftar mode
};

const KEY = "li-prefs";
const DEFAULTS: Prefs = { textScale: 1, dataSaver: false, dailyLimit: 0, saved: [], hiddenWords: [], notInterested: [], jumuah: true, ramadan: false };

export function getPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...getPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  applyPrefs(next);
  window.dispatchEvent(new Event("li-prefs"));
}

export function applyPrefs(p: Prefs = getPrefs()) {
  document.documentElement.style.fontSize = `${Math.round(16 * p.textScale)}px`;
}

export function usePrefs(): Prefs {
  const [p, setP] = useState(getPrefs);
  useEffect(() => {
    const on = () => setP(getPrefs());
    window.addEventListener("li-prefs", on);
    return () => window.removeEventListener("li-prefs", on);
  }, []);
  return p;
}

export function toggleSaved(id: string): boolean {
  const p = getPrefs();
  const has = p.saved.includes(id);
  setPrefs({ saved: has ? p.saved.filter((x) => x !== id) : [...p.saved, id] });
  return !has;
}

// ---- time spent in the app (per day, this device only) ----
const dayKey = () => `li-usage-${new Date().toISOString().slice(0, 10)}`;

export function addUsage(seconds: number) {
  try {
    localStorage.setItem(dayKey(), String(todayUsage() + seconds));
  } catch {
    /* ignore */
  }
}

export function todayUsage(): number {
  try {
    return Number(localStorage.getItem(dayKey()) || 0);
  } catch {
    return 0;
  }
}

export function likedReelIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("reel-like-") && localStorage.getItem(k) === "1") ids.push(k.slice("reel-like-".length));
    }
  } catch {
    /* ignore */
  }
  return ids;
}

/** True when the text contains one of the words the user chose to hide. */
export function containsHiddenWord(text: string): boolean {
  const words = getPrefs().hiddenWords;
  if (!words.length) return false;
  const t = text.toLowerCase();
  return words.some((w) => w && t.includes(w.toLowerCase()));
}
