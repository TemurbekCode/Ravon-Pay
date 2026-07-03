import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme.js';
import { useLanguage } from '../../hooks/useLanguage.js';
import { LANDING_I18N } from './landing.i18n.js';
import './Landing.scss';

export default function Landing() {
    const { theme, toggleTheme } = useTheme();
    const { lang, setLang } = useLanguage();
    const [scrolled, setScrolled] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef(null);

    const t = (key) => LANDING_I18N[lang]?.[key] ?? LANDING_I18N.uz[key] ?? key;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const close = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
                });
            },
            { threshold: 0.12 }
        );
        document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [lang]);

    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    const LANGS = [
        { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
        { code: 'en', flag: '🇬🇧', label: 'English' },
        { code: 'ru', flag: '🇷🇺', label: 'Русский' },
    ];

    return (
        <div className="landing-root">
            {/* ============ NAVBAR ============ */}
            <nav className={`l-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="l-container l-nav-inner">
                    <Link to="/" className="l-logo">
                        <span className="l-logo-mark">
                            <img src="/RavonPayLogoBr.png" alt="RavonPay" />
                        </span>
                        Ravon<span className="gradient-text">Pay</span>
                    </Link>

                    <div className="l-nav-links">
                        <a onClick={() => scrollTo('features')}>{t('nav.features')}</a>
                        <a onClick={() => scrollTo('how')}>{t('nav.how')}</a>
                        <a onClick={() => scrollTo('audience')}>{t('nav.who')}</a>
                        <a onClick={() => scrollTo('pricing')}>{t('nav.pricing')}</a>
                    </div>

                    <div className="l-nav-actions">
                        <div className={`l-lang ${langOpen ? 'open' : ''}`} ref={langRef}>
                            <button className="l-lang-btn" onClick={(e) => { e.stopPropagation(); setLangOpen((o) => !o); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                                </svg>
                                <span>{(lang || "uz").toUpperCase()}</span>
                                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            <div className="l-lang-menu">
                                {LANGS.map((l) => (
                                    <button key={l.code} className={lang === l.code ? 'active' : ''}
                                        onClick={() => { setLang(l.code); setLangOpen(false); }}>
                                        <span className="flag">{l.flag}</span> {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="l-icon-btn" onClick={toggleTheme} aria-label="Theme">
                            {theme === 'dark' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                                </svg>
                            )}
                        </button>

                        <Link to="/register" className="l-btn l-btn-primary l-nav-cta">{t('nav.cta')}</Link>

                        <button className="l-icon-btn l-menu-btn" onClick={() => scrollTo('features')} aria-label="Menu">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ============ HERO ============ */}
            <header className="l-hero">
                <div className="l-hero-glow" />
                <div className="l-container l-hero-inner">
                    <div className="l-hero-copy">
                        <span className="l-eyebrow"><span className="dot" />{t('hero.badge')}</span>
                        <h1 dangerouslySetInnerHTML={{ __html: t('hero.title') }} />
                        <p className="l-hero-sub">{t('hero.sub')}</p>
                        <div className="l-hero-btns">
                            <Link to="/register" className="l-btn l-btn-primary">
                                {t('hero.cta1')}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                            </Link>
                            <a onClick={() => scrollTo('how')} className="l-btn l-btn-ghost">{t('hero.cta2')}</a>
                        </div>
                        <div className="l-hero-trust">
                            <div className="l-trust-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
                                <span>{t('hero.t1')}</span>
                            </div>
                            <div className="l-trust-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
                                <span>{t('hero.t2')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="l-hero-visual">
                        <div className="l-float-badge b1">
                            <span className="ico" style={{ background: 'rgba(16,185,129,0.15)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M12 5v14m-7-7 7 7 7-7" /></svg>
                            </span>
                            <span>{t('hero.badgeIn')}</span>
                        </div>

                        <div className="l-pay-card">
                            <div className="l-pay-top">
                                <div>
                                    <div className="l-pay-label">{t('hero.cardLabel')}</div>
                                    <div className="l-pay-balance">12 480 000<span> so'm</span></div>
                                </div>
                                <div className="l-pay-chip" />
                            </div>
                            <div className="l-pay-row">
                                <span className="l-pay-icon in">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>
                                </span>
                                <div className="l-pay-info">
                                    <div className="l-pay-name">{t('hero.r1n')}</div>
                                    <div className="l-pay-time">{t('hero.r1t')}</div>
                                </div>
                                <div className="l-pay-amt in">+1 200 000</div>
                            </div>
                            <div className="l-pay-row">
                                <span className="l-pay-icon out">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m7-7-7 7-7-7" /></svg>
                                </span>
                                <div className="l-pay-info">
                                    <div className="l-pay-name">{t('hero.r2n')}</div>
                                    <div className="l-pay-time">{t('hero.r2t')}</div>
                                </div>
                                <div className="l-pay-amt">−350 000</div>
                            </div>
                        </div>

                        <div className="l-float-badge b2">
                            <span className="ico" style={{ background: 'rgba(99,102,241,0.15)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5">
                                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
                                </svg>
                            </span>
                            <span>{t('hero.badgePaid')}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============ LOGOS ============ */}
            <section className="l-logos">
                <div className="l-container">
                    <p className="l-logos-label">{t('logos.label')}</p>
                </div>
                <div className="l-logos-track">
                    {['Visa', 'Mastercard', 'Humo', 'Uzcard', 'SWIFT', 'USDT', 'Visa', 'Mastercard', 'Humo', 'Uzcard', 'SWIFT', 'USDT'].map((n, i) => (
                        <span key={i}>{n}</span>
                    ))}
                </div>
            </section>

            {/* ============ FEATURES ============ */}
            <section className="l-section" id="features">
                <div className="l-container">
                    <div className="l-section-head reveal">
                        <span className="l-eyebrow">{t('feat.eyebrow')}</span>
                        <h2 className="l-section-title">{t('feat.title')}</h2>
                        <p className="l-section-sub">{t('feat.sub')}</p>
                    </div>
                    <div className="l-features-grid">
                        {[
                            { t: 'feat.f1t', d: 'feat.f1d', icon: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></> },
                            { t: 'feat.f2t', d: 'feat.f2d', icon: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" /></> },
                            { t: 'feat.f3t', d: 'feat.f3d', icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></> },
                            { t: 'feat.f4t', d: 'feat.f4d', icon: <><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 5-5" /></> },
                            { t: 'feat.f5t', d: 'feat.f5d', icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></> },
                            { t: 'feat.f6t', d: 'feat.f6d', icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></> },
                        ].map((f) => (
                            <div className="l-feature-card reveal" key={f.t}>
                                <div className="l-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.icon}</svg>
                                </div>
                                <h3>{t(f.t)}</h3>
                                <p>{t(f.d)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ HOW IT WORKS ============ */}
            <section className="l-section" id="how">
                <div className="l-container">
                    <div className="l-section-head reveal">
                        <span className="l-eyebrow">{t('how.eyebrow')}</span>
                        <h2 className="l-section-title">{t('how.title')}</h2>
                        <p className="l-section-sub">{t('how.sub')}</p>
                    </div>
                    <div className="l-steps">
                        {[
                            { n: '01', t: 'how.s1t', d: 'how.s1d' },
                            { n: '02', t: 'how.s2t', d: 'how.s2d' },
                            { n: '03', t: 'how.s3t', d: 'how.s3d' },
                        ].map((s) => (
                            <div className="l-step reveal" key={s.n}>
                                <div className="l-step-num">{s.n}</div>
                                <h3>{t(s.t)}</h3>
                                <p>{t(s.d)}</p>
                                <span className="l-step-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ AUDIENCE ============ */}
            <section className="l-section" id="audience">
                <div className="l-container">
                    <div className="l-section-head reveal">
                        <span className="l-eyebrow">{t('aud.eyebrow')}</span>
                        <h2 className="l-section-title">{t('aud.title')}</h2>
                    </div>
                    <div className="l-audience">
                        <div className="l-aud-card featured reveal">
                            <span className="l-aud-tag">💼 <span>{t('aud.c1tag')}</span></span>
                            <h3>{t('aud.c1t')}</h3>
                            <p>{t('aud.c1d')}</p>
                            <ul className="l-aud-list">
                                {['aud.c1l1', 'aud.c1l2', 'aud.c1l3'].map((k) => (
                                    <li key={k}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                                        <span>{t(k)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="l-aud-card reveal">
                            <span className="l-aud-tag">👤 <span>{t('aud.c2tag')}</span></span>
                            <h3>{t('aud.c2t')}</h3>
                            <p>{t('aud.c2d')}</p>
                            <ul className="l-aud-list">
                                {['aud.c2l1', 'aud.c2l2', 'aud.c2l3'].map((k) => (
                                    <li key={k}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                                        <span>{t(k)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section className="l-section" id="pricing">
                <div className="l-container">
                    <div className="l-cta-banner reveal">
                        <h2>{t('cta.title')}</h2>
                        <p>{t('cta.sub')}</p>
                        <Link to="/register" className="l-btn l-btn-white">{t('cta.btn')}</Link>
                    </div>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="l-footer">
                <div className="l-container">
                    <div className="l-footer-grid">
                        <div className="l-footer-brand">
                            <Link to="/" className="l-logo">
                                <span className="l-logo-mark">
                                    <img src="/RavonPayLogoBr.png" alt="RavonPay" />
                                </span>
                                Ravon<span className="gradient-text">Pay</span>
                            </Link>
                            <p>{t('foot.tag')}</p>
                        </div>
                        <div className="l-footer-col">
                            <h4>{t('foot.product')}</h4>
                            <a onClick={() => scrollTo('features')}>{t('nav.features')}</a>
                            <a onClick={() => scrollTo('pricing')}>{t('nav.pricing')}</a>
                            <a>{t('foot.api')}</a>
                            <a>{t('foot.security')}</a>
                        </div>
                        <div className="l-footer-col">
                            <h4>{t('foot.company')}</h4>
                            <a>{t('foot.about')}</a>
                            <a>{t('foot.blog')}</a>
                            <a>{t('foot.careers')}</a>
                            <a>{t('foot.contact')}</a>
                        </div>
                        <div className="l-footer-col">
                            <h4>{t('foot.legal')}</h4>
                            <a>{t('foot.privacy')}</a>
                            <a>{t('foot.terms')}</a>
                            <a>{t('foot.compliance')}</a>
                        </div>
                    </div>
                    <div className="l-footer-bottom">
                        <p>© 2026 RavonPay. <span>{t('foot.rights')}</span></p>
                        <div className="l-footer-social">
                            <a className="l-icon-btn" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 3 2 10.5l5.5 2L9 19l3-3.5 5 4L22 3Z" /></svg></a>
                            <a className="l-icon-btn" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></a>
                            <a className="l-icon-btn" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM0 8h5v16H0V8Zm7.5 0h4.8v2.2h.07c.67-1.2 2.3-2.5 4.73-2.5 5 0 5.9 3.3 5.9 7.6V24h-5v-7c0-1.7 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7V24h-5V8Z" /></svg></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}