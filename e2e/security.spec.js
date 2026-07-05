import { test, expect } from '@playwright/test';
import { API, apiRegister } from './helpers.js';

// Har bir pul harakatlanadigan endpoint manfiy/0/NaN summani rad etishi shart —
// aks holda (masalan) `withdraw`ga manfiy summa yuborilsa "amount > balance"
// tekshiruvi soxta o'tib, balans TEKIN oshib ketishi mumkin edi.
test.describe('Amount validation (money-creation exploit regression)', () => {
  let token;

  test.beforeAll(async () => {
    const acc = await apiRegister({ fullName: 'Security Test' });
    token = acc.token;
  });

  const badAmounts = [-5000000, 0, 'not-a-number', null, Infinity, NaN];

  for (const bad of badAmounts) {
    test(`wallet/withdraw rejects amount=${bad}`, async ({ request }) => {
      const res = await request.post(`${API}/wallet/withdraw`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { amount: bad, cardId: 'fake' },
      });
      expect(res.status()).toBe(400);
    });

    test(`transactions/send rejects amount=${bad}`, async ({ request }) => {
      const res = await request.post(`${API}/transactions/send`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { recipient: 'someone', amount: bad },
      });
      expect(res.status()).toBe(400);
    });

    test(`wallet/topup rejects amount=${bad}`, async ({ request }) => {
      const res = await request.post(`${API}/wallet/topup`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { amount: bad },
      });
      expect(res.status()).toBe(400);
    });

    test(`utilities/pay rejects amount=${bad}`, async ({ request }) => {
      const res = await request.post(`${API}/utilities/pay`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { category: 'test', account: '123', amount: bad },
      });
      expect(res.status()).toBe(400);
    });
  }

  test('a legitimate positive topup still succeeds and balance matches exactly', async ({ request }) => {
    const before = await request.get(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    const res = await request.post(`${API}/wallet/topup`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { amount: 50000 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(before.balance + 50000);
  });

  test('negative withdraw cannot inflate balance (core exploit regression)', async ({ request }) => {
    const before = await request.get(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    await request.post(`${API}/wallet/withdraw`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { amount: -1000000, cardId: 'fake' },
    });
    const after = await request.get(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    expect(after.balance).toBe(before.balance);
  });
});

test.describe('Authentication / authorization', () => {
  test('unauthenticated requests are rejected', async ({ request }) => {
    const res = await request.get(`${API}/wallet/balance`);
    expect(res.status()).toBe(401);
  });

  test('a garbage bearer token is rejected', async ({ request }) => {
    const res = await request.get(`${API}/wallet/balance`, { headers: { Authorization: 'Bearer not-a-real-token' } });
    expect(res.status()).toBe(401);
  });

  test('a non-admin account cannot reach admin routes', async ({ request }) => {
    const acc = await apiRegister({ fullName: 'Not Admin' });
    const res = await request.get(`${API}/admin/overview`, { headers: { Authorization: `Bearer ${acc.token}` } });
    expect(res.status()).toBe(403);
  });

  test('a card cannot be frozen by a different user (IDOR check)', async ({ request }) => {
    const owner = await apiRegister({ fullName: 'Card Owner' });
    const card = await request.post(`${API}/cards`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { cardNumber: '4111111111111111', expiry: '12/29', cvv: '123', cardholderName: 'Card Owner' },
    }).then((r) => r.json());

    const attacker = await apiRegister({ fullName: 'Attacker' });
    const res = await request.post(`${API}/cards/${card.id}/freeze`, { headers: { Authorization: `Bearer ${attacker.token}` } });
    expect(res.status()).toBe(404);
  });
});
