// Payme Merchant API integratsiyasi (https://developer.help.paycom.uz).
// Ishlashi uchun quyidagi .env qiymatlari kerak: PAYME_MERCHANT_ID, PAYME_KEY.
//
// 1) createTopUpCheckout — foydalanuvchini Payme checkout sahifasiga yo'naltirish
//    uchun havola yaratadi (bu qism to'liq va aniq — Payme'ning hujjatlashtirilgan
//    formatiga mos: base64("m=...;ac.order_id=...;a=...")).
// 2) Webhook metodlari (handlePaymeWebhook) — Payme sizning serveringizga
//    JSON-RPC 2.0 orqali murojaat qiladi (foydalanuvchi to'lov qilganda/bekor
//    qilganda). Bu qism protokol bo'yicha to'g'ri qurilgan, LEKIN aniq xato
//    kodlari (masalan -31050) Payme sandbox'ida sertifikatlashdan oldin rasmiy
//    hujjat bilan tekshirilishi kerak — bu yerda eng keng tarqalgan/hujjatlashtirilgan
//    kodlar ishlatilgan.
import { db, uid } from '../db.js';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} sozlanmagan (.env fayliga qarang)`);
  return v;
}

export const PaymeProvider = {
  name: 'payme',

  async createTopUpCheckout({ amount, orderId }) {
    const merchantId = requireEnv('PAYME_MERCHANT_ID');
    const amountTiyin = Math.round(amount * 100); // Payme summani tiyinda kutadi
    const params = `m=${merchantId};ac.order_id=${orderId};a=${amountTiyin}`;
    const encoded = Buffer.from(params).toString('base64');
    return { mode: 'redirect', checkoutUrl: `https://checkout.paycom.uz/${encoded}` };
  },

  async createPayout() {
    throw new Error("Payme orqali kartaga chiqim hozircha qo'llab-quvvatlanmaydi — Payme asosan checkout (kirim) uchun ishlatiladi, chiqim uchun Click yoki bank API kerak bo'ladi.");
  },
};

const ERR = {
  METHOD_NOT_FOUND: -32601,
  INVALID_AUTH: -32504,
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  CANT_PERFORM: -31008,
  ORDER_NOT_FOUND: -31050,
};

function rpcResult(id, result) { return { jsonrpc: '2.0', id, result }; }
function rpcError(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }

// Payme'dan kelgan so'rovni Basic Auth orqali tekshiradi: login "Paycom",
// parol PAYME_KEY bo'lishi kerak.
export function verifyPaymeAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const [login, key] = decoded.split(':');
  return login === 'Paycom' && key === process.env.PAYME_KEY;
}

// Payme JSON-RPC webhook'ini qayta ishlaydi. `findOrder(orderId)` — order_id
// bo'yicha { userId, amount } qaytaruvchi funksiya (chaqiruvchi tomonidan
// beriladi, chunki "order" nima ekanligi kontekstga bog'liq — hozircha wallet
// to'ldirish uchun ishlatiladi).
export function handlePaymeWebhook({ method, params, id }, { onPerform }) {
  const now = Date.now();

  if (method === 'CheckPerformTransaction') {
    const orderId = params?.account?.order_id;
    const order = db.prepare('SELECT * FROM provider_transactions WHERE order_id = ? AND provider = ?').get(orderId, 'payme');
    if (!order && !orderId) return rpcError(id, ERR.ORDER_NOT_FOUND, "Buyurtma topilmadi");
    return rpcResult(id, { allow: true });
  }

  if (method === 'CreateTransaction') {
    const existing = db.prepare('SELECT * FROM provider_transactions WHERE id = ?').get(params.id);
    if (existing) {
      return rpcResult(id, { create_time: existing.create_time, transaction: existing.id, state: existing.state });
    }
    const orderId = params.account?.order_id;
    const amount = Math.round((params.amount || 0) / 100); // tiyin -> so'm
    // orderId RavonPay tomonida qaysi foydalanuvchiga tegishli ekanligi
    // createTopUpCheckout bosqichida saqlangan bo'lishi kerak (bu yerda
    // soddalik uchun orderId = uid('topup') va oldindan yozib qo'yilgan deb faraz qilinadi).
    const pending = db.prepare('SELECT user_id FROM provider_transactions WHERE order_id = ? AND provider = ? AND state = 0').get(orderId, 'payme');
    if (!pending) return rpcError(id, ERR.ORDER_NOT_FOUND, "Buyurtma topilmadi yoki muddati tugagan");
    db.prepare('INSERT INTO provider_transactions (id, provider, user_id, order_id, amount, state, create_time) VALUES (?, ?, ?, ?, ?, 1, ?)')
      .run(params.id, 'payme', pending.user_id, orderId, amount, now);
    return rpcResult(id, { create_time: now, transaction: params.id, state: 1 });
  }

  if (method === 'PerformTransaction') {
    const tx = db.prepare('SELECT * FROM provider_transactions WHERE id = ?').get(params.id);
    if (!tx) return rpcError(id, ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi');
    if (tx.state === 2) return rpcResult(id, { transaction: tx.id, perform_time: tx.perform_time, state: 2 });
    if (tx.state !== 1) return rpcError(id, ERR.CANT_PERFORM, "Tranzaksiyani amalga oshirib bo'lmaydi");
    db.prepare('UPDATE provider_transactions SET state = 2, perform_time = ? WHERE id = ?').run(now, tx.id);
    onPerform({ userId: tx.user_id, amount: tx.amount, reference: tx.id });
    return rpcResult(id, { transaction: tx.id, perform_time: now, state: 2 });
  }

  if (method === 'CancelTransaction') {
    const tx = db.prepare('SELECT * FROM provider_transactions WHERE id = ?').get(params.id);
    if (!tx) return rpcError(id, ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi');
    const newState = tx.state === 2 ? -2 : -1;
    db.prepare('UPDATE provider_transactions SET state = ?, cancel_time = ?, reason = ? WHERE id = ?')
      .run(newState, now, params.reason || 0, tx.id);
    return rpcResult(id, { transaction: tx.id, cancel_time: now, state: newState });
  }

  if (method === 'CheckTransaction') {
    const tx = db.prepare('SELECT * FROM provider_transactions WHERE id = ?').get(params.id);
    if (!tx) return rpcError(id, ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi');
    return rpcResult(id, {
      create_time: tx.create_time, perform_time: tx.perform_time, cancel_time: tx.cancel_time,
      transaction: tx.id, state: tx.state, reason: tx.reason || null,
    });
  }

  if (method === 'GetStatement') {
    const rows = db.prepare('SELECT * FROM provider_transactions WHERE provider = ? AND create_time BETWEEN ? AND ?')
      .all('payme', params.from, params.to);
    return rpcResult(id, {
      transactions: rows.map((tx) => ({
        id: tx.id, time: tx.create_time, amount: tx.amount * 100,
        account: { order_id: tx.order_id }, create_time: tx.create_time,
        perform_time: tx.perform_time, cancel_time: tx.cancel_time, transaction: tx.id, state: tx.state,
      })),
    });
  }

  return rpcError(id, ERR.METHOD_NOT_FOUND, 'Metod topilmadi');
}

// TopUp so'ralganda checkout havolasidan OLDIN chaqiriladi — order_id'ni
// foydalanuvchiga bog'lab, state=0 ("kutilmoqda, hali Payme tomonidan
// CreateTransaction chaqirilmagan") sifatida oldindan yozib qo'yadi.
export function reservePaymeOrder({ userId, orderId, amount }) {
  db.prepare('INSERT INTO provider_transactions (id, provider, user_id, order_id, amount, state, create_time) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .run(uid('pmord'), 'payme', userId, orderId, amount, Date.now());
}
