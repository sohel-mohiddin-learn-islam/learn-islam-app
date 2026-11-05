import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { deletePost, getUserPosts, postThumbnail } from "@/lib/posts";
import {
  blockUser,
  follow,
  getRelations,
  muteUser,
  removeFollower,
  getFollowerIds,
  getFollowingIds,
  getProfile,
  isFollowing,
  saveProfile,
  unfollow,
  uploadImage,
  type UserProfile,
} from "@/lib/social";

type Tab = "grid" | "reels" | "followers" | "following";

function Avatar({ src, size = 80 }: { src?: string | null; size?: number }) {
  const [bad, setBad] = useState(false);
  if (src && !bad) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-border"
        onError={() => setBad(true)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2.2 }}
      className="rounded-full bg-muted flex items-center justify-center"
    >
      👤
    </div>
  );
}

function PeopleList({ ids, empty, onRemove }: { ids: string[]; empty: string; onRemove?: (uid: string) => void }) {
  const [, setLocation] = useLocation();
  const [people, setPeople] = useState<UserProfile[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(ids.map((id) => getProfile(id).catch(() => null))).then((p) => {
      if (active) setPeople(p.filter(Boolean) as UserProfile[]);
    });
    return () => {
      active = false;
    };
  }, [ids.join(",")]);

  if (people === null) return <p className="py-10 text-center text-foreground/60 font-sans">Loading…</p>;
  if (people.length === 0) return <p className="py-10 text-center text-foreground/60 font-sans">{empty}</p>;

  return (
    <div className="space-y-1">
      {people.map((p) => (
        <div
          key={p.uid}
          onClick={() => setLocation(`/user/${p.uid}`)}
          className="w-full cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
        >
          <Avatar src={p.photoURL} size={44} />
          <span className="font-sans text-foreground flex-1">{p.displayName}</span>
          {onRemove && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(p.uid);
              }}
              className="px-3 py-1 rounded-lg bg-muted text-sm font-semibold"
            >
              Remove
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProfileView({ uid }: { uid: string }) {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const isOwn = user?.uid === uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [iFollow, setIFollow] = useState(false);
  const [tab, setTab] = useState<Tab>("grid");
  const [note, setNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [menu, setMenu] = useState(false);

  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState("");
  const [eBio, setEBio] = useState("");
  const [eLink, setELink] = useState("");
  const [ePhoto, setEPhoto] = useState<Blob | null>(null);
  const [ePhotoPreview, setEPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [p, ps, fr, fg] = await Promise.all([
      getProfile(uid).catch(() => null),
      getUserPosts(uid).catch(() => []),
      getFollowerIds(uid).catch(() => []),
      getFollowingIds(uid).catch(() => []),
    ]);
    // Own profile: fall back to the signed-in account details until a profile doc exists.
    const base = p || { uid, displayName: "Learn Islam User", photoURL: null, bio: "", link: "" };
    if (isOwn && user) {
      base.displayName = p?.displayName && p.displayName !== "Learn Islam User" ? p.displayName : user.displayName || base.displayName;
      base.photoURL = p?.photoURL || user.photoURL || null;
    }
    const rel = await getRelations(uid).catch(() => null);
    setIsPrivate(!!rel?.isPrivate);
    setProfile(base);
    setPosts((ps as any[]).filter((x) => !x.archived));
    setFollowers(fr);
    setFollowing(fg);
    if (user && !isOwn) setIFollow(await isFollowing(user.uid, uid).catch(() => false));
  }

  useEffect(() => {
    setProfile(null);
    load();
  }, [uid, user?.uid]);

  const totalLikes = useMemo(() => posts.reduce((n, p) => n + (p.likesCount || 0), 0), [posts]);

  if (!profile) {
    return <p className="py-20 text-center text-foreground/60 font-sans">Loading profile…</p>;
  }

  const toggleFollow = async () => {
    if (!user) return setLocation("/login");
    setNote("");
    const next = !iFollow;
    setIFollow(next);
    setFollowers((f) => (next ? [...f, user.uid] : f.filter((x) => x !== user.uid)));
    try {
      next ? await follow(user.uid, uid) : await unfollow(user.uid, uid);
    } catch (e) {
      console.error(e);
      setIFollow(!next);
      setFollowers((f) => (next ? f.filter((x) => x !== user.uid) : [...f, user.uid]));
      setNote("Could not update follow. Please try again.");
    }
  };

  const onRemoveFollower = async (follower: string) => {
    if (!user || !confirm("Remove this follower?")) return;
    try {
      await removeFollower(user.uid, follower);
      setFollowers((f) => f.filter((x) => x !== follower));
    } catch (e) {
      console.error(e);
      setNote("Could not remove the follower. Please try again.");
    }
  };

  const onDeletePost = async (post: any) => {
    if (!user || !confirm("Delete this reel? This cannot be undone.")) return;
    try {
      await deletePost(post.id, user.uid, post.videoUrl);
      setPosts((ps) => ps.filter((x) => x.id !== post.id));
    } catch (e: any) {
      console.error(e);
      setNote(e?.message || "Could not delete the reel. Please try again.");
    }
  };

  const doBlock = async () => {
    if (!user || !confirm(`Block ${profile.displayName}? Their reels will be hidden from you.`)) return;
    await blockUser(user.uid, uid).catch(() => setNote("Could not block. Please try again."));
    if (iFollow) await unfollow(user.uid, uid).catch(() => {});
    setMenu(false);
    setLocation("/reels");
  };

  const doMute = async () => {
    if (!user) return;
    await muteUser(user.uid, uid).catch(() => setNote("Could not mute. Please try again."));
    setNote("Muted. Their reels will not show in your feed.");
    setMenu(false);
  };

  const openEdit = () => {
    setEName(profile.displayName);
    setEBio(profile.bio);
    setELink(profile.link);
    setEPhoto(null);
    setEPhotoPreview(null);
    setError("");
    setEditing(true);
  };

  const pickPhoto = (file?: File | null) => {
    if (!file) return;
    setEPhoto(file);
    setEPhotoPreview(URL.createObjectURL(file));
  };

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      let photoURL = profile.photoURL;
      if (ePhoto) photoURL = await uploadImage(ePhoto);
      const displayName = eName.trim() || profile.displayName;
      await saveProfile(user.uid, { displayName, bio: eBio.trim(), link: eLink.trim(), photoURL });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL: photoURL || undefined }).catch(() => {});
      }
      setProfile({ ...profile, displayName, bio: eBio.trim(), link: eLink.trim(), photoURL });
      setEditing(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    const url = `${import.meta.env.VITE_MEDIA_BASE || "https://sohel-mohiddin-learn-islam.github.io/learn-islam-app/"}user/${uid}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile.displayName, text: `${profile.displayName} on Learn Islam`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNote("Profile link copied.");
      }
    } catch {
      /* user cancelled */
    }
  };

  const grid = (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const thumb = postThumbnail(post);
        return (
          <button
            key={post.id}
            onClick={() => setLocation("/reels")}
            className="relative aspect-[9/16] bg-muted overflow-hidden"
          >
            {thumb && (
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
            <span className="absolute top-1 right-1 text-white text-xs drop-shadow">▶</span>
            {isOwn && (
              <span
                role="button"
                aria-label="Delete reel"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost(post);
                }}
                className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
              >
                🗑
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const stat = (n: number, label: string, t?: Tab) => (
    <button onClick={() => t && setTab(t)} className="text-center">
      <div className="font-bold text-foreground text-lg">{n}</div>
      <div className="text-foreground/70 text-sm">{label}</div>
    </button>
  );

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={`py-3 text-sm font-semibold font-sans ${tab === t ? "border-b-2 border-primary text-primary" : "text-foreground/60"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-10 font-sans">
        {(isOwn || user) && (
          <div className="flex justify-end mb-2 relative">
            {isOwn ? (
              <button onClick={() => setLocation("/settings")} aria-label="Settings" className="text-2xl px-2">⚙️</button>
            ) : (
              <>
                <button onClick={() => setMenu((m) => !m)} aria-label="More" className="text-2xl px-2">⋯</button>
                {menu && (
                  <div className="absolute right-0 top-9 z-20 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <button onClick={doMute} className="block w-full text-left px-4 py-2 hover:bg-muted">Mute</button>
                    <button onClick={doBlock} className="block w-full text-left px-4 py-2 text-red-400 hover:bg-muted">Block</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-5">
          <Avatar src={profile.photoURL} size={84} />
          <div className="flex-1 flex justify-around">
            {stat(posts.length, "posts", "grid")}
            {stat(followers.length, "followers", "followers")}
            {stat(following.length, "following", "following")}
          </div>
        </div>

        <div className="mt-3">
          <p className="font-semibold">{profile.displayName}</p>
          {profile.bio && <p className="text-sm whitespace-pre-line mt-1">{profile.bio}</p>}
          {profile.link && (
            <a
              href={/^https?:\/\//.test(profile.link) ? profile.link : `https://${profile.link}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline break-all"
            >
              🔗 {profile.link}
            </a>
          )}
          {isOwn && user?.email && <p className="text-xs text-foreground/50 mt-1">{user.email}</p>}
        </div>

        {isOwn && (
          <div className="mt-4 rounded-xl bg-muted p-4">
            <p className="font-semibold">Your dashboard</p>
            <p className="text-sm text-foreground/70">
              {posts.length} reels · {followers.length} followers · {totalLikes} likes
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {isOwn ? (
            <>
              <button onClick={openEdit} className="flex-1 bg-muted rounded-lg py-2 font-semibold">
                Edit profile
              </button>
              <button onClick={share} className="flex-1 bg-muted rounded-lg py-2 font-semibold">
                Share profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                className={`flex-1 rounded-lg py-2 font-semibold ${iFollow ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}
              >
                {iFollow ? "Following" : "Follow"}
              </button>
              <button onClick={share} className="flex-1 bg-muted rounded-lg py-2 font-semibold">
                Share profile
              </button>
            </>
          )}
        </div>
        {note && <p className="text-sm text-foreground/70 mt-2">{note}</p>}

        {isOwn && (
          <div className="mt-5 flex gap-4 overflow-x-auto">
            <button onClick={() => setLocation("/create-post")} className="flex flex-col items-center gap-1 shrink-0">
              <span className="w-16 h-16 rounded-full border border-border flex items-center justify-center text-3xl">＋</span>
              <span className="text-xs">New reel</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 border-b border-border mt-5">
          {tabBtn("grid", "Posts")}
          {tabBtn("reels", "Reels")}
          {tabBtn("followers", "Followers")}
          {tabBtn("following", "Following")}
        </div>

        <div className="mt-1">
          {!isOwn && isPrivate && !iFollow ? (
            <p className="py-10 text-center text-foreground/60">🔒 This account is private. Follow to see their reels.</p>
          ) : null}
          {!(!isOwn && isPrivate && !iFollow) && (tab === "grid" || tab === "reels") &&
            (posts.length === 0 ? (
              <p className="py-10 text-center text-foreground/60">
                {isOwn ? "You have not posted any reels yet." : "No reels yet."}
              </p>
            ) : (
              grid
            ))}
          {tab === "followers" && <PeopleList ids={followers} empty="No followers yet." onRemove={isOwn ? onRemoveFollower : undefined} />}
          {tab === "following" && <PeopleList ids={following} empty="Not following anyone yet." />}
        </div>

        {isOwn && (
          <button
            onClick={async () => {
              if (confirm("Sign out of your account?")) {
                await signOut();
                setLocation("/");
              }
            }}
            className="w-full mt-8 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg py-3 font-serif text-lg"
          >
            Sign Out
          </button>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto font-sans">
            <p className="font-semibold text-lg mb-4">Edit profile</p>
            <div className="flex items-center gap-4 mb-4">
              <Avatar src={ePhotoPreview || profile.photoURL} size={64} />
              <label className="text-primary underline cursor-pointer text-sm">
                Change photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              </label>
            </div>
            <label className="text-xs uppercase text-foreground/60">Name</label>
            <input value={eName} onChange={(e) => setEName(e.target.value)} className="w-full bg-muted border border-border rounded-lg py-2 px-3 mb-3" />
            <label className="text-xs uppercase text-foreground/60">Bio</label>
            <textarea value={eBio} onChange={(e) => setEBio(e.target.value)} rows={3} maxLength={150} className="w-full bg-muted border border-border rounded-lg py-2 px-3 mb-3" />
            <label className="text-xs uppercase text-foreground/60">Link</label>
            <input value={eLink} onChange={(e) => setELink(e.target.value)} placeholder="yourwebsite.com" className="w-full bg-muted border border-border rounded-lg py-2 px-3 mb-3" />
            {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving} className="flex-1 bg-muted rounded-lg py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
