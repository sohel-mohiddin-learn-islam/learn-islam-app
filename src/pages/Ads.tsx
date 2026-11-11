import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImage, uploadVideo } from "@/lib/posts";
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

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto px-4 pb-12">
        <div className="flex items-center gap-4 py-4">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">Promote with ads</h1>
        </div>

        <p className="text-foreground/70 mb-4">Your ad is shown between reels. Price: ₹{PRICE_PER_DAY} per day.</p>

        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Ad title" className="w-full rounded-lg bg-muted px-3 py-3 mb-3" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Short description (optional)" rows={3} className="w-full rounded-lg bg-muted px-3 py-3 mb-3" />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Website link (optional, https://…)" className="w-full rounded-lg bg-muted px-3 py-3 mb-3" />
        <label className="block rounded-lg bg-muted px-3 py-3 mb-3">
          <span className="block text-sm text-foreground/70 mb-1">Video or image</span>
          <input type="file" accept="video/*,image/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,application/octet-stream" onChange={(e) => { const f = e.target.files?.[0] || null; if (f && !/^(video|image)\//.test(f.type) && !/\.(mp4|mov|webm|jpe?g|png)$/i.test(f.name)) { setError("Please choose a video or an image."); return; } setFile(f); }} />
        </label>
        <div className="flex items-center gap-3 mb-4">
          <span>Days:</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg bg-muted px-3 py-2">
            {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="ml-auto font-bold">₹{total}</span>
        </div>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <button disabled={!!busy} onClick={submit} className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-60">
          {busy ? (busy.startsWith("Uploading") && percent > 0 && percent < 100 ? `Uploading… ${percent}%` : busy) : `Pay ₹${total} and submit`}
        </button>
        {busy.startsWith("Uploading") && (
          <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div>
        )}
        {waiting && (
          <div className="mt-3 rounded-lg border border-border p-3 text-sm">
            <p className="font-semibold">Waiting for your payment…</p>
            <p className="text-foreground/70">Finish paying in the browser window (PhonePe, Google Pay or any UPI app), then come back here. This updates by itself.</p>
            <button onClick={() => { setPending(null); }} className="mt-2 text-red-500 font-semibold">Cancel</button>
          </div>
        )}
        {!waiting && getPending() && (
          <button onClick={() => waitForPayment()} className="w-full mt-2 rounded-lg border border-border py-2 font-semibold">Check payment</button>
        )}
        <p className="text-xs text-foreground/50 mt-2">Ads are checked before they run. If an ad is rejected, contact support for a refund.</p>

        <h2 className="font-semibold text-lg mt-8 mb-2">Your ads</h2>
        {mine.length === 0 && <p className="text-foreground/60">No ads yet.</p>}
        {mine.map((a) => (
          <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border">
            <div className="flex-1 min-w-0"><p className="truncate font-medium">{a.title}</p><Status ad={a} /></div>
            <span>₹{a.amount}</span>
            <button onClick={() => confirm("Remove this ad?") && act(() => removeAd(a.id))} aria-label="Remove">🗑</button>
          </div>
        ))}

        {isAdmin && (
          <>
            <h2 className="font-semibold text-lg mt-8 mb-1">Approve ads (admin)</h2>
            <p className="text-xs text-foreground/60 mb-2">Approve only after you see the payment id in your Razorpay dashboard.</p>
            {all.length === 0 && <p className="text-foreground/60">Nothing to review.</p>}
            {all.map((a) => (
              <div key={a.id} className="py-3 border-b border-border">
                <p className="font-medium">{a.title} <span className="text-foreground/60">· {a.ownerName}</span></p>
                <p className="text-sm text-foreground/70 break-all">Payment: {a.paymentId} · ₹{a.amount} · {a.days} days</p>
                <a href={a.mediaUrl} target="_blank" rel="noreferrer" className="text-sm underline">View media</a>
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
          </>
        )}
      </div>
    </div>
  );
}
