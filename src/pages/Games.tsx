import { useEffect, useRef, useState } from "react";
import { Gamepad2, X, Loader2, RotateCcw } from "lucide-react";
import PageHero from "@/components/PageHero";

type GameId = "football" | "archery" | "horse" | "hockey" | "cricket" | "swimming";
type Gender = "male" | "female";

const GAMES: { id: GameId; name: string; emoji: string; blurb: string; how: string; grad: string }[] = [
  { id: "football", name: "Football", emoji: "⚽", blurb: "Dribble past defenders and beat the keeper.", how: "Stick = run • SHOOT near the ball", grad: "from-emerald-700 to-green-500" },
  { id: "archery", name: "Archery", emoji: "🏹", blurb: "Aim, draw and release. Watch the wind!", how: "Drag to aim • hold to draw • release to shoot", grad: "from-amber-700 to-yellow-500" },
  { id: "horse", name: "Horse Riding", emoji: "🐎", blurb: "Gallop down the track, jump hurdles, grab rings.", how: "Stick = steer • JUMP over hurdles", grad: "from-orange-800 to-amber-600" },
  { id: "hockey", name: "Hockey", emoji: "🏑", blurb: "Field hockey: carry the ball and score.", how: "Stick = run • HIT near the ball", grad: "from-teal-700 to-cyan-500" },
  { id: "cricket", name: "Cricket", emoji: "🏏", blurb: "Time your swing against a fast bowler.", how: "Tap SWING when the ball reaches the bat", grad: "from-sky-700 to-blue-500" },
  { id: "swimming", name: "Swimming", emoji: "🏊", blurb: "50 m freestyle race against 3 swimmers.", how: "Tap L and R alternately, fast!", grad: "from-cyan-700 to-sky-400" },
];
const KITS: { id: string; hex: string }[] = [
  { id: "green", hex: "#1f8a4c" }, { id: "blue", hex: "#2459c7" }, { id: "red", hex: "#c72b2b" },
  { id: "teal", hex: "#138a86" }, { id: "gold", hex: "#e0a82e" }, { id: "white", hex: "#f4f4f4" },
];

function Player({ id, gender, kit, onExit }: { id: GameId; gender: Gender; kit: string; onExit: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<Record<string, string | number>>({});
  const [toast, setToast] = useState("");
  const [end, setEnd] = useState<{ title: string; detail: string } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState("");
  const [round, setRound] = useState(0);
  const [cross, setCross] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    let raf = 0, disposed = false, cleanup = () => {};
    setState("loading"); setEnd(null); setHud({});
    (async () => {
      try {
        const [eng, idx, chars] = await Promise.all([import("@/games/engine"), import("@/games/index"), import("@/games/characters")]);
        if (disposed || !canvas.current || !wrap.current) return;
        const stage = eng.createStage(canvas.current);
        const ctrl = idx.controlsFor(id);
        setHint(ctrl.hint);
        const input = new eng.Input(wrap.current, ctrl);
        const hudApi = {
          set: (k: string, v: string | number) => setHud((h) => (h[k] === v ? h : { ...h, [k]: v })),
          toast: (m: string, ms = 1200) => { setToast(m); window.setTimeout(() => setToast((t) => (t === m ? "" : t)), ms); },
          end: (title: string, detail: string) => setEnd({ title, detail }),
        };
        const game = idx.createGame(id, { renderer: stage.renderer, scene: stage.scene, camera: stage.camera, hud: hudApi, input, base: import.meta.env.BASE_URL, gender, kit: chars.KITS[kit] || chars.KITS.green });
        const fit = () => {
          stage.resize();
          stage.camera.zoom = Math.min(1, stage.camera.aspect / 1.55);
          stage.camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", fit);
        await game.init();
        if (disposed) { input.dispose(); stage.renderer.dispose(); return; }
        setCross(game.crosshair);
        fit();
        setState("ready");
        let last = performance.now();
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          game.update(dt);
          stage.renderer.render(stage.scene, stage.camera);
        };
        raf = requestAnimationFrame(loop);
        cleanup = () => {
          window.removeEventListener("resize", fit);
          game.dispose(); input.dispose();
          stage.scene.traverse((o) => {
            const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
            m.geometry?.dispose();
            if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose()); else m.material?.dispose();
          });
          stage.renderer.dispose();
        };
      } catch (e) {
        console.error(e);
        setErr(e instanceof Error ? e.message : String(e));
        setState("error");
      }
    })();
    return () => { disposed = true; cancelAnimationFrame(raf); cleanup(); };
  }, [id, gender, kit, round]);

  useEffect(() => {
    // try landscape (works when the WebView allows it); silently ignore otherwise
    try { (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.("landscape")?.catch(() => {}); } catch { /* ignore */ }
    return () => { try { screen.orientation?.unlock?.(); } catch { /* ignore */ } };
  }, []);

  return (
    <div ref={wrap} className="fixed inset-0 z-[100] bg-black select-none" style={{ touchAction: "none" }}>
      <canvas ref={canvas} className="w-full h-full block" />
      <div className="absolute top-0 left-0 right-0 p-2 flex items-start gap-2 pointer-events-none z-[5]">
        <button onClick={onExit} className="pointer-events-auto w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center" aria-label="Exit game"><X className="w-5 h-5" /></button>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(hud).map(([k, v]) => (
            <div key={k} className="bg-black/55 text-white rounded-lg px-2.5 py-1 leading-tight text-center min-w-[52px]">
              <div className="text-[9px] uppercase tracking-wider opacity-70">{k}</div>
              <div className="text-sm font-bold">{v}</div>
            </div>
          ))}
        </div>
      </div>
      {state === "ready" && cross && !end && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[4] w-10 h-10 rounded-full border-2 border-white/80"><div className="absolute left-1/2 top-1/2 w-1 h-1 -ml-0.5 -mt-0.5 rounded-full bg-red-500" /></div>}
      {toast && <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/70 text-white font-bold px-4 py-2 rounded-full text-base pointer-events-none z-[6]">{toast}</div>}
      {state === "ready" && !end && <div className="absolute bottom-1 left-0 right-0 text-center text-[11px] text-white/80 pointer-events-none z-[4] drop-shadow">{hint}</div>}
      {state === "loading" && <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white gap-3 z-[7]"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm opacity-80">Loading 3D players…</p></div>}
      {state === "error" && <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white gap-3 z-[7] p-6 text-center"><p className="font-semibold">This game couldn't start on this device.</p><p className="text-xs opacity-70 break-words">{err}</p><button onClick={onExit} className="px-4 py-2 rounded-full bg-white/15">Back</button></div>}
      {end && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[8] p-4">
          <div className="bg-card text-card-foreground rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-1">{end.title}</h2>
            <p className="text-sm text-muted-foreground mb-5">{end.detail}</p>
            <div className="flex gap-2">
              <button onClick={onExit} className="flex-1 py-2.5 rounded-full bg-muted font-semibold">Menu</button>
              <button onClick={() => setRound((r) => r + 1)} className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5"><RotateCcw className="w-4 h-4" />Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Games() {
  const [playing, setPlaying] = useState<GameId | null>(null);
  const [gender, setGender] = useState<Gender>(() => { try { return (localStorage.getItem("li_game_gender") as Gender) || "male"; } catch { return "male"; } });
  const [kit, setKit] = useState<string>(() => { try { return localStorage.getItem("li_game_kit") || "green"; } catch { return "green"; } });
  useEffect(() => { try { localStorage.setItem("li_game_gender", gender); localStorage.setItem("li_game_kit", kit); } catch { /* ignore */ } }, [gender, kit]);

  return (
    <div className="flex flex-col items-center gap-5 pb-10 px-4">
      <PageHero tone="emerald" title="Games" arabic="ألعاب" subtitle="3D sports with real human players. Fair play, good manners and fun." icon={Gamepad2} className="w-full max-w-3xl" />
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold w-16">Player</span>
          {(["male", "female"] as Gender[]).map((g) => (
            <button key={g} onClick={() => setGender(g)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${gender === g ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{g === "male" ? "Male" : "Female"}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold w-16">Kit</span>
          {KITS.map((k) => (
            <button key={k.id} onClick={() => setKit(k.id)} aria-label={k.id} className={`w-8 h-8 rounded-full border-2 ${kit === k.id ? "border-primary scale-110" : "border-border"}`} style={{ background: k.hex }} />
          ))}
        </div>
      </div>
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GAMES.map((g) => (
          <button key={g.id} onClick={() => setPlaying(g.id)} className={`text-left rounded-2xl p-4 text-white bg-gradient-to-br ${g.grad} shadow-lg active:scale-[0.98] transition-transform relative overflow-hidden`}>
            <div className="absolute -right-3 -top-4 text-8xl opacity-25 select-none">{g.emoji}</div>
            <div className="text-3xl mb-1">{g.emoji}</div>
            <div className="text-lg font-bold">{g.name}</div>
            <div className="text-sm opacity-95">{g.blurb}</div>
            <div className="text-[11px] mt-2 opacity-80">{g.how}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-md">Tip: turn your phone sideways for the best view. Players wear modest sports kits.</p>
      {playing && <Player id={playing} gender={gender} kit={kit} onExit={() => setPlaying(null)} />}
    </div>
  );
}
