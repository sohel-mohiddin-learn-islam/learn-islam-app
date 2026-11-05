import { useRoute } from 'wouter';
import ProfileView from '@/components/ProfileView';

export default function UserProfile() {
  const [, params] = useRoute('/user/:uid');
  if (!params?.uid) return null;
  return <ProfileView uid={params.uid} />;
}
