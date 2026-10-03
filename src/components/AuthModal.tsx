import React, { useState } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail 
} from '../firebase';
import { X, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        const user = await signInWithEmail(email, password);
        onSuccess(user);
        onClose();
      } else {
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const user = await registerWithEmail(email, password, displayName);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
      <div 
        className="glass-panel bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-zinc-200/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">
                {mode === 'signin' ? 'Sign In to Your Account' : 'Create an Account'}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {mode === 'signin' 
                ? 'Save your financial plan securely and access it from any device.' 
                : 'Get out of guest mode and store your financial independence roadmaps.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg flex items-start gap-2 text-xs text-zinc-800">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google 1-Click Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/80 hover:bg-white border border-zinc-300/80 rounded-xl text-xs font-semibold text-zinc-700 shadow-xs transition-all cursor-pointer disabled:opacity-60 backdrop-blur-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-zinc-200/80 flex-1"></div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">or with email</span>
            <div className="h-px bg-zinc-200/80 flex-1"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anthony Castro"
                  className="w-full text-xs px-3 py-2 border border-zinc-300/80 bg-white/70 backdrop-blur-xs rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-300/80 bg-white/70 backdrop-blur-xs rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-300/80 bg-white/70 backdrop-blur-xs rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'signin' ? 'Sign In to Account' : 'Create Cloud Account'}</span>
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="pt-2 text-center text-xs text-zinc-500">
            {mode === 'signin' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
