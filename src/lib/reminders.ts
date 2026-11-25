import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getVerseForDate } from "@/lib/daily";

const CHANNEL = "li-reminders";
const JUMUAH_ID = 101;
const SUHOOR_ID = 111;
const IFTAR_ID = 112;

async function ready(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const p = await LocalNotifications.checkPermissions();
    if (p.display !== "granted") return false;
    await LocalNotifications.createChannel({ id: CHANNEL, name: "Reminders", importance: 4, visibility: 1 });
    return true;
  } catch {
    return false;
  }
}

/** Every Friday at 11:00. */
export async function setJumuahReminder(on: boolean) {
  if (!(await ready())) return;
  await LocalNotifications.cancel({ notifications: [{ id: JUMUAH_ID }] }).catch(() => {});
  if (!on) return;
  await LocalNotifications.schedule({
    notifications: [{
      id: JUMUAH_ID,
      title: "Jumu'ah Mubarak 🕌",
      body: "It's Friday: take ghusl, read Surah Al-Kahf and send salawat on the Prophet ﷺ.",
      schedule: { on: { weekday: 6, hour: 11, minute: 0 }, allowWhileIdle: true },
      smallIcon: "ic_stat_icon",
      channelId: CHANNEL,
    }],
  }).catch(() => {});
}

/** Suhoor reminder 40 minutes before Fajr and an Iftar notification at Maghrib (next occurrence of each). */
export async function setRamadanReminders(on: boolean, fajr?: Date, maghrib?: Date) {
  if (!(await ready())) return;
  await LocalNotifications.cancel({ notifications: [{ id: SUHOOR_ID }, { id: IFTAR_ID }] }).catch(() => {});
  if (!on || !fajr || !maghrib) return;
  const list: any[] = [];
  const suhoor = new Date(fajr.getTime() - 40 * 60000);
  if (suhoor.getTime() > Date.now())
    list.push({ id: SUHOOR_ID, title: "Suhoor time 🌙", body: "Fajr is in 40 minutes. Eat suhoor and make your intention.", schedule: { at: suhoor, allowWhileIdle: true }, smallIcon: "ic_stat_icon", channelId: CHANNEL });
  if (maghrib.getTime() > Date.now())
    list.push({ id: IFTAR_ID, title: "Iftar time 🍽️", body: "It's time to break your fast. Bismillah, and don't forget the dua.", schedule: { at: maghrib, allowWhileIdle: true }, smallIcon: "ic_stat_icon", channelId: CHANNEL });
  if (list.length) await LocalNotifications.schedule({ notifications: list }).catch(() => {});
}

const AYAH_BASE = 200; // ids 201..207

/** A different Qur'an verse each morning for the next 7 days (re-planned every time the app opens). */
export async function setAyahReminders(on: boolean, hour = 7) {
  if (!(await ready())) return;
  await LocalNotifications.cancel({ notifications: Array.from({ length: 7 }, (_, i) => ({ id: AYAH_BASE + 1 + i })) }).catch(() => {});
  if (!on) return;
  const list: any[] = [];
  for (let i = 0; i < 7; i++) {
    const at = new Date();
    at.setDate(at.getDate() + i);
    at.setHours(hour, 0, 0, 0);
    if (at.getTime() <= Date.now()) continue;
    const v = await getVerseForDate(at);
    if (!v) continue;
    const eng = v.english.length > 170 ? v.english.slice(0, 167) + "…" : v.english;
    list.push({ id: AYAH_BASE + 1 + i, title: `Verse of the day · ${v.ref}`, body: eng, largeBody: `${v.arabic}\n\n${v.english}`, schedule: { at, allowWhileIdle: true }, smallIcon: "ic_stat_icon", channelId: CHANNEL });
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list }).catch(() => {});
}
