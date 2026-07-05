// Click Merchant API integratsiyasi (https://docs.click.uz).
// Ishlashi uchun quyidagi .env qiymatlari kerak: CLICK_SERVICE_ID, CLICK_MERCHANT_ID,
// CLICK_SECRET_KEY.
//
// 1) createTopUpCheckout — foydalanuvchini Click to'lov sahifasiga yo'naltirish
//    uchun havola yaratadi.
// 2) Webhook (handleClickWebhook) — Click serveringizga ikki bosqichda murojaat
//    qiladi: Prepare (action=0, to'lovni tasdiqlashdan oldin) va Complete
//    (action=1, to'lov haqiqatan amalga oshgach). Imzo (sign_string) MD5 orqali
//    tekshiriladi. Aniq maydonlar tartibi Click sandbox'ida sertifikatlashdan
//    oldin rasmiy hujjat bilan qayta tekshirilishi tavsiya etiladi.
import { createHash } from 'node:crypto';
import { db, uid } from '../db.js';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} sozlanmagan (.env fayliga qarang)`);
  return v;
}

export const ClickProvider = {
  name: 'click',

  async createTopUpCheckout({ amount, orderId }) {
    const serviceId = requireEnv('CLICK_SERVICE_ID');
    const merchantId = requireEnv('CLICK_MERCHANT_ID');
    const url = new URL('https://my.click.uz/services/pay');
    url.searchParams.set('service_id', serviceId);
    url.searchParams.set('merchant_id', merchantId);
    url.searchParams.set('amount', String(amount));
    url.searchParams.set('transaction_param', orderId);
    return { mode: 'redirect', checkoutUrl: url.toString() };
  },

  async createPayout() {
    throw new Error("Click orqali kartaga chiqim hozircha qo'llab-quvvatlanmaydi.");
  },
};

const CLICK_ERROR = { SUCCESS: 0, SIGN_FAILED: -1, INCORRECT_AMOUNT: -2, ALREADY_PAID: -4, ORDER_NOT_FOUND: -5, TRANSACTION_NOT_FOUND: -6 };

function verifyClickSign(body) {
  const secret = process.env.CLICK_SECRET_KEY;
  const base = body.action === '1' || body.action === 1
    ? `${body.click_trans_id}${body.service_id}${secret}${body.merchant_trans_id}${body.merchant_prepare_id}${body.amount}${body.action}${body.sign_time}`
    : `${body.click_trans_id}${body.service_id}${secret}${body.merchant_trans_id}${body.amount}${body.action}${body.sign_time}`;
  const expected = createHash('md5').update(base).digest('hex');
  return expected === body.sign_string;
}

// Click'dan kelgan Prepare/Complete so'rovini qayta ishlaydi.
export async function handleClickWebhook(body, { onPerform }) {
  if (!verifyClickSign(body)) {
    return { error: CLICK_ERROR.SIGN_FAILED, error_note: "Imzo noto'g'ri" };
  }

  const isComplete = String(body.action) === '1';
  const orderId = body.merchant_trans_id;
  const amount = Math.round(Number(body.amount));

  if (!isComplete) {
    const pending = await db.prepare('SELECT user_id, amount FROM provider_transactions WHERE order_id = ? AND provider = ? AND state = 0').get(orderId, 'click');
    if (!pending) return { error: CLICK_ERROR.ORDER_NOT_FOUND, error_note: 'Buyurtma topilmadi' };
    // Webhook'dagi summani hech qachon ko'r-ko'rona ishonib bo'lmaydi — checkout
    // yaratilganda RavonPay o'zi saqlab qo'ygan summaga mos kelishi shart.
    if (amount !== pending.amount) return { error: CLICK_ERROR.INCORRECT_AMOUNT, error_note: "Summa mos kelmadi" };
    const txId = uid('clord');
    await db.prepare('INSERT INTO provider_transactions (id, provider, user_id, order_id, amount, state, create_time) VALUES (?, ?, ?, ?, ?, 1, ?)')
      .run(String(body.click_trans_id), 'click', pending.user_id, orderId, amount, Date.now());
    return {
      click_trans_id: body.click_trans_id, merchant_trans_id: orderId,
      merchant_prepare_id: txId, error: CLICK_ERROR.SUCCESS, error_note: 'Success',
    };
  }

  const tx = await db.prepare('SELECT * FROM provider_transactions WHERE id = ?').get(String(body.click_trans_id));
  if (!tx) return { error: CLICK_ERROR.TRANSACTION_NOT_FOUND, error_note: 'Tranzaksiya topilmadi' };
  if (tx.state === 2) return { error: CLICK_ERROR.ALREADY_PAID, error_note: "Allaqachon to'langan" };
  await db.prepare('UPDATE provider_transactions SET state = 2, perform_time = ? WHERE id = ?').run(Date.now(), tx.id);
  await onPerform({ userId: tx.user_id, amount: tx.amount, reference: tx.id });
  return {
    click_trans_id: body.click_trans_id, merchant_trans_id: orderId,
    merchant_confirm_id: uid('clconf'), error: CLICK_ERROR.SUCCESS, error_note: 'Success',
  };
}

// TopUp so'ralganda checkout havolasi berilishidan oldin order_id'ni
// foydalanuvchiga bog'lab qo'yadi (Payme'dagi reservePaymeOrder bilan bir xil g'oya).
export async function reserveClickOrder({ userId, orderId, amount }) {
  await db.prepare('INSERT INTO provider_transactions (id, provider, user_id, order_id, amount, state, create_time) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .run(uid('clres'), 'click', userId, orderId, amount, Date.now());
}
