import { useEffect } from 'react';

// `.reveal` elementlarni ko'rinish maydoniga kirganda `.visible` qilib ochadi.
// MutationObserver DOM'ga keyinroq (masalan, ma'lumot asinxron yuklanganda yoki
// forma ochilganda) qo'shilgan yangi `.reveal` elementlarni ham avtomatik kuzatadi —
// faqat route almashganda emas.
export function useReveal(deps = []) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const observeNew = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));
    };
    observeNew();

    const mo = new MutationObserver(observeNew);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
