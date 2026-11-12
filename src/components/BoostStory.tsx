import { useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkPayment, createAd, hasPaymentServer, payForAd, setPending, startBrowserPayment } from "@/lib/ads";
import { deviceInfo } from "@/lib/analytics";
import type { Story } from "@/lib/stories";

export const BOOST_MIN = 50;
export const BOOST_MAX = 5000;
// Fixed packages: days -> total price in rupees
const PACKAGES: Record<number, number> = { 1: 50, 3: 150, 7: 299, 14: 1400, 30: 5000 };
const GST_RATE = 0; // shown on the review screen and added to the payment; set to 0 if you do not charge GST
const DAYS = [1, 3, 7, 14, 30];

type Goal = "profile" | "website" | "message";
const GOALS: { id: Goal; title: string; sub: string }[] = [
  { id: "profile", title: "Visit your profile", sub: "Best for awareness and followers" },
  { id: "website", title: "Visit your website", sub: "Best for sales, bookings and helping people learn more about you" },
  { id: "message", title: "Message you", sub: "Best for chats that can get you leads and questions" },
];

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function BoostStory({ story, ownerName, onClose }: { story: Story; ownerName: string; onClose: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("profile");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<"all" | "country">("all");
  const [days, setDays] = useState(3);
  const budget = Math.round(PACKAGES[days] / days); // per-day figure kept for ad weighting
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const stop = useRef(false);

  const country = deviceInfo().country;
  const base = PACKAGES[days];
  const gst = Math.round(base * GST_RATE * 100) / 100;
  const total = Math.round(base + gst);

  const next = () => {
    setError("");
    if (step === 0 && goal === "website" && !/^https?:\/\//i.test(link.trim())) return setError("Enter your website link, starting with https://");
    
    setStep((s) => s + 1);
  };

  const pay = async () => {
    if (!user || busy) return;
    setError("");
    stop.current = false;
    const form = {
      ownerId: user.uid, ownerName: ownerName || user.displayName || "Learn Islam User",
      title: ownerName || user.displayName || "Learn Islam", text: story.caption || "",
      mediaUrl: story.mediaUrl, mediaType: story.type, link: goal === "website" ? link.trim() : "",
      days, amount: total, goal, audience, country: audience === "country" ? country : "", dailyBudget: budget, storyId: story.id,
    };
    try {
      if (!hasPaymentServer) {
        setBusy("Opening payment…");
        const paymentId = await payForAd(total, `Boost story (${days} days)`, user.email, user.displayName);
        await createAd({ ...form, paymentId });
        setDone(true);
        return;
      }
      setBusy("Opening payment…");
      const linkId = await startBrowserPayment(total, `Boost story (${days} days)`, user.email, user.displayName);
      setPending({ linkId, form });
      setBusy("Waiting for your payment… finish it in the browser, then come back.");
      const until = Date.now() + 15 * 60 * 1000;
      while (Date.now() < until && !stop.current) {
        const r = await checkPayment(linkId).catch(() => null);
        if (r?.paid && r.paymentId) {
          await createAd({ ...form, paymentId: r.paymentId });
          setPending(null);
          setDone(true);
          return;
        }
        if (r && (r.status === "expired" || r.status === "cancelled")) { setPending(null); throw new Error("The payment was cancelled or expired."); }
        await new Promise((res) => setTimeout(res, 3000));
      }
      if (!stop.current) setError("Still waiting for the payment. If you already paid, open “Promote with ads” in your menu and your boost will finish saving there.");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const Option = ({ on, onClick, title, sub, extra }: { on: boolean; onClick: () => void; title: string; sub?: string; extra?: any }) => (
    <button onClick={onClick} className="w-full flex items-start gap-3 py-4 text-left">
      <span className="flex-1">
        <span className="block text-lg">{title}</span>
        {sub && <span className="block text-white/60">{sub}</span>}
        {extra}
      </span>
      <span className={`mt-1 w-7 h-7 rounded-full border-2 flex items-center justify-center ${on ? "border-white" : "border-white/40"}`}>{on && <span className="w-3.5 h-3.5 rounded-full bg-white" />}</span>
    </button>
  );

  const titles = ["Goal", "Audience", "Budget & duration", "Review"];

  if (done) {
    return (
      <div className="fixed inset-0 z-[10001] bg-neutral-950 text-white flex flex-col items-center justify-center px-8 text-center">
        <p className="text-5xl mb-4">🚀</p>
        <p className="text-2xl font-semibold mb-2">Payment received</p>
        <p className="text-white/70 mb-8">Your boost is waiting for approval. Once approved, it runs for {days} day{days > 1 ? "s" : ""} between reels.</p>
        <button onClick={onClose} className="w-full max-w-sm rounded-full bg-indigo-500 py-4 font-semibold">Done</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10001] bg-neutral-950 text-white flex flex-col">
      <div className="flex items-center gap-4 px-4 pt-6 pb-3">
        <button onClick={() => (step === 0 ? (stop.current = true, onClose()) : setStep(step - 1))} aria-label="Back">{step === 0 ? <X /> : <ArrowLeft />}</button>
        <h2 className="text-xl font-semibold">{titles[step]}</h2>
      </div>
      <div className="flex gap-2 px-4 mb-4">
        {titles.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-gradient-to-r from-orange-500 to-fuchsia-500" : "bg-white/15"}`} />)}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {step === 0 && (
          <>
            <p className="text-center text-xl font-semibold my-6">What do you want people to do when they see your ad?</p>
            <span className="inline-block text-sm bg-white/10 rounded-full px-3 py-1 mb-1">Recommended</span>
            {GOALS.map((g) => (
              <Option key={g.id} on={goal === g.id} onClick={() => setGoal(g.id)} title={g.title} sub={g.sub}
                extra={g.id === "profile" ? <span className="block text-white/50 text-sm mt-1">@{ownerName}</span> : undefined} />
            ))}
            {goal === "website" && (
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://your-website.com" className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none mt-2" />
            )}
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-center text-xl font-semibold my-6">Who should see your ad?</p>
            <Option on={audience === "all"} onClick={() => setAudience("all")} title="Suggested audience" sub="Shown to everyone on Learn Islam who watches reels" />
            <Option on={audience === "country"} onClick={() => setAudience("country")} title="Create your own" sub={`Only people in ${country === "Unknown" ? "your country" : country}`} />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-center text-xl font-semibold my-6">What's your ad budget?</p>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xl font-semibold flex-1">Total budget</span>
              <span className="text-2xl font-bold">{rupees(PACKAGES[days])}</span>
            </div>
            <input
              type="range" min={BOOST_MIN} max={BOOST_MAX} step={1} value={PACKAGES[days]}
              onChange={(e) => {
                const v = Number(e.target.value);
                const best = DAYS.reduce((p, d) => (Math.abs(PACKAGES[d] - v) < Math.abs(PACKAGES[p] - v) ? d : p), DAYS[0]);
                setDays(best);
              }}
              className="w-full accent-sky-500 transition-all"
            />
            <p className="text-sm text-white/50 mt-1">{days} day{days > 1 ? "s" : ""} for {rupees(PACKAGES[days])}. Pick a duration below and the slider moves for you.</p>
            <p className="text-xl font-semibold mt-8 mb-2">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 rounded-full border ${days === d ? "bg-white text-black border-white" : "border-white/30"}`}>{d} day{d > 1 ? "s" : ""} · {rupees(PACKAGES[d])}</button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-center text-xl font-semibold my-6">Everything look good?</p>
            <div className="space-y-5">
              <div><p className="font-semibold">Goal</p><p className="text-white/60">{goal === "profile" ? `Profile visits to ${ownerName}` : goal === "website" ? `Website visits: ${link}` : "Messages to you"}</p></div>
              <div><p className="font-semibold">Audience</p><p className="text-white/60">{audience === "all" ? "Everyone on Learn Islam" : `People in ${country}`}</p></div>
              <div><p className="font-semibold">Budget &amp; duration</p><p className="text-white/60">{rupees(PACKAGES[days])} total | {days} day{days > 1 ? "s" : ""}</p></div>
              <div className="flex items-center gap-3">
                <span className="flex-1 font-semibold">Preview ad</span>
                {story.type === "video" ? <video src={story.mediaUrl} muted className="w-10 h-14 object-cover rounded" /> : <img src={story.mediaUrl} alt="" className="w-10 h-14 object-cover rounded" />}
              </div>
              <div className="border-t border-white/15 pt-4 space-y-2">
                <p className="text-xl font-semibold">Payment summary</p>
                <p className="flex justify-between"><span className="text-white/70">Ad budget ({days} day{days > 1 ? "s" : ""})</span><span>{rupees(base)}</span></p>
                <p className="flex justify-between font-semibold text-lg"><span>Total</span><span>{rupees(total)}</span></p>
              </div>
              <p className="text-xs text-white/50">Paid securely with Razorpay (UPI, cards, netbanking). Ads are checked before they run; if yours is rejected, contact support for a refund.</p>
            </div>
          </>
        )}
        {error && <p className="text-red-400 mt-4">{error}</p>}
        {busy && <p className="text-white/70 mt-4">{busy}</p>}
      </div>

      <div className="p-4 border-t border-white/10">
        {step < 3 ? (
          <button onClick={next} className="w-full rounded-full bg-indigo-500 py-4 font-semibold">Next</button>
        ) : (
          <button onClick={pay} disabled={!!busy} className="w-full rounded-full bg-indigo-500 py-4 font-semibold disabled:opacity-60">{busy ? "Please wait…" : `Boost story · ${rupees(total)}`}</button>
        )}
      </div>
    </div>
  );
}
