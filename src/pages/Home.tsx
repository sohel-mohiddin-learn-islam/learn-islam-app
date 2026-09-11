import { useState, useEffect } from "react";
import { BookOpen, BookText, Heart, Scroll, Hand, Star, Users, Calendar, Compass, Hash, MessageCircle, Flame, Info } from "lucide-react";
import { Link } from "wouter";
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import { LocalNotifications } from '@capacitor/local-notifications';

const features = [
  { href: "/prophets", icon: BookOpen, label: "Prophet Stories", color: "bg-emerald-800" },
  { href: "/surahs", icon: BookText, label: "Qur'an", color: "bg-emerald-700" },
  { href: "/hadiths", icon: Scroll, label: "Hadith", color: "bg-emerald-800" },
  { href: "/duas", icon: Hand, label: "Duas", color: "bg-emerald-700" },
  { href: "/qibla", icon: Compass, label: "Qibla", color: "bg-emerald-800" },
  { href: "/tasbih", icon: Hash, label: "Tasbih", color: "bg-emerald-700" },
  { href: "/calendar", icon: Calendar, label: "Calendar", color: "bg-emerald-800" },
  { href: "/asmaul-husna", icon: Star, label: "99 Names", color: "bg-emerald-700" },
  { href: "/karbala", icon: Flame, label: "Karbala", color: "bg-emerald-800" },
  { href: "/sahabah", icon: Users, label: "Sahabah", color: "bg-emerald-700" },
  { href: "/kids", icon: Heart, label: "Kids Zone", color: "bg-emerald-800" },
  { href: "/about", icon: Info, label: "About", color: "bg-emerald-700" },
];

const hijriMonths = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"];

function getHijriDate() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let jd = Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
    Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4) +
    day - 32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  return { day: hDay, month: hijriMonths[hMonth - 1], year: hYear };
}

function calcPrayerTimes(lat: number, lng: number, date: Date, offsets: number[] = [0, 0, 0, 0, 0]) {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const formatTime = (d: Date, offsetMinutes: number) => {
    const adjusted = new Date(d.getTime() + offsetMinutes * 60000);
    let hours = adjusted.getHours();
    const minutes = adjusted.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  return {
    display: [
      formatTime(prayerTimes.fajr, offsets[0]),
      formatTime(prayerTimes.dhuhr, offsets[1]),
      formatTime(prayerTimes.asr, offsets[2]),
      formatTime(prayerTimes.maghrib, offsets[3]),
      formatTime(prayerTimes.isha, offsets[4]),
    ],
    raw: [
      new Date(prayerTimes.fajr.getTime() + offsets[0] * 60000),
      new Date(prayerTimes.dhuhr.getTime() + offsets[1] * 60000),
      new Date(prayerTimes.asr.getTime() + offsets[2] * 60000),
      new Date(prayerTimes.maghrib.getTime() + offsets[3] * 60000),
      new Date(prayerTimes.isha.getTime() + offsets[4] * 60000),
    ],
  };
}

async function scheduleNativeNotifications(rawTimes: Date[], prayerNames: string[]) {
  try {
    await LocalNotifications.cancel({ notifications: [1, 2, 3, 4, 5].map(id => ({ id })) });

    await LocalNotifications.createChannel({
      id: 'prayer-azan-v3',
      name: 'Prayer Notifications',
      sound: 'azan',
      importance: 5,
      visibility: 1,
    });

    const notifications = rawTimes
      .map((time, i) => {
        const reminderTime = new Date(time.getTime() - 5 * 60000);
        if (reminderTime.getTime() <= Date.now()) return null;
        return {
          id: i + 1,
          title: 'Prayer Reminder',
          body: `${prayerNames[i]} prayer in 5 minutes!`,
          schedule: { at: reminderTime },
          smallIcon: 'ic_stat_icon',
          channelId: 'prayer-azan-v3',
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    // Scheduling failed silently — permission may not be granted
  }
}

export default function HomePage() {
  const [currentPrayer, setCurrentPrayer] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState(['5:00 AM', '12:30 PM', '3:45 PM', '6:30 PM', '8:00 PM']);
  const [rawPrayerTimes, setRawPrayerTimes] = useState<Date[]>([]);
  const [notifPermission, setNotifPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<number | null>(null);

  const [offsets, setOffsets] = useState<number[]>(() => {
    const saved = localStorage.getItem('prayerTimeOffsets');
    return saved ? JSON.parse(saved) : [0, 0, 0, 0, 0];
  });

  const adjustOffset = (delta: number) => {
    if (selectedPrayer === null) return;
    const newOffsets = [...offsets];
    newOffsets[selectedPrayer] += delta;
    setOffsets(newOffsets);
    localStorage.setItem('prayerTimeOffsets', JSON.stringify(newOffsets));
  };

  const hijri = getHijriDate();
  const today = new Date();
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  useEffect(() => {
    LocalNotifications.checkPermissions().then(res => {
      if (res.display === 'granted') setNotifPermission('granted');
      else if (res.display === 'denied') setNotifPermission('denied');
    }).catch(() => {});

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const { display, raw } = calcPrayerTimes(pos.coords.latitude, pos.coords.longitude, new Date(), offsets);
        setPrayerTimes(display);
        setRawPrayerTimes(raw);

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        display.forEach((t, i) => {
          const [timePart, ampm] = t.split(' ');
          const [h, m] = timePart.split(':').map(Number);
          let hours = h;
          if (ampm === 'PM' && h !== 12) hours += 12;
          if (ampm === 'AM' && h === 12) hours = 0;
          if (hours * 60 + m <= nowMin) setCurrentPrayer(i);
        });
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    const { display, raw } = calcPrayerTimes(coords.lat, coords.lng, new Date(), offsets);
    setPrayerTimes(display);
    setRawPrayerTimes(raw);

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    display.forEach((t, i) => {
      const [timePart, ampm] = t.split(' ');
      const [h, m] = timePart.split(':').map(Number);
      let hours = h;
      if (ampm === 'PM' && h !== 12) hours += 12;
      if (ampm === 'AM' && h === 12) hours = 0;
      if (hours * 60 + m <= nowMin) setCurrentPrayer(i);
    });

    if (notifPermission === 'granted' && raw.length > 0) {
      scheduleNativeNotifications(raw, prayers);
    }
  }, [offsets, coords]);

  const requestNotifications = async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      if (result.display === 'granted') {
        setNotifPermission('granted');
        if (rawPrayerTimes.length > 0) {
          scheduleNativeNotifications(rawPrayerTimes, prayers);
        }
      } else {
        setNotifPermission('denied');
      }
    } catch {
      setNotifPermission('denied');
    }
  };

  return (
    <div className="min-h-full bg-background pb-20">
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 px-5 pt-8 pb-6 rounded-b-3xl shadow-lg">
        <p className="text-yellow-300 font-serif text-sm mb-1">Assalamu Alaikum</p>
        <h1 className="text-white font-serif text-2xl font-bold mb-1">Learn Islam</h1>
        <p className="text-emerald-200 text-sm">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {hijri.day} {hijri.month} {hijri.year} AH
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {prayers.map((p, i) => (
            <button
              key={p}
              onClick={() => setSelectedPrayer(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-center border-2 transition-colors ${
                i === currentPrayer ? 'bg-yellow-400 text-emerald-900' : 'bg-white/10 text-white'
              } ${selectedPrayer === i ? 'border-yellow-300' : 'border-transparent'}`}
            >
              <p className="text-xs font-medium">{p}</p>
              <p className="text-sm font-bold">{prayerTimes[i]}</p>
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-yellow-300">
          {selectedPrayer === null ? (
            <span>Tap a prayer above to adjust its time</span>
          ) : (
            <>
              <span>Adjust {prayers[selectedPrayer]}:</span>
              <button onClick={() => adjustOffset(-1)} className="px-2 py-0.5 border border-yellow-400/30 rounded">-1 min</button>
              <span>{offsets[selectedPrayer] > 0 ? `+${offsets[selectedPrayer]}` : offsets[selectedPrayer]} min</span>
              <button onClick={() => adjustOffset(1)} className="px-2 py-0.5 border border-yellow-400/30 rounded">+1 min</button>
            </>
          )}
        </div>

        {notifPermission === 'idle' && (
          <button onClick={requestNotifications}
            className="mt-3 w-full text-xs text-yellow-300 border border-yellow-400/30 rounded-lg py-1.5 hover:bg-yellow-400/10 transition-colors">
            Enable Prayer Notifications
          </button>
        )}
        {notifPermission === 'granted' && (
          <p className="mt-2 text-xs text-green-300 text-center">Prayer notifications enabled!</p>
        )}
        {notifPermission === 'denied' && (
          <p className="mt-2 text-xs text-red-300 text-center">Notifications blocked — enable them in your device's app settings.</p>
        )}
      </div>

      <div className="px-4 py-5">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-4 mb-5 border border-yellow-400/30 shadow-md">
          <p className="text-yellow-300 font-serif text-xs mb-2">Verse of the Day</p>
          <p className="text-white text-base font-serif leading-relaxed" dir="rtl">إن مع العسر يسرا</p>
          <p className="text-emerald-200 text-sm mt-2 italic">"Indeed, with hardship comes ease." — Quran 94:6</p>
        </div>

        <h2 className="text-foreground font-serif font-bold text-lg mb-3">Features</h2>
        <div className="grid grid-cols-4 gap-3">
          {features.map((f) => (
            <Link key={f.href} href={f.href}>
              <div className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center shadow-md border border-yellow-400/20`}>
                  <f.icon className="w-6 h-6 text-yellow-300" />
                </div>
                <span className="text-xs text-center text-muted-foreground font-medium leading-tight">{f.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 bg-card border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-primary font-serif text-xs mb-1">Hadith of the Day</p>
          <p className="text-foreground font-serif text-sm leading-relaxed">
            "The best of you are those who learn the Quran and teach it."
          </p>
          <p className="text-muted-foreground text-xs mt-1">Prophet Muhammad (Bukhari)</p>
        </div>
      </div>
    </div>
  );
      }
