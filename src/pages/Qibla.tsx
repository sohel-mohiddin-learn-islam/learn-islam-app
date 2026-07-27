import { useState, useEffect } from "react";
import { Compass } from "lucide-react";

export default function Qibla() {
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [location, setLocation] = useState<{lat:number,lng:number}|null>(null);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState('idle');

  const MAKKAH = { lat: 21.4225, lng: 39.8262 };

  const calculateQibla = (lat: number, lng: number) => {
    const dLng = (MAKKAH.lng - lng) * (Math.PI / 180);
    const lat1 = lat * (Math.PI / 180);
    const lat2 = MAKKAH.lat * (Math.PI / 180);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return (angle + 360) % 360;
  };

  const getLocation = () => {
    setPermission('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setQiblaAngle(calculateQibla(latitude, longitude));
        setPermission('granted');
      },
      () => {
        setError('Location access denied. Please enable location.');
        setPermission('denied');
      }
    );
  };

  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      const handler = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) setHeading(e.alpha);
      };
      window.addEventListener('deviceorientation', handler);
      return () => window.removeEventListener('deviceorientation', handler);
    }
  }, []);

  const needleAngle = qiblaAngle - heading;

  return (
    <div className="min-h-full bg-background flex flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold font-serif text-primary mb-2">Qibla</h1>
      <p className="text-muted-foreground font-serif mb-8" dir="rtl">اتجاه القبلة</p>

      {/* Compass */}
      <div className="relative w-72 h-72 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 bg-card shadow-xl flex items-center justify-center">
          {/* Compass directions */}
          <span className="absolute top-4 text-primary font-bold font-serif">N</span>
          <span className="absolute bottom-4 text-muted-foreground font-serif">S</span>
          <span className="absolute left-4 text-muted-foreground font-serif">W</span>
          <span className="absolute right-4 text-muted-foreground font-serif">E</span>

          {/* Kaaba icon in center */}
          <div className="w-16 h-16 bg-emerald-900 rounded-xl flex items-center justify-center border-2 border-yellow-400 shadow-lg z-10">
            <span className="text-2xl">🕋</span>
          </div>

          {/* Qibla needle */}
          {permission === 'granted' && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{transform: `rotate(${needleAngle}deg)`, transition: 'transform 0.3s ease'}}>
              <div className="w-1 h-32 bg-gradient-to-t from-transparent via-yellow-400 to-yellow-400 rounded-full"
                style={{transformOrigin: 'bottom center', position: 'absolute', bottom: '50%'}}/>
            </div>
          )}
        </div>
      </div>

      {permission === 'granted' && location && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-center w-full max-w-sm">
          <p className="text-primary font-bold font-serif text-2xl">{Math.round(qiblaAngle)}°</p>
          <p className="text-muted-foreground text-sm">Qibla Direction from your location</p>
          <p className="text-muted-foreground text-xs mt-1">
            {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
          </p>
        </div>
      )}

      {permission === 'idle' && (
        <button onClick={getLocation}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-serif text-lg shadow-lg hover:bg-primary/90 transition-colors">
          📍 Find Qibla Direction
        </button>
      )}

      {permission === 'loading' && (
        <p className="text-muted-foreground font-serif animate-pulse">Getting your location...</p>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
      )}

      <div className="mt-6 bg-card border border-border rounded-2xl p-4 w-full max-w-sm">
        <p className="text-muted-foreground text-sm text-center">
          Point the golden needle toward the Kaaba 🕋 to face Makkah
        </p>
      </div>
    </div>
  );
}