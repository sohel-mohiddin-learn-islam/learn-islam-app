// Verse and hadith of the day come from public Qur'an / hadith data services, so the text is never written by the app.
export type DailyVerse = { arabic: string; english: string; ref: string };
export type DailyHadith = { text: string; ref: string };

const dayNumber = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
const todayKey = () => new Date().toISOString().slice(0, 10);

function cached<T>(key: string): T | null {
  try {
    const c = JSON.parse(localStorage.getItem(key) || "null");
    return c && c.day === todayKey() ? (c.value as T) : null;
  } catch {
    return null;
  }
}
function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify({ day: todayKey(), value })); } catch { /* ignore */ }
}

export async function getDailyVerse(): Promise<DailyVerse | null> {
  const hit = cached<DailyVerse>("li-daily-verse");
  if (hit) return hit;
  try {
    // 6236 verses in the Qur'an: a different one each day of the year, cycling through the whole book
    const n = ((dayNumber() * 17 + new Date().getFullYear() * 7) % 6236) + 1;
    const r = await fetch(`https://api.alquran.cloud/v1/ayah/${n}/editions/quran-uthmani,en.sahih`);
    const j = await r.json();
    const [ar, en] = j.data;
    const value: DailyVerse = {
      arabic: ar.text,
      english: en.text,
      ref: `${ar.surah.englishName} (${ar.surah.number}:${ar.numberInSurah})`,
    };
    store("li-daily-verse", value);
    return value;
  } catch {
    return null;
  }
}

export async function getDailyHadith(): Promise<DailyHadith | null> {
  const hit = cached<DailyHadith>("li-daily-hadith");
  if (hit) return hit;
  try {
    // Imam Nawawi's Forty Hadith: short and well known
    const n = (dayNumber() % 40) + 1;
    const r = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-nawawi/${n}.json`);
    const j = await r.json();
    const h = j.hadiths?.[0] || j;
    if (!h?.text) return null;
    const value: DailyHadith = { text: String(h.text).replace(/\s+/g, " ").trim(), ref: `Imam Nawawi's Forty Hadith, no. ${h.hadithnumber ?? n}` };
    store("li-daily-hadith", value);
    return value;
  } catch {
    return null;
  }
}
