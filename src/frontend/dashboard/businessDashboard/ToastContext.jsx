import { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext.js';

// Toast (xabar) tizimi — o'ng pastda chiqadigan bildirishnomalar
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, msg, show: false }]);
    requestAnimationFrame(() => setToasts((ts) => ts.map((t) => t.id === id ? { ...t, show: true } : t)));
    setTimeout(() => {
      setToasts((ts) => ts.map((t) => t.id === id ? { ...t, show: false } : t));
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 400);
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.show ? 'show' : ''}`}>
            <span className="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg></span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
