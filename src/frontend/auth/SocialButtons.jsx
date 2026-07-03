import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const existing = document.getElementById('google-identity-script');
    if (existing) { existing.addEventListener('load', () => resolve(), { once: true }); return; }
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google skripti yuklanmadi'));
    document.head.appendChild(script);
  });
}

// Google + Telegram bilan kirish tugmalari
export default function SocialButtons({ onClick }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google orqali kirish hali sozlanmagan (.env faylida VITE_GOOGLE_CLIENT_ID kerak)");
      return;
    }
    setError('');
    setBusy(true);
    try {
      await loadGoogleScript();
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (resp) => {
          try {
            if (!resp.access_token) throw new Error('Google tokeni olinmadi');
            const res = await loginWithGoogle(resp.access_token);
            navigate(res.user?.accountType === 'business' ? '/business' : '/dashboard');
          } catch (err) {
            setError(err.message || 'Google orqali kirishda xatolik');
          } finally {
            setBusy(false);
          }
        },
        error_callback: () => setBusy(false),
      });
      client.requestAccessToken();
    } catch (err) {
      setError(err.message || 'Google orqali kirishda xatolik');
      setBusy(false);
    }
  };

  const handleTelegram = () => { if (onClick) onClick('Telegram'); };

  return (
    <>
      <div className="socials">
        <button type="button" className="social-btn" onClick={handleGoogle} disabled={busy}>
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.5 12.2c0-.8-.07-1.4-.2-2H12v3.8h5.9c-.12 1-.76 2.5-2.2 3.5l-.02.13 3.2 2.48.22.02c2-1.87 3.2-4.6 3.2-7.9Z" />
            <path fill="#34A853" d="M12 23c2.9 0 5.3-.95 7.07-2.6l-3.37-2.6c-.9.62-2.1 1.06-3.7 1.06-2.83 0-5.23-1.87-6.08-4.45l-.13.01-3.32 2.57-.04.12C4.18 20.5 7.8 23 12 23Z" />
            <path fill="#FBBC05" d="M5.92 14.4c-.22-.65-.35-1.35-.35-2.07 0-.72.13-1.42.34-2.07l-.006-.14L2.54 7.53l-.11.05A11 11 0 0 0 1.27 12.3c0 1.77.43 3.45 1.16 4.93l3.49-2.83Z" />
            <path fill="#EA4335" d="M12 5.5c2 0 3.36.87 4.13 1.6l3.02-2.95C17.3 2.42 14.9 1.5 12 1.5 7.8 1.5 4.18 4 2.43 7.6l3.48 2.7C6.77 7.37 9.17 5.5 12 5.5Z" />
          </svg>
          {busy ? '...' : 'Google'}
        </button>
        <button type="button" className="social-btn" onClick={handleTelegram}>
          <svg viewBox="0 0 24 24">
            <path fill="#29A9EB" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.64 6.8-1.56 7.36c-.12.52-.42.65-.85.4l-2.35-1.73-1.13 1.1c-.13.12-.23.22-.47.22l.17-2.4 4.36-3.94c.19-.17-.04-.26-.3-.1L9.6 13.06l-2.32-.72c-.5-.16-.5-.5.11-.74l9.06-3.5c.42-.15.78.1.65.7Z" />
          </svg>
          Telegram
        </button>
      </div>
      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}
    </>
  );
}
