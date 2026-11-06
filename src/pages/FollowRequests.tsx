import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { acceptRequest, declineRequest, getFollowRequests, getProfile, type UserProfile } from "@/lib/social";

export default function FollowRequests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [people, setPeople] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    if (!user) return;
    getFollowRequests(user.uid)
      .then((ids) => Promise.all(ids.map((id) => getProfile(id))))
      .then(setPeople)
      .catch(() => { setPeople([]); setError("Could not load requests."); });
  };
  useEffect(load, [user?.uid]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const act = async (p: UserProfile, accept: boolean) => {
    try {
      if (accept) await acceptRequest(user.uid, p.uid);
      else await declineRequest(user.uid, p.uid);
      setPeople((l) => (l || []).filter((x) => x.uid !== p.uid));
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">Follow requests</h1>
        </div>
        {error && <p className="px-4 text-red-500">{error}</p>}
        {people === null && <p className="p-6 text-foreground/60">Loading…</p>}
        {people && people.length === 0 && <p className="p-6 text-foreground/60">No follow requests.</p>}
        {people?.map((p) => (
          <div key={p.uid} className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setLocation(`/user/${p.uid}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <span className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
              </span>
              <span className="font-semibold truncate">{p.displayName}</span>
            </button>
            <button onClick={() => act(p, true)} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-semibold">Confirm</button>
            <button onClick={() => act(p, false)} className="rounded-lg bg-muted px-4 py-2 font-semibold">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
