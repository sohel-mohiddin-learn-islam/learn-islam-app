import { useId } from "react";

export type AvatarCfg = {
  skin: string; hair: string; hairStyle: "short" | "curly" | "none";
  wear: "none" | "kufi" | "turban" | "shemagh" | "hijab" | "niqab";
  wearColor: string; beard: "none" | "short" | "full"; glasses: boolean;
  outfit: string; bg: string; eyes: string;
};

export const DEFAULT_AVATAR: AvatarCfg = {
  skin: "#f1c9a5", hair: "#2b1d16", hairStyle: "short", wear: "kufi", wearColor: "#ffffff",
  beard: "short", glasses: false, outfit: "#1f9d6b", bg: "#0f766e", eyes: "#3b2416",
};
export const SKINS = ["#fde0c8", "#f1c9a5", "#d9a679", "#b9825a", "#8d5a3c", "#5c3a26"];
export const HAIRS = ["#17110d", "#2b1d16", "#5a3a22", "#8a5a2b", "#b8b8b8", "#c1432e"];
export const COLORS = ["#ffffff", "#f4e9cf", "#1f9d6b", "#2f6fdb", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#222222"];
export const BGS = ["#0f766e", "#1e3a8a", "#581c87", "#9d174d", "#78350f", "#14532d", "#334155", "#b45309"];

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("")}`;
};

/** A cartoon avatar drawn in code from a small set of choices. `wave` makes the hand wave like Instagram's avatars. */
export default function AvatarArt({ cfg, size = 128, wave = false, round = true }: { cfg: AvatarCfg; size?: number; wave?: boolean; round?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const c = { ...DEFAULT_AVATAR, ...cfg };
  const skinD = shade(c.skin, -28);
  const woman = c.wear === "hijab" || c.wear === "niqab";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ borderRadius: round ? "50%" : 0, display: "block" }} role="img" aria-label="Avatar">
      <defs>
        <radialGradient id={`bg${uid}`} cx=".35" cy=".25" r="1"><stop offset="0" stopColor={shade(c.bg, 40)} /><stop offset="1" stopColor={shade(c.bg, -50)} /></radialGradient>
        <radialGradient id={`sk${uid}`} cx=".38" cy=".3" r=".9"><stop offset="0" stopColor={shade(c.skin, 18)} /><stop offset="1" stopColor={c.skin} /></radialGradient>
        <linearGradient id={`ot${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(c.outfit, 25)} /><stop offset="1" stopColor={shade(c.outfit, -35)} /></linearGradient>
        <linearGradient id={`wr${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={shade(c.wearColor, 18)} /><stop offset="1" stopColor={shade(c.wearColor, -30)} /></linearGradient>
        <style>{`@keyframes wv${uid}{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(22deg)}}`}</style>
      </defs>
      <rect width="200" height="200" fill={`url(#bg${uid})`} />
      <g fill="#fff" opacity=".55"><circle cx="30" cy="34" r="2"/><circle cx="170" cy="24" r="2.4"/><circle cx="178" cy="70" r="1.6"/><circle cx="22" cy="80" r="1.6"/></g>

      {/* hijab / niqab back */}
      {woman && <path d="M100 18C58 18 40 50 40 92c0 30 8 52 4 78h112c-4-26 4-48 4-78 0-42-18-74-60-74z" fill={`url(#wr${uid})`} />}
      {/* body */}
      <path d="M22 200c2-40 32-62 78-62s76 22 78 62z" fill={`url(#ot${uid})`} />
      {!woman && <path d="M86 140l14 18 14-18" fill="none" stroke={shade(c.outfit, -60)} strokeWidth="3" strokeLinecap="round" />}
      {/* neck */}
      <rect x="86" y="118" width="28" height="28" rx="10" fill={skinD} />
      {/* ears */}
      {!woman && <><circle cx="57" cy="94" r="8" fill={c.skin} /><circle cx="143" cy="94" r="8" fill={c.skin} /></>}
      {/* hair behind turban/kufi */}
      {c.wear !== "hijab" && c.wear !== "niqab" && c.hairStyle === "curly" && (
        <g fill={c.hair}>{[[62, 62], [78, 52], [100, 48], [122, 52], [138, 62], [56, 82], [144, 82]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="14" />)}</g>
      )}
      {/* head */}
      <ellipse cx="100" cy="92" rx="44" ry="48" fill={`url(#sk${uid})`} />
      {c.hairStyle === "short" && !woman && <path d="M56 78c0-34 20-48 44-48s44 14 44 48c-8-16-24-24-44-24s-36 8-44 24z" fill={c.hair} />}
      {/* beard */}
      {!woman && c.beard !== "none" && (
        <path d={c.beard === "full" ? "M58 96c0 38 18 54 42 54s42-16 42-54c-6 16-16 22-42 22s-36-6-42-22z" : "M64 108c4 22 18 30 36 30s32-8 36-30c-8 10-20 14-36 14s-28-4-36-14z"} fill={c.hair} />
      )}
      {/* face */}
      <g>
        <ellipse cx="82" cy="94" rx="9" ry="10.5" fill="#fff" /><ellipse cx="118" cy="94" rx="9" ry="10.5" fill="#fff" />
        <circle cx="84" cy="96" r="6" fill={c.eyes} /><circle cx="116" cy="96" r="6" fill={c.eyes} />
        <circle cx="86" cy="93" r="2.2" fill="#fff" /><circle cx="118" cy="93" r="2.2" fill="#fff" />
        <path d="M71 80q11-8 22 0M107 80q11-8 22 0" stroke={woman || c.hairStyle === "none" ? skinD : c.hair} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <ellipse cx="68" cy="108" rx="7" ry="4.5" fill="#ff8aa0" opacity=".35" /><ellipse cx="132" cy="108" rx="7" ry="4.5" fill="#ff8aa0" opacity=".35" />
        <path d="M100 98q-3 8 1 10" stroke={skinD} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {c.wear !== "niqab" && <path d="M86 116q14 12 28 0" stroke="#9b3b3b" strokeWidth="3.4" fill="#fff" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
      {c.glasses && <g fill="none" stroke="#222" strokeWidth="3"><circle cx="82" cy="94" r="14" /><circle cx="118" cy="94" r="14" /><path d="M96 94h8" /></g>}

      {/* head wear */}
      {c.wear === "kufi" && (
        <g>
          <path d="M60 66c0-26 18-38 40-38s40 12 40 38c-12-6-26-9-40-9s-28 3-40 9z" fill={`url(#wr${uid})`} />
          <path d="M60 66c12-6 26-9 40-9s28 3 40 9" stroke={shade(c.wearColor, -45)} strokeWidth="3" fill="none" />
          <path d="M78 52l6-8 6 8 6-8 6 8 6-8 6 8" stroke={shade(c.wearColor, -45)} strokeWidth="2" fill="none" />
        </g>
      )}
      {c.wear === "turban" && (
        <g>
          <path d="M54 76c-4-34 18-54 46-54s50 20 46 54c-10-12-28-18-46-18s-36 6-46 18z" fill={`url(#wr${uid})`} />
          <path d="M60 62c18-10 62-10 80 0M56 72c20-10 68-10 88 0M70 40c18 8 42 8 60 0" stroke={shade(c.wearColor, -45)} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {c.wear === "shemagh" && (
        <g>
          <path d="M44 84c-4-40 20-62 56-62s60 22 56 62c0 30 8 50 14 66-14 0-26-8-30-22-4-20-4-34-4-44-10-14-22-20-36-20s-26 6-36 20c0 10 0 24-4 44-4 14-16 22-30 22 6-16 14-36 14-66z" fill="#f7f5ee" />
          <path d="M44 70c-2-28 20-46 56-46s58 18 56 46c-10-12-30-18-56-18s-46 6-56 18z" fill="#f7f5ee" stroke="#e1ded0" strokeWidth="2" />
          <rect x="52" y="56" width="96" height="12" rx="6" fill={c.wearColor === "#ffffff" ? "#1b1b1b" : c.wearColor} />
        </g>
      )}
      {c.wear === "hijab" && (
        <g>
          <path d="M52 100c0-30 8-60 48-60s48 30 48 60c-6-30-18-44-48-44s-42 14-48 44z" fill={`url(#wr${uid})`} />
          <path d="M44 150c0-22 14-34 30-38 8 10 18 14 26 14s18-4 26-14c16 4 30 16 30 38z" fill={`url(#wr${uid})`} />
        </g>
      )}
      {c.wear === "niqab" && (
        <g>
          <path d="M54 110c0-6 2-10 6-12h80c4 2 6 6 6 12v44H54z" fill="#1c1c24" />
          <path d="M52 100c0-30 8-60 48-60s48 30 48 60c-8-8-16-12-48-12s-40 4-48 12z" fill="#1c1c24" />
          <rect x="62" y="76" width="76" height="26" rx="13" fill="none" />
        </g>
      )}

      {/* waving hand */}
      {wave && (
        <g style={{ transformOrigin: "34px 188px", animation: `wv${uid} 1s ease-in-out infinite` }}>
          <rect x="22" y="130" width="24" height="60" rx="12" fill={`url(#sk${uid})`} />
          <rect x="14" y="112" width="40" height="32" rx="14" fill={`url(#sk${uid})`} />
          <g stroke={skinD} strokeWidth="1.6" strokeLinecap="round"><path d="M24 120v10M34 116v12M44 120v10" /></g>
        </g>
      )}
    </svg>
  );
}
