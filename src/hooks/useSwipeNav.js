import { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Instagram-uslubidagi "sahifalar orasida yon tomonga surish" — `stops` ro'yxatida
// ketma-ket bekatlar beriladi ({ route } yoki { modal: true }, masalan "Sozlamalar"
// haqiqiy sahifa emas, modal bo'lgani uchun). Joriy sahifa shu ro'yxatda bo'lmasa
// (masalan Wallet/Send kabi ro'yxatga kirmagan sahifalarda), hech narsa qilmaydi.
//
// Faqat touchstart/touchend'ni solishtiradi (touchmove kuzatilmaydi) — shuning
// uchun sahifaning oddiy vertikal scroll'iga umuman ta'sir qilmaydi, faqat
// yetarlicha uzun va aniq GORIZONTAL harakatni tutib qoladi.
const SWIPE_THRESHOLD = 60;
const DIRECTION_RATIO = 1.4;

export function useSwipeNav(stops, onOpenModal) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const start = useRef(null);

  const activeIndex = stops.findIndex((s) => s.route === pathname);

  const onTouchStart = useCallback((e) => {
    // Ichida o'zining gorizontal scroll'i bor elementlar (jadval, input) ustida
    // boshlangan teginish sahifa almashtirish bilan chalkashib ketmasligi kerak.
    if (e.target.closest?.('.tbl-wrap, input, textarea, select')) { start.current = null; return; }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!start.current || activeIndex === -1) { start.current = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return;

    const target = stops[dx < 0 ? activeIndex + 1 : activeIndex - 1];
    if (!target) return;
    if (target.modal) onOpenModal?.();
    else navigate(target.route);
  }, [activeIndex, stops, navigate, onOpenModal]);

  return { onTouchStart, onTouchEnd };
}
