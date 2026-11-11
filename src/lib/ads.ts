import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "./firebase";

// Razorpay Key ID is a public key and is safe to ship in the app. The Key Secret is never used here.
export const RAZORPAY_KEY_ID = "rzp_live_TMRe5v9zAXb2yJ";
export const ADMIN_EMAIL = "vvvv04431@gmail.com";
export const PRICE_PER_DAY = 50; // rupees

export type Ad = {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  text: string;
  mediaUrl: string;
  mediaType: "video" | "image";
  link: string;
  days: number;
  amount: number;
  paymentId: string;
  goal?: "profile" | "website" | "message";
  audience?: "all" | "country";
  country?: string;
  dailyBudget?: number;
  storyId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  endsAt: number;
};

function loadRazorpay(): Promise<any> {
  const w = window as any;
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("Payment window could not load.")));
    s.onerror = () => reject(new Error("Could not load the payment window. Check your internet."));
    document.body.appendChild(s);
  });
}

const WORKER = ((import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "").replace(/\/$/, "");
const PENDING = "pending-ad-payment";

async function authedPost(path: string, body: any) {
  const t = await auth.currentUser?.getIdToken();
  if (!t) throw new Error("Please sign in first.");
  const r = await fetch(`${WORKER}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Payment server error.");
  return j;
}

export type PendingAd = { linkId: string; form: Omit<Ad, "id" | "status" | "createdAt" | "endsAt" | "paymentId"> };
export const getPending = (): PendingAd | null => { try { return JSON.parse(localStorage.getItem(PENDING) || "null"); } catch { return null; } };
export const setPending = (p: PendingAd | null) => { try { p ? localStorage.setItem(PENDING, JSON.stringify(p)) : localStorage.removeItem(PENDING); } catch { /* ignore */ } };

/** Starts a payment in the phone's browser (UPI apps like PhonePe work there). Returns the link id. */
export async function startBrowserPayment(amountRupees: number, description: string, email?: string | null, name?: string | null): Promise<string> {
  const { id, url } = await authedPost("/pay/create", { amount: amountRupees, description, email, name });
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch {
    window.open(url, "_blank");
  }
  return id;
}

/** Asks the server whether the payment link was paid. */
export async function checkPayment(linkId: string): Promise<{ paid: boolean; paymentId: string | null; status: string }> {
  return authedPost("/pay/status", { id: linkId });
}

/** True when the secure payment server is available. */
export const hasPaymentServer = !!WORKER;

/** Opens Razorpay checkout. Resolves with the payment id once paid. */
export async function payForAd(amountRupees: number, description: string, email?: string | null, name?: string | null): Promise<string> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      name: "Learn Islam",
      description,
      prefill: { email: email || "", name: name || "" },
      theme: { color: "#7c3aed" },
      handler: (r: any) => resolve(r.razorpay_payment_id),
      modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
    });
    rzp.on?.("payment.failed", (r: any) => reject(new Error(r?.error?.description || "Payment failed.")));
    rzp.open();
  });
}

export async function createAd(ad: Omit<Ad, "id" | "status" | "createdAt" | "endsAt">) {
  await addDoc(collection(db, "ads"), { ...ad, status: "pending", createdAt: Date.now(), endsAt: 0 });
}

export async function getActiveAds(): Promise<Ad[]> {
  const snap = await getDocs(query(collection(db, "ads"), where("status", "==", "approved")));
  const now = Date.now();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Ad)).filter((a) => a.endsAt > now);
}

export async function getMyAds(uid: string): Promise<Ad[]> {
  const snap = await getDocs(query(collection(db, "ads"), where("ownerId", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Ad)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllAds(): Promise<Ad[]> {
  const snap = await getDocs(collection(db, "ads"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Ad)).sort((a, b) => b.createdAt - a.createdAt);
}

export const approveAd = (ad: Ad) =>
  updateDoc(doc(db, "ads", ad.id), { status: "approved", endsAt: Date.now() + ad.days * 86400000 });
export const rejectAd = (ad: Ad) => updateDoc(doc(db, "ads", ad.id), { status: "rejected" });
export const removeAd = (id: string) => deleteDoc(doc(db, "ads", id));
