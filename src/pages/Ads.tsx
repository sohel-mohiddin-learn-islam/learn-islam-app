import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImage, uploadVideo } from "@/lib/posts";
import { safeUrl } from "@/lib/safeUrl";
import { addNaat, deleteNaat, getNaats, type Naat } from "@/lib/storyTools";
import { ADMIN_EMAIL, PRICE_PER_DAY, approveAd, checkPayment, createAd, getAllAds, getMyAds, getPending, hasPaymentServer, payForAd, rejectAd, removeAd, setPending, startBrowserPayment, type Ad } from "@/lib/ads";

function Status({ ad }: { ad: Ad }) {
  const label =
    ad.status === "pending" ? "Waiting for approval" : ad.status === "rejected" ? "Rejected" : ad.endsAt > Date.now() ? `Running until ${new Date(ad.endsAt).toLocaleDateString()}` : "Finished";
  return <span className="text-sm text-foreground/70">{label}</span>;
}

export default function Ads() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [days, setDays] = useState(3);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [percent, setPercent] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const uploaded = useRef<{ key: string; url: string } | null>(null); // a finished upload is reused if payment is retried
  const polling = useRef(false);
  const [error, setError] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const [mine, setMine] = useState<Ad[]>([]);
  const [all, setAll] = useState<Ad[]>([]);
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [naats, setNaats] = useState<Naat[]>([]);
  const [nTitle, setNTitle] = useState("");
  const [nArtist, setNArtist] = useState("");
  const [nLicense, setNLicense] = useState("");
  const [nFile, setNFile] = useState<File | null>(null);
  const [nBusy, setNBusy] = useState(false);
  const loadNaats = () => getNaats().then(setNaats);
  useEffect(() => { if (isAdmin) loadNaats(); }, [isAdmin]);
  const uploadNaat = async () => {
    if (!user || !nFile || !nTitle.trim() || !nLicense.trim()) return alert("Add a title, the license / permission, and an audio file.");
    setNBusy(true);
    try {
      const url = await uploadVideo(nFile, user.uid);
      await addNaat({ title: nTitle.trim(), artist: nArtist.trim() || "Unknown", url, license: nLicense.trim() });
      setNTitle(""); setNArtist(""); setNLicense(""); setNFile(null);
      loadNaats();
    } catch (e: any) { alert(e?.message || "Upload failed"); }
    setNBusy(false);
  };

  const load = () => {
    if (!user) return;
    getMyAds(user.uid).then(setMine).catch(() => {});
    if (isAdmin) getAllAds().then(setAll).catch(() => {});
  };
  useEffect(load, [user?.uid]);

  // a payment started in the browser: wait for it (also resumes after the app was closed)
  const waitForPayment = async (): Promise<void> => {
    const p = getPending();
    if (!p || polling.current || !user) return;
    polling.current = true;
    setWaiting(true);
    setError("");
    const until = Date.now() + 15 * 60 * 1000;
    try {
      while (Date.now() < until) {
        const r = await checkPayment(p.linkId).catch(() => null);
        if (r?.paid && r.paymentId) {
          setBusy("Saving your ad…");
          await createAd({ ...p.form, paymentId: r.paymentId });
          setPending(null);
          setTitle(""); setText(""); setLink(""); setFile(null); uploaded.current = null;
          alert("Payment received. Your ad will start running once it is approved.");
          load();
          return;
        }
        if (r && (r.status === "expired" || r.status === "cancelled")) { setPending(null); setError("The payment was cancelled or expired."); return; }
        if (!getPending()) return; // cancelled by the person
        await new Promise((res) => setTimeout(res, 3000));
      }
      setError("Still waiting for the payment. If you already paid, tap “Check payment” in a minute.");
    } catch (e: any) {
      setError(e?.message || "Could not confirm the payment.");
    } finally {
      polling.current = false;
      setWaiting(false);
      setBusy("");
    }
  };
  useEffect(() => { if (user && getPending()) waitForPayment(); }, [user?.uid]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const total = days * PRICE_PER_DAY;


  const submit = async () => {
    setError("");
    if (!title.trim() || !file) return setError("Add a title and a video or image for your ad.");
    if (link && !/^https?:\/\//i.test(link)) return setError("The link must start with https://");
    try {
      const isVideo = file.type.startsWith("video/");
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      let mediaUrl = uploaded.current?.key === key ? uploaded.current.url : "";
      if (!mediaUrl) {
        setPercent(0);
        setBusy("Uploading your ad…");
        mediaUrl = isVideo ? await uploadVideo(file, user.uid, setPercent) : await uploadImage(file);
        uploaded.current = { key, url: mediaUrl };
      }
      setPercent(100);
      setBusy("Opening payment…");
      const form = {
        ownerId: user.uid, ownerName: user.displayName || "Learn Islam User", title: title.trim(), text: text.trim(),
        mediaUrl, mediaType: (isVideo ? "video" : "image") as "video" | "image", link: link.trim(), days, amount: total,
      };
      if (hasPaymentServer) {
        const linkId = await startBrowserPayment(total, `Ad: ${title.trim()} (${days} days)`, user.email, user.displayName);
        setPending({ linkId, form });
        await waitForPayment();
        return;
      }
      const paymentId = await payForAd(total, `Ad: ${title.trim()} (${days} days)`, user.email, user.displayName);
      setBusy("Saving your ad…");
      await createAd({ ...form, paymentId });
      setTitle(""); setText(""); setLink(""); setFile(null); uploaded.current = null;
      alert("Payment received. Your ad will start running once it is approved.");
      load();
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      if (!polling.current) setBusy("");
    }
  };

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); load(); } catch (e: any) { alert(e?.message || "Failed"); }
  };

  const DAYS = [{ d: 1, tag: "" }, { d: 3, tag: "" }, { d: 7, tag: "Popular" }, { d: 14, tag: "" }, { d: 30, tag: "Best value" }];
  const ends = new Date(Date.now() + days * 86400000).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const isVideoFile = !!file && (file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name));
  const step = !file ? 1 : !title.trim() ? 2 : 3;
  const field = "w-full rounded-xl bg-white/[0.06] border border-white/10 focus:border-emerald-400/70 px-4 py-3 text-white placeholder:text-white/35 outline-none transition";
  const pill = (st: Ad["status"], ad: Ad) =>
    st === "pending" ? ["Under review", "bg-amber-400/15 text-amber-300"] : st === "rejected" ? ["Rejected", "bg-red-400/15 text-red-300"] : ad.endsAt > Date.now() ? ["Live", "bg-emerald-400/15 text-emerald-300"] : ["Finished", "bg-white/10 text-white/60"];

  return (
    <div className="min-h-full text-white font-sans" style={{ background: "radial-gradient(1200px 500px at 50% -10%, #0f5a47 0%, #0a1b2e 45%, #060b16 100%)" }}>
      <div className="max-w-lg mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">Ads Studio</h1>
          <span className="ml-auto text-[11px] tracking-wide uppercase rounded-full bg-emerald-400/15 text-emerald-300 px-2.5 py-1">Secure payments</span>
        </div>

        <div className="rounded-3xl p-5 mb-5 border border-white/10" style={{ background: "linear-gradient(135deg, rgba(16,185,129,.25), rgba(99,102,241,.18))" }}>
          <p className="text-2xl font-bold leading-tight">Put your message in front of the community</p>
          <p className="text-white/70 text-sm mt-2">Your ad appears between reels. Simple pricing — ₹{PRICE_PER_DAY} a day, no hidden fees. Every ad is reviewed before it goes live.</p>
        </div>

        {/* steps */}
        <div className="flex items-center gap-2 mb-5 text-xs">
          {["Creative", "Details", "Budget"].map((t, i) => (
            <div key={t} className="flex items-center gap-2 flex-1">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step > i + 1 || (i === 2 && step === 3 && title && file) ? "bg-emerald-400 text-black" : step === i + 1 ? "bg-white text-black" : "bg-white/10 text-white/50"}`}>{step > i + 1 ? "✓" : i + 1}</span>
              <span className={step >= i + 1 ? "text-white" : "text-white/40"}>{t}</span>
              {i < 2 && <span className="flex-1 h-px bg-white/15" />}
            </div>
          ))}
        </div>

        {/* 1 creative */}
        <p className="text-sm font-semibold mb-2">1 · Upload your creative</p>
        <label className="block mb-5 cursor-pointer">
          <input type="file" className="hidden" accept="video/*,image/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,application/octet-stream" onChange={(e) => { const f = e.target.files?.[0] || null; if (f && !/^(video|image)\//.test(f.type) && !/\.(mp4|mov|webm|jpe?g|png)$/i.test(f.name)) { setError("Please choose a video or an image."); return; } setFile(f); }} />
          {file ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-emerald-400/40 p-3">
              <span className="w-12 h-12 rounded-xl bg-emerald-400/15 flex items-center justify-center text-2xl">{isVideoFile ? "🎬" : "🖼️"}</span>
              <span className="flex-1 min-w-0"><span className="block truncate font-medium">{file.name}</span><span className="block text-xs text-white/50">{(file.size / 1048576).toFixed(1)} MB · tap to change</span></span>
              <span className="text-emerald-300">✓</span>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] py-9 text-center">
              <div className="text-4xl mb-2">⬆️</div>
              <p className="font-semibold">Tap to choose a video or image</p>
              <p className="text-xs text-white/50 mt-1">Vertical video works best · MP4, MOV, JPG, PNG</p>
            </div>
          )}
        </label>

        {/* 2 details */}
        <p className="text-sm font-semibold mb-2">2 · Write your ad</p>
        <div className="space-y-3 mb-5">
          <div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Headline  (e.g. Learn Qur'an online)" className={field} />
            <p className="text-right text-[11px] text-white/40 mt-1">{title.length}/60</p>
          </div>
          <div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Short description (optional)" rows={3} className={field + " resize-none"} />
            <p className="text-right text-[11px] text-white/40 mt-1">{text.length}/200</p>
          </div>
          <input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" placeholder="Website link (optional) — https://…" className={field} />
        </div>

        {/* live preview */}
        <p className="text-sm font-semibold mb-2">Live preview</p>
        <div className="mx-auto w-56 mb-6 rounded-[28px] border border-white/15 bg-black overflow-hidden shadow-2xl shadow-emerald-900/40">
          <div className="relative aspect-[9/14] bg-gradient-to-br from-emerald-900 to-slate-900 flex items-center justify-center">
            {preview ? (isVideoFile ? <video src={preview} muted playsInline autoPlay loop className="w-full h-full object-cover" /> : <img src={preview} alt="" className="w-full h-full object-cover" />) : <span className="text-white/30 text-sm">Your creative</span>}
            <span className="absolute top-3 left-3 text-[10px] bg-black/60 rounded-full px-2 py-0.5">Sponsored</span>
            <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/90 to-transparent">
              <p className="font-bold leading-tight">{title.trim() || "Your headline"}</p>
              {text.trim() && <p className="text-xs text-white/75 mt-0.5 line-clamp-2">{text.trim()}</p>}
              {/^https?:\/\//i.test(link) && <span className="inline-block mt-2 text-xs font-semibold bg-white text-black rounded-full px-3 py-1">Learn more</span>}
            </div>
          </div>
        </div>

        {/* 3 budget */}
        <p className="text-sm font-semibold mb-2">3 · Choose how long it runs</p>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {DAYS.map(({ d, tag }) => (
            <button key={d} type="button" onClick={() => setDays(d)} className={`relative rounded-2xl py-3 text-center border transition ${days === d ? "bg-emerald-400 text-black border-emerald-300 font-bold scale-[1.03]" : "bg-white/[0.06] border-white/10"}`}>
              <span className="block text-lg leading-none">{d}</span><span className="block text-[10px] opacity-70 mt-0.5">{d === 1 ? "day" : "days"}</span>
              {tag && <span className={`absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] rounded-full px-1.5 py-0.5 ${days === d ? "bg-black text-emerald-300" : "bg-indigo-500 text-white"}`}>{tag}</span>}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 mb-4">
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Rate</span><span>₹{PRICE_PER_DAY} / day</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Duration</span><span>{days} {days === 1 ? "day" : "days"}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Runs until (if approved today)</span><span>{ends}</span></div>
          <div className="flex justify-between items-end pt-3 mt-2 border-t border-white/10"><span className="font-semibold">Total</span><span className="text-3xl font-extrabold text-emerald-300">₹{total}</span></div>
        </div>

        {error && <p className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-3 py-2 mb-3">{error}</p>}
        <button disabled={!!busy} onClick={submit} className="w-full rounded-2xl py-4 font-bold text-black text-base disabled:opacity-60 active:scale-[.99] transition" style={{ background: "linear-gradient(90deg,#34d399,#a3e635)" }}>
          {busy ? (busy.startsWith("Uploading") && percent > 0 && percent < 100 ? `Uploading… ${percent}%` : busy) : `Pay ₹${total} & launch`}
        </button>
        {busy.startsWith("Uploading") && (
          <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${percent}%` }} /></div>
        )}
        {waiting && (
          <div className="mt-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-sm">
            <p className="font-semibold">⏳ Waiting for your payment…</p>
            <p className="text-white/70 mt-1">Finish paying in the browser window (PhonePe, Google Pay or any UPI app), then come back here. This updates by itself.</p>
            <button onClick={() => { setPending(null); }} className="mt-2 text-red-300 font-semibold">Cancel</button>
          </div>
        )}
        {!waiting && getPending() && (
          <button onClick={() => waitForPayment()} className="w-full mt-2 rounded-2xl border border-white/20 py-2.5 font-semibold">Check payment</button>
        )}
        <div className="flex justify-center gap-4 text-[11px] text-white/45 mt-3">
          <span>🔒 Secure Razorpay checkout</span><span>✅ Reviewed before going live</span>
        </div>
        <p className="text-[11px] text-center text-white/40 mt-1">If an ad is rejected, contact support for a refund.</p>

        <h2 className="font-bold text-lg mt-9 mb-3">Your campaigns</h2>
        {mine.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-8 text-center text-white/50"><div className="text-3xl mb-1">📣</div>No ads yet — your first one is just above.</div>
        )}
        {mine.map((a) => {
          const [label, cls] = pill(a.status, a);
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 p-3 mb-2">
              <span className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center shrink-0">
                {a.mediaType === "image" ? <img src={a.mediaUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🎬</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold">{a.title}</p>
                <p className="text-xs text-white/50">₹{a.amount} · {a.days} {a.days === 1 ? "day" : "days"}{a.status === "approved" && a.endsAt > Date.now() ? ` · until ${new Date(a.endsAt).toLocaleDateString()}` : ""}</p>
              </div>
              <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${cls}`}>{label}</span>
              <button onClick={() => confirm("Remove this ad?") && act(() => removeAd(a.id))} aria-label="Remove" className="text-white/50">🗑</button>
            </div>
          );
        })}

        {isAdmin && (
          <div className="rounded-2xl bg-background text-foreground p-4 mt-8">
            <h2 className="font-semibold text-lg mt-8 mb-1">Approve ads (admin)</h2>
            <p className="text-xs text-foreground/60 mb-2">Approve only after you see the payment id in your Razorpay dashboard.</p>
            {all.length === 0 && <p className="text-foreground/60">Nothing to review.</p>}
            {all.map((a) => (
              <div key={a.id} className="py-3 border-b border-border">
                <p className="font-medium">{a.title} <span className="text-foreground/60">· {a.ownerName}</span></p>
                <p className="text-sm text-foreground/70 break-all">Payment: {a.paymentId} · ₹{a.amount} · {a.days} days</p>
                <a href={safeUrl(a.mediaUrl) || undefined} target="_blank" rel="noopener noreferrer" className="text-sm underline">View media</a>
                <div className="flex gap-2 mt-2 items-center">
                  <Status ad={a} />
                  {a.status !== "approved" && <button onClick={() => act(() => approveAd(a))} className="ml-auto rounded-lg bg-green-600 text-white px-3 py-1.5">Approve</button>}
                  {a.status === "pending" && <button onClick={() => act(() => rejectAd(a))} className="rounded-lg bg-red-600 text-white px-3 py-1.5">Reject</button>}
                </div>
              </div>
            ))}
            <h2 className="font-semibold text-lg mt-8 mb-1">Naat library (admin)</h2>
            <p className="text-xs text-foreground/60 mb-2">Only add audio you own or have written permission / a free license to share. Users can attach these to their stories.</p>
            <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg bg-muted px-3 py-3 mb-2" />
            <input value={nArtist} onChange={(e) => setNArtist(e.target.value)} placeholder="Artist" className="w-full rounded-lg bg-muted px-3 py-3 mb-2" />
            <input value={nLicense} onChange={(e) => setNLicense(e.target.value)} placeholder="License / permission (e.g. CC0, own recording)" className="w-full rounded-lg bg-muted px-3 py-3 mb-2" />
            <input type="file" accept="audio/*" onChange={(e) => setNFile(e.target.files?.[0] || null)} className="mb-2" />
            <button disabled={nBusy} onClick={uploadNaat} className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-60">{nBusy ? "Uploading…" : "Add to library"}</button>
            {naats.map((n) => (
              <div key={n.id} className="flex items-center gap-2 py-2 border-b border-border">
                <div className="flex-1 min-w-0"><p className="truncate font-medium">{n.title}</p><p className="text-xs text-foreground/60 truncate">{n.artist} · {n.license}</p></div>
                <button onClick={() => confirm("Remove this track?") && deleteNaat(n.id).then(loadNaats)}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
