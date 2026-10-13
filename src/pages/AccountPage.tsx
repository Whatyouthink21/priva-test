import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, LogOut, Mail } from 'lucide-react';
import { useAuth, friendlyAuthError } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useTitle } from '../hooks/useTitle';
import { firebaseReady } from '../lib/firebase';
import { paths } from '../lib/routes';

type Mode = 'signin' | 'signup' | 'reset';

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function AccountPage() {
  useTitle('Account');
  const { user, loading, signInGoogle, signInEmail, signUpEmail, resetPassword, signOut } = useAuth();
  const { list, history, cloud } = useLibrary();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      if (ok) setNotice(ok);
      else navigate(paths.library());
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') run(() => signInEmail(email, password));
    if (mode === 'signup') run(() => signUpEmail(name, email, password));
    if (mode === 'reset') run(() => resetPassword(email), 'If an account exists for that address, a reset link is on its way.');
  };

  if (user) {
    return (
      <div className="account container">
        <section className="account__card">
          <div className="account__avatar">
            {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{(user.displayName || user.email || 'P').charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <p className="eyebrow">Signed in</p>
            <h1 className="display display--sm">{user.displayName || 'Welcome back'}</h1>
            <p className="muted">{user.email}</p>
          </div>
          <div className="account__stats">
            <div><b>{list.length}</b><span>Saved</span></div>
            <div><b>{history.length}</b><span>In progress</span></div>
            <div><b>{cloud ? 'On' : 'Off'}</b><span>Cloud sync</span></div>
          </div>
          <div className="account__actions">
            <Link to={paths.library()} className="btn btn--primary"><Bookmark size={16} /> Open My List</Link>
            <button className="btn btn--ghost" onClick={() => signOut()}><LogOut size={16} /> Sign out</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="auth container">
      <section className="auth__intro">
        <p className="eyebrow">Your account</p>
        <h1 className="display">Keep your place, <em>everywhere.</em></h1>
        <p className="muted">
          Save titles to My List and pick up episodes on any device. Without an account, your list and progress stay on this browser.
        </p>
        <ul className="auth__points">
          <li>My List that follows you across devices</li>
          <li>Continue watching with episode-level resume</li>
          <li>Nothing is shared or sold.</li>
        </ul>
      </section>

      <section className="auth__card">
        {!firebaseReady && (
          <div className="notice">Accounts are not configured yet. Add the Firebase web keys to <code>.env.local</code> to enable sign-in. Until then, My List works on this device.</div>
        )}
        <div className="segmented segmented--full" role="tablist">
          <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-on' : ''} onClick={() => setMode('signin')}>Sign in</button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-on' : ''} onClick={() => setMode('signup')}>Create account</button>
        </div>

        {mode !== 'reset' && (
          <button className="btn btn--ghost btn--block" disabled={!firebaseReady || busy || loading} onClick={() => run(() => signInGoogle())}>
            <GoogleGlyph /> Continue with Google
          </button>
        )}
        {mode !== 'reset' && <div className="divider"><span>or with email</span></div>}

        <form className="form" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="How should we greet you?" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
          </label>
          {mode !== 'reset' && (
            <label className="field">
              <span>Password</span>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 6 characters" />
            </label>
          )}
          {error && <p className="form__error" role="alert">{error}</p>}
          {notice && <p className="form__ok" role="status">{notice}</p>}
          <button className="btn btn--primary btn--block" type="submit" disabled={!firebaseReady || busy}>
            <Mail size={16} />
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth__switch">
          {mode === 'signin' && <button className="link-btn" onClick={() => setMode('reset')}>Forgot password?</button>}
          {mode === 'reset' && <button className="link-btn" onClick={() => setMode('signin')}>Back to sign in</button>}
        </div>
      </section>
    </div>
  );
}
