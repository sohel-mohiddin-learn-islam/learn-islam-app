import { useEffect, useState } from 'react';

// Add Instagram reel URLs here — just paste the reel link.
const reels: { id: string; url: string; caption: string }[] = [
  { id: '1', url: 'https://www.instagram.com/reel/DcYEyF9CIeR/', caption: '' },
  { id: '2', url: 'https://www.instagram.com/reel/DcJSDx7JHZA/', caption: '' },
  { id: '3', url: 'https://www.instagram.com/reel/Dc6VmYKu9-9/', caption: '' },
  { id: '4', url: 'https://www.instagram.com/reel/Dc3-mnjhP7M/', caption: '' },
  { id: '5', url: 'https://www.instagram.com/reel/Dc6TUzMoSG8/', caption: '' },
];

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function useInstagramEmbed() {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(script);
  }, []);
}

function getLikeState(id: string) {
  const raw = localStorage.getItem(`reel-like-${id}`);
  return raw === '1';
}

function getComments(id: string): string[] {
  const raw = localStorage.getItem(`reel-comments-${id}`);
  return raw ? JSON.parse(raw) : [];
}

function ReelCard({ reel }: { reel: { id: string; url: string; caption: string } }) {
  const [liked, setLiked] = useState(() => getLikeState(reel.id));
  const [comments, setComments] = useState<string[]>(() => getComments(reel.id));
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    localStorage.setItem(`reel-like-${reel.id}`, next ? '1' : '0');
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    const next = [...comments, commentText.trim()];
    setComments(next);
    localStorage.setItem(`reel-comments-${reel.id}`, JSON.stringify(next));
    setCommentText('');
  };

  return (
    <div className="mb-6 bg-card rounded-2xl overflow-hidden border border-border">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={reel.url}
        data-instgrm-version="14"
        style={{ width: '100%', margin: 0 }}
      />
      {reel.caption && (
        <p className="px-4 pt-2 text-sm text-foreground/80 font-sans">{reel.caption}</p>
      )}
      <div className="flex items-center gap-4 px-4 py-3">
        <button onClick={toggleLike} className="flex items-center gap-1 text-sm">
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-sm">
          💬 <span>{comments.length} Comments</span>
        </button>
      </div>
      {showComments && (
        <div className="px-4 pb-4">
          <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
            {comments.map((c, i) => (
              <p key={i} className="text-sm bg-muted rounded-lg px-3 py-1.5">{c}</p>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-muted rounded-full px-3 py-1.5 text-sm border border-border"
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <button onClick={addComment} className="text-sm text-primary font-medium px-2">Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reels() {
  useInstagramEmbed();

  if (reels.length === 0) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center p-6">
        <p className="text-center text-foreground/70 font-sans">
          No reels available yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-3 bg-background">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
