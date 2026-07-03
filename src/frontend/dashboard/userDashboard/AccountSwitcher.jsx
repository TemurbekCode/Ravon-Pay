import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';

// ============================================
// HISOB ALMASHTIRGICH
// Faqat ikkala hisobi bor (hasBoth) foydalanuvchilarga ko'rinadi.
// "Shaxsiy" <-> "Business" o'rtasida o'tib-qaytadi.
// ============================================
export default function AccountSwitcher() {
    const { user, hasBoth, switchAccount } = useAuth();
    const navigate = useNavigate();

    if (!hasBoth) return null;

    const current = user?.accountType || 'personal';

    const go = async (type) => {
        if (type === current) return;
        await switchAccount(type);
        navigate(type === 'business' ? '/business' : '/dashboard');
    };

    return (
        <div className="acc-switch">
            <button
                className={`acc-opt ${current === 'personal' ? 'active' : ''}`}
                onClick={() => go('personal')}
                title="Shaxsiy hisob"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                <span>Shaxsiy</span>
            </button>
            <button
                className={`acc-opt ${current === 'business' ? 'active' : ''}`}
                onClick={() => go('business')}
                title="Business hisob"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M16 12h.01M3 9h18" /></svg>
                <span>Business</span>
            </button>
        </div>
    );
}