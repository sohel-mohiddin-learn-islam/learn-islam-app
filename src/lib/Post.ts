export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  createdAt: number;
  likesCount: number;
  commentsCount: number;
}
