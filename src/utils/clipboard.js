// navigator.clipboard faqat "secure context"da (https yoki localhost) ishlaydi —
// telefonda mahalliy tarmoq IP orqali (http://192.168.x.x) sinalganda u mavjud
// bo'lmaydi va yozish jimgina hech narsa qilmay muvaffaqiyatsiz tugaydi, lekin
// chaqiruvchi kod buni sezmay "Nusxalandi!" deb ko'rsatishda davom etardi.
// Shu yerda ikkala holatni ham qamrab, HAQIQIY natijani qaytaradi.
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* ba'zi brauzerlarda ruxsat rad etilishi mumkin — pastdagi zaxiraga o'tamiz */ }
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
