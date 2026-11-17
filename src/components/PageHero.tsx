import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "emerald" | "teal" | "indigo" | "amber" | "rose" | "violet";

const TONES: Record<Tone, string> = {
  emerald: "from-emerald-900 via-emerald-800 to-emerald-700",
  teal: "from-teal-900 via-teal-800 to-cyan-700",
  indigo: "from-indigo-950 via-indigo-900 to-blue-800",
  amber: "from-amber-900 via-amber-800 to-yellow-700",
  rose: "from-rose-950 via-rose-900 to-red-800",
  violet: "from-violet-950 via-violet-900 to-purple-800",
};

/** Eight-point Islamic star lattice, drawn as a tiling SVG (no external files). */
const PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.13' stroke-width='1'%3E%3Cpath d='M28 4l6.5 15.5L50 26l-15.5 6.5L28 48l-6.5-15.5L6 26l15.5-6.5z'/%3E%3Ccircle cx='28' cy='26' r='4'/%3E%3C/g%3E%3C/svg%3E")`;

/**
 * Professional banner for the top of every section: deep gradient, star pattern, gold accents,
 * big Arabic calligraphy title, optional icon, subtitle and a slot for actions (audio button, language, etc.).
 */
export default function PageHero({
  title,
  arabic,
  subtitle,
  icon: Icon,
  tone = "emerald",
  children,
  className = "",
}: {
  title: ReactNode;
  arabic?: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${TONES[tone]} text-white shadow-xl shadow-black/10 ring-1 ring-white/10 mb-8 ${className}`}
    >
      <div className="absolute inset-0" style={{ backgroundImage: PATTERN }} aria-hidden />
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="relative px-6 py-9 md:py-12 text-center">
        {Icon && (
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/25 flex items-center justify-center shadow-lg">
            <Icon className="w-7 h-7 text-amber-300" />
          </div>
        )}
        {arabic && (
          <p className="font-serif text-3xl md:text-4xl text-amber-300 drop-shadow mb-2 leading-snug" dir="rtl">
            {arabic}
          </p>
        )}
        <h1 className="text-3xl md:text-5xl font-bold font-serif tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
        {children && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
        <div className="mt-6 mx-auto h-px w-40 bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      </div>
    </header>
  );
}
