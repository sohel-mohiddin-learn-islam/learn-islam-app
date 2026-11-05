import { useState } from "react";
import { useLocation } from "wouter";
import { deleteUser, sendPasswordResetEmail } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";

export default function AccountsCenter() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [msg, setMsg] = useState("");

  if (!user) {
    setLocation("/login");
    return null;
  }

  const providers = user.providerData.map((p) => (p.providerId === "google.com" ? "Google" : p.providerId === "password" ? "Email & password" : p.providerId));
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  const resetPassword = async () => {
    if (!user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMsg(`A password reset link was sent to ${user.email}.`);
    } catch {
      setMsg("Could not send the reset email. Please try again.");
    }
  };

  const remove = async () => {
    if (!auth.currentUser) return;
    if (!confirm("Delete your account? Your profile will be removed and this cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid)).catch(() => {});
      await deleteUser(auth.currentUser);
      await signOut().catch(() => {});
      setLocation("/");
    } catch (e: any) {
      setMsg(
        e?.code === "auth/requires-recent-login"
          ? "For safety, please log out, sign in again, and then delete your account."
          : "Could not delete the account. Please try again."
      );
    }
  };

  const Item = ({ label, value }: { label: string; value: string }) => (
    <div className="px-4 py-3 border-b border-border">
      <p className="text-xs uppercase text-foreground/60">{label}</p>
      <p className="mt-0.5 break-all">{value || "—"}</p>
    </div>
  );

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">Accounts Center</h1>
        </div>

        <p className="px-4 pt-2 pb-1 text-sm text-foreground/60">Personal details</p>
        <Item label="Name" value={user.displayName || ""} />
        <Item label="Email" value={user.email || ""} />
        <Item label="Account ID" value={user.uid} />

        <p className="px-4 pt-5 pb-1 text-sm text-foreground/60">Password and security</p>
        <Item label="Sign-in method" value={providers.join(", ")} />
        {hasPassword && (
          <button onClick={resetPassword} className="w-full text-left px-4 py-3.5 border-b border-border text-primary font-semibold">
            Change password (email me a link)
          </button>
        )}

        <p className="px-4 pt-5 pb-1 text-sm text-foreground/60">Account ownership and control</p>
        <button onClick={remove} className="w-full text-left px-4 py-3.5 text-red-400 font-semibold">
          Delete account
        </button>

        {msg && <p className="px-4 pt-3 text-sm text-foreground/80">{msg}</p>}
      </div>
    </div>
  );
}
