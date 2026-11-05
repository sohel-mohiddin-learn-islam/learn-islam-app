import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import ProfileView from '@/components/ProfileView';

export default function Account() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation('/login');
    return null;
  }

  return <ProfileView uid={user.uid} />;
}
