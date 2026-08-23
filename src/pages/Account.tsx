import { useState } from 'react';
import { useLocation } from 'wouter';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/lib/firebase';

export default function Account() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    setLocation('/login');
    return null;
  }

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        await setDoc(doc(db, 'users', user.uid), { displayName: name }, { merge: true });
      }
      setEditing(false);
    } catch (err) {
      setError('Could not update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Sign out of your account?')) {
      await signOut();
      setLocation('/');
    }
  };

  return (
    <div className="min-h-full bg-background p-6">
      <div className="max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              className="w-20 h-20 rounded-full mb-3"
              alt="Profile"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl mb-3">
              👤
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <label className="text-xs text-foreground/60 font-sans uppercase tracking-wide">
            Name
          </label>
          {editing ? (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg py-2 px-3 font-sans text-foreground"
              />
              {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 font-sans disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setName(user.displayName || ''); }}
                  className="flex-1 bg-muted text-foreground rounded-lg py-2 font-sans"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <p className="font-sans text-foreground">{user.displayName || 'No name set'}</p>
              <button onClick={() => setEditing(true)} className="text-primary text-sm underline">
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <label className="text-xs text-foreground/60 font-sans uppercase tracking-wide">
            Email
          </label>
          <p className="font-sans text-foreground mt-1">{user.email}</p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg py-3 font-serif text-lg"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
        }
