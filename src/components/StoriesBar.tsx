import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowingIds, getProfile, type UserProfile } from "@/lib/social";
import { getStories, hasUnseen, type Story } from "@/lib/stories";
import StoryViewer from "./StoryViewer";

type Entry = { profile: UserProfile; stories: Story[] };

export default function StoriesBar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState<Entry | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const ids = await getFollowingIds(user.uid).catch(() => []);
      const owners = [user.uid, ...ids];
      const list = await Promise.all(
        owners.map(async (id) => {
          const stories = await getStories(id);
          if (!stories.length) return null;
          return { profile: await getProfile(id), stories } as Entry;
        })
      );
      if (active) setEntries(list.filter(Boolean) as Entry[]);
    })();
    return () => {
      active = false;
    };
  }, [user?.uid, tick]);

  if (!user) return null;

  const mine = entries.find((e) => e.profile.uid === user.uid);
  const others = entries.filter((e) => e.profile.uid !== user.uid);

  const ring = (e: Entry) =>
    hasUnseen(e.profile.uid, Math.max(...e.stories.map((s) => s.createdAt)))
      ? "border-2 border-emerald-500"
      : "border-2 border-border";

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 py-3 font-sans">
        <div className="flex flex-col items-center shrink-0 w-16">
          <button
            onClick={() => (mine ? setOpen(mine) : setLocation("/create-story"))}
            className={`w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-2xl ${mine ? ring(mine) : "border-2 border-dashed border-border"}`}
          >
            {mine?.profile.photoURL || user.photoURL ? (
              <img src={mine?.profile.photoURL || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
            ) : (
              "＋"
            )}
          </button>
          <button onClick={() => setLocation("/create-story")} className="text-xs mt-1 text-primary">
            {mine ? "Add story" : "Your story"}
          </button>
        </div>

        {others.map((e) => (
          <button key={e.profile.uid} onClick={() => setOpen(e)} className="flex flex-col items-center shrink-0 w-16">
            <span className={`w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center ${ring(e)}`}>
              {e.profile.photoURL ? <img src={e.profile.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
            </span>
            <span className="text-xs mt-1 truncate w-full text-center">{e.profile.displayName}</span>
          </button>
        ))}
      </div>

      {open && (
        <StoryViewer
          ownerName={open.profile.displayName}
          stories={open.stories}
          onClose={() => {
            setOpen(null);
            setTick((t) => t + 1);
          }}
          onChanged={() => setTick((t) => t + 1)}
        />
      )}
    </>
  );
}
