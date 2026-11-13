import VerifiedBadge from "@/components/VerifiedBadge";
import { useBackClose } from "@/lib/backButton";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { containsHiddenWord } from "@/lib/prefs";
import { notify } from "@/lib/notifications";

type Comment = { id: string; userId: string; userName: string; text: string; createdAt: any };

export default function CommentsSheet({
  postId,
  postOwnerId,
  thumb,
  onClose,
}: {
  postId: string;
  postOwnerId?: string;
  thumb?: string;
  onClose: () => void;
}) {
  useBackClose(onClose);
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    getDocs(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")))
      .then((s) => setComments(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))))
      .catch((e) => {
        console.error(e);
        setComments([]);
        setError("Could not load comments.");
      });

  useEffect(() => {
    load();
  }, [postId]);

  const send = async () => {
    if (!user || !text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: user.uid,
        userName: user.displayName || "Learn Islam User",
        text: text.trim().slice(0, 500),
        createdAt: serverTimestamp(),
      });
      if (postOwnerId) notify(postOwnerId, user.uid, "comment", { postId, thumb, text: text.trim().slice(0, 120), key: String(Date.now()) });
      setText("");
      await load();
    } catch (e: any) {
      console.error(e);
      setError("Could not post your comment.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Comment) => {
    if (!confirm("Delete this comment?")) return;
    await deleteDoc(doc(db, "posts", postId, "comments", c.id)).catch(() => setError("Could not delete."));
    load();
  };

  const visible = (comments || []).filter((c) => !containsHiddenWord(c.text));
  const hiddenCount = (comments?.length || 0) - visible.length;

  return (
    <div className="fixed inset-0 z-[9990] bg-black/60 flex items-end" onClick={onClose}>
      <div
        className="w-full max-h-[75vh] bg-background text-foreground rounded-t-2xl flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold">Comments {comments ? `(${visible.length})` : ""}</p>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {comments === null && <p className="py-6 text-foreground/60">Loading…</p>}
          {comments && visible.length === 0 && <p className="py-6 text-foreground/60">No comments yet. Be the first.</p>}
          {visible.map((c) => (
            <div key={c.id} className="py-2 flex gap-2">
              <div className="flex-1">
                <span className="font-semibold mr-2">{c.userName}<VerifiedBadge size={13} /></span>
                <span>{c.text}</span>
              </div>
              {user && (c.userId === user.uid || postOwnerId === user.uid) && (
                <button onClick={() => remove(c)} className="text-foreground/50" aria-label="Delete comment">🗑</button>
              )}
            </div>
          ))}
          {hiddenCount > 0 && (
            <p className="text-xs text-foreground/50 py-2">{hiddenCount} comment(s) hidden by your Hidden Words.</p>
          )}
        </div>

        {error && <p className="px-4 text-sm text-red-400">{error}</p>}
        {user ? (
          <div className="flex gap-2 p-3 border-t border-border">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Add a comment…"
              maxLength={500}
              className="flex-1 bg-muted rounded-full px-4 py-2 outline-none"
            />
            <button onClick={send} disabled={busy || !text.trim()} className="text-primary font-semibold px-2 disabled:opacity-40">
              Post
            </button>
          </div>
        ) : (
          <p className="p-4 text-center text-foreground/60">Sign in to comment.</p>
        )}
      </div>
    </div>
  );
}
