import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BookOpen, BookText, Heart, Scroll, Hand, Star, Users, Calendar, Compass, Hash, MessageCircle, Flame, Info } from "lucide-react";

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

const hijriMonths = ["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Ula","Jumada al-Thani","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qadah","Dhu al-Hijjah"];

function getHijriDate() {
  const now = new Date();
  const jd = Math.floor((now.getTime() / 86400000) + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const j = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719) + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const lll = ll - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * lll) / 709);
  const day = lll - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month: hijriMonths[month - 1], year };
}

function calcPrayerTimes(lat: number, lng: number, date: Date) {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const julianDate = Math.floor(date.getTime() / 86400000) + 2440587.5;
  const d = julianDate - 2451545.0;
  const g = 357.529 + 0.98560028 * d;
  const q = 280.459 + 0.98564736 * d;
  const L = q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g));
  const e = 23.439 - 0.00000036 * d;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const SD = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  const EqT = q / 15 - RA;
  const Tnoon = 12 - lng / 15 - EqT;
  
  const getAngleTime = (angle: number, before: boolean) => {
    const cosH = (Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(SD))) / (Math.cos(toRad(lat)) * Math.cos(toRad(SD)));
    if (Math.abs(cosH) > 1) return null;
    const H = toDeg(Math.acos(cosH)) / 15;
    return before ? Tnoon - H : Tnoon + H;
  };

  const shadow = (factor: number) => {
    const angle = toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - SD))))));
    return getAngleTime(-angle, false);
  };

  const toTime = (h: number | null) => {
    if (!h) return '12:00 PM';
    const offset = date.getTimezoneOffset() / -60;
    let total = h + offset;
    if (total < 0) total += 24;
    if (total >= 24) total -= 24;
    const hours = Math.floor(total);
    const mins = Math.round((total - hours) * 60);
    const h12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${h12}:${mins.toString().padStart(2,'0')} ${ampm}`;
  };

  return [
    toTime(getAngleTime(-18, true)),   // Fajr
    toTime(Tnoon),                      // Dhuhr
    toTime(shadow(1)),                  // Asr
    toTime(getAngleTime(-0.833, false)),// Maghrib
    toTime(getAngleTime(-17, false)),   // Isha
  ];
}

function scheduleNotifications(prayerTimes: string[], prayerNames: string[]) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  prayerTimes.forEach((time, i) => {
    const [timePart, ampm] = time.split(' ');
    const [h, m] = timePart.split(':').map(Number);
    let hours = h;
    if (ampm === 'PM' && h !== 12) hours += 12;
    if (ampm === 'AM' && h === 12) hours = 0;

    const now = new Date();
    const prayerDate = new Date();
    prayerDate.setHours(hours, m - 5, 0, 0);

    const diff = prayerDate.getTime() - now.getTime();
    if (diff > 0) {
      setTimeout(() => {
        new Notification('🕌 Prayer Reminder', {
          body: `${prayerNames[i]} prayer in 5 minutes!`,
          icon: '/icon-512.png',
          badge: '/icon-512.png',
        });
      }, diff);
    }
  });
}

export default function HomePage() {
  const [currentPrayer, setCurrentPrayer] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState(['5:00 AM','12:30 PM','3:45 PM','6:30 PM','8:00 PM']);
  const [notifPermission, setNotifPermission] = useState('idle');
  const hijri = getHijriDate();
  const today = new Date();
  const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const times = calcPrayerTimes(pos.coords.latitude, pos.coords.longitude, new Date());
        setPrayerTimes(times);
        
        // Find current prayer
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        times.forEach((t, i) => {
          const [timePart, ampm] = t.split(' ');
          const [h, m] = timePart.split(':').map(Number);
          let hours = h;
          if (ampm === 'PM' && h !== 12) hours += 12;
          if (ampm === 'AM' && h === 12) hours = 0;
          if (hours * 60 + m <= nowMin) setCurrentPrayer(i);
        });

        if (Notification.permission === 'granted') {
          scheduleNotifications(times, prayers);
        }
      },
      () => {}
    );
  }, []);

  const requestNotifications = async () => {
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      scheduleNotifications(prayerTimes, prayers);
    }
  };

  return (
    <div className="min-h-full bg-background pb-20">
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 px-5 pt-8 pb-6 rounded-b-3xl shadow-lg">
        <p className="text-yellow-300 font-serif text-sm mb-1">🕌 Assalamu Alaikum</p>
        <h1 className="text-white font-serif text-2xl font-bold mb-1">Learn Islam</h1>
        <p className="text-emerald-200 text-sm">
          {today.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'})} •{' '}
          {hijri.day} {hijri.month} {hijri.year} AH
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {prayers.map((p, i) => (
            <div key={p} className={`flex-shrink-0 px-3 py-2 rounded-xl text-center ${i === currentPrayer ? 'bg-yellow-400 text-emerald-900' : 'bg-emerald-700/50 text-white'}`}>
              <p className="text-xs font-medium">{p}</p>
              <p className="text-sm font-bold">{prayerTimes[i]}</p>
            </div>
          ))}
        </div>

        {notifPermission === 'idle' && (
          <button onClick={requestNotifications}
            className="mt-3 w-full text-xs text-yellow-300 border border-yellow-400/30 rounded-lg py-1.5 hover:bg-yellow-400/10 transition-colors">
            🔔 Enable Prayer Notifications
          </button>
        )}
        {notifPermission === 'granted' && (
          <p className="mt-2 text-xs text-green-300 text-center">✅ Prayer notifications enabled!</p>
        )}
      </div>

      <div className="px-4 py-5">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-4 mb-5 border border-yellow-400/30 shadow-lg">
          <p className="text-yellow-300 text-xs font-serif mb-2">✨ Verse of the Day</p>
          <p className="text-white text-base font-serif leading-relaxed" dir="rtl">إِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
          <p className="text-emerald-200 text-sm mt-2 italic">"Indeed, with hardship comes ease." — Quran 94:6</p>
        </div>

        <h2 className="text-foreground font-serif font-bold text-lg mb-3">Features</h2>
        <div className="grid grid-cols-4 gap-3">
          {features.map((f) => (
            <Link key={f.href} href={f.href}>
              <div className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center shadow-md border border-yellow-400/20 group-active:scale-95 transition-transform`}>
                  <f.icon className="w-6 h-6 text-yellow-300" />
                </div>
                <span className="text-xs text-center text-muted-foreground font-medium leading-tight">{f.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 bg-card border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-primary font-serif text-xs mb-1">💫 Hadith of the Day</p>
          <p className="text-foreground font-serif text-sm leading-relaxed">
            "The best of you are those who learn the Quran and teach it."
          </p>
          <p className="text-muted-foreground text-xs mt-1">— Prophet Muhammad ﷺ (Bukhari)</p>
        </div>
      </div>
    </div>
  );
}