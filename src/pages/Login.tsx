import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    setLocation('/');
    return null;
  }

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      setLocation('/');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      setLocation('/');
    } catch (err) {
      setError(
        mode === 'signin'
          ? 'Could not sign in. Check your email and password.'
          : 'Could not create account. Password must be at least 6 characters.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-primary mb-1">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-foreground/70 font-sans">
            Sign in to save your favorites and more
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-lg py-3 px-4 font-sans text-foreground hover:bg-card/80 transition-colors disabled:opacity-50 mb-4"
        >
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-foreground/50 text-sm font-sans">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-lg py-3 px-4 font-sans text-foreground placeholder:text-foreground/40"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-border rounded-lg py-3 px-4 font-sans text-foreground placeholder:text-foreground/40"
          />

          {error && (
            <p className="text-sm text-red-400 font-sans">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-serif text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-foreground/70 font-sans text-sm">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            className="text-primary underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
