import { useState } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
const IMG_RE = /\.(png|jpe?g|gif|webp|avif)(\?[^\s]*)?$/i;
const isImageUrl = (u: string) => IMG_RE.test(u) || /res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(u);
const ytId = (u: string) => {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u);
  return m ? m[1] : null;
};
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const open = (u: string) => window.open(u, "_blank", "noopener,noreferrer");

/** A chat message body: clickable links, plus a picture / video thumbnail / site card for the first link. */
export default function RichText({ text }: { text: string }) {
  const [full, setFull] = useState(false);
  const urls = text.match(URL_RE) || [];
  if (!urls.length) return <>{text}</>;
  const first = urls[0].replace(/[).,!?]+$/, "");
  const onlyLink = text.trim() === urls[0];
  const img = isImageUrl(first);
  const yt = ytId(first);
  const parts = text.split(URL_RE);

  return (
    <>
      {!(onlyLink && (img || yt)) && parts.map((p, i) => /^https?:\/\//.test(p) ? (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all" onClick={(e) => e.stopPropagation()}>{p}</a>
      ) : <span key={i}>{p}</span>)}
      {img ? (
        <>
          <img src={first} alt="" loading="lazy" onClick={() => setFull(true)} className="mt-1 rounded-xl max-h-64 max-w-full object-cover" />
          {full && (
            <div className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center" onClick={() => setFull(false)}>
              <img src={first} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </>
      ) : yt ? (
        <button onClick={() => open(first)} className="mt-1 relative block rounded-xl overflow-hidden max-w-full">
          <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="YouTube video" loading="lazy" className="w-full max-h-48 object-cover" />
          <span className="absolute inset-0 flex items-center justify-center text-4xl text-white drop-shadow">▶️</span>
        </button>
      ) : (
        <button onClick={() => open(first)} className="mt-1 flex items-center gap-2 rounded-xl bg-black/15 px-2.5 py-2 text-left max-w-full">
          <img src={`https://www.google.com/s2/favicons?domain=${host(first)}&sz=64`} alt="" className="w-6 h-6 rounded" />
          <span className="min-w-0"><span className="block text-xs font-semibold truncate">{host(first)}</span><span className="block text-[11px] opacity-70 truncate">{first.replace(/^https?:\/\/(www\.)?/, "")}</span></span>
        </button>
      )}
    </>
  );
}
