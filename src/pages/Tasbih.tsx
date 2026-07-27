import { useState, useEffect } from "react";

export default function Tasbih() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [vibrate, setVibrate] = useState(true);

  const increment = () => {
    setCount(c => {
      const newCount = c + 1;
      if (vibrate && navigator.vibrate) navigator.vibrate(30);
      return newCount;
    });
  };

  const reset = () => {
    setCount(0);
    if (vibrate && navigator.vibrate) navigator.vibrate([50,30,50]);
  };

  const percentage = Math.min((count / target) * 100, 100);
  const completed = Math.floor(count / target);

  return (
    <div className="min-h-full bg-background flex flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold font-serif text-primary mb-2">Tasbih</h1>
      <p className="text-muted-foreground font-serif mb-8">سبحان الله</p>

      {/* Target selector */}
      <div className="flex gap-3 mb-8">
        {[33, 99, 100].map(t => (
          <button key={t} onClick={()=>setTarget(t)}
            className={`px-4 py-2 rounded-full font-serif text-sm ${target===t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Circular Counter */}
      <div className="relative w-64 h-64 mb-8" onClick={increment}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage/100)}`}
            className="text-primary transition-all duration-300"
            strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold font-serif text-primary">{count % target || (count > 0 && count % target === 0 ? target : 0)}</span>
          <span className="text-muted-foreground text-sm mt-1">of {target}</span>
          {completed > 0 && <span className="text-secondary text-xs mt-1">✓ {completed}x completed</span>}
        </div>
      </div>

      <p className="text-muted-foreground text-sm mb-6">Tap the circle to count</p>

      {/* Dhikr suggestions */}
      <div className="w-full max-w-sm space-y-2 mb-8">
        {[
          { ar: 'سُبْحَانَ اللَّه', en: 'SubhanAllah', count: 33 },
          { ar: 'الْحَمْدُ لِلَّه', en: 'Alhamdulillah', count: 33 },
          { ar: 'اللَّهُ أَكْبَر', en: 'Allahu Akbar', count: 34 },
        ].map(d => (
          <div key={d.en} className="bg-card border border-border rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-foreground font-serif" dir="rtl">{d.ar}</p>
              <p className="text-muted-foreground text-sm">{d.en}</p>
            </div>
            <span className="text-primary font-bold">×{d.count}</span>
          </div>
        ))}
      </div>

      <button onClick={reset}
        className="px-8 py-3 bg-muted text-muted-foreground rounded-full font-serif hover:bg-primary/10 transition-colors">
        Reset
      </button>
    </div>
  );
}