// Boshlang'ich (oy boshidagi baseline) qiymatga nisbatan haqiqiy % o'zgarish —
// Bosh sahifa balansi va Biznes KPI kartalarining barchasi shu bitta funksiyadan
// foydalanadi (ilgari har bir sahifada alohida-alohida nusxalangan edi).
export function pctChange(current, base) {
  if (!base) return 0;
  return Math.round(((current - base) / base) * 1000) / 10;
}

// "Konversiya" — yuborilgan fakturalarning necha foizi haqiqatan to'langanini
// ko'rsatadi. Havola/checkout sahifa TASHRIFLARINI hali hech kim kuzatmaydi
// (ular hozircha 0 bo'lib qoladi), shuning uchun haqiqiy hisoblab bo'ladigan
// yagona "konversiya" — fakturalar bo'yicha to'lov darajasi.
export function invoiceConversionRate(invoices) {
  if (!invoices?.length) return 0;
  const paid = invoices.filter((i) => i.status === 'done').length;
  return Math.round((paid / invoices.length) * 1000) / 10;
}
