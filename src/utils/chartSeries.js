// Haqiqiy tranzaksiyalar asosida grafik uchun vaqt seriyasi yasaydi.
// Tranzaksiyalar eng yangisi birinchi bo'lib saqlanadi — shu tartibni teskari
// aylantirib, xronologik ravishda "buckets" ta bo'lakka taqsimlaydi va har bir
// bo'lak ustida kumulyativ yig'indi hisoblaydi. Hisobda hali tranzaksiya
// bo'lmasa — natija hammasi 0 (grafik pastda tekis chiziq bo'lib boshlanadi).
export function buildIncomeExpenseSeries(transactions, buckets) {
  const income = new Array(buckets).fill(0);
  const expense = new Array(buckets).fill(0);
  const chrono = [...transactions].reverse();
  chrono.forEach((tx, i) => {
    const b = Math.min(buckets - 1, Math.floor((i / chrono.length) * buckets));
    if (tx.amount >= 0) income[b] += tx.amount;
    else expense[b] += Math.abs(tx.amount);
  });
  let ci = 0;
  let ce = 0;
  return { income: income.map((v) => (ci += v)), expense: expense.map((v) => (ce += v)) };
}

export function buildRevenueSeries(transactions, buckets) {
  const rev = new Array(buckets).fill(0);
  const chrono = [...transactions].reverse().filter((tx) => tx.in);
  chrono.forEach((tx, i) => {
    const b = Math.min(buckets - 1, Math.floor((i / chrono.length) * buckets));
    rev[b] += tx.amount;
  });
  let c = 0;
  return rev.map((v) => (c += v));
}
