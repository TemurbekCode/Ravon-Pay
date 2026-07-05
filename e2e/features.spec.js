import { test, expect } from '@playwright/test';
import { API, apiRegister, apiSubscribe, registerPersonal, registerBusiness } from './helpers.js';

test.describe('Local vs international card (no CVV for local cards)', () => {
  test('a local card can be added without filling CVV', async ({ page }) => {
    await registerPersonal(page, { fullName: 'Card Kind Test' });
    await page.goto('/dashboard/wallet', { waitUntil: 'networkidle' });
    await page.click('.add-card-btn');
    await page.waitForTimeout(300);

    const modal = page.locator('.modal-overlay.show .modal');
    await modal.locator('.cardform-kind button:has-text("Mahalliy karta")').click();
    expect(await modal.locator('.cardform-row .cardform-field').count()).toBe(1); // faqat muddat, CVV yo'q

    const inputs = modal.locator('.cardform input');
    await inputs.nth(0).fill('8600123456789012');
    await inputs.nth(1).fill('12/29');
    await inputs.nth(2).fill('Card Kind Test'); // CVV maydoni yo'q, keyingisi holder
    await page.waitForTimeout(200);
    await expect(modal.locator('button[type="submit"]')).toBeEnabled();
  });
});

test.describe('Refresh token', () => {
  test('rotates on use and rejects reuse of the old token', async ({ request }) => {
    const acc = await apiRegister({ fullName: 'Refresh Test' });
    const reqRes = await fetch(`${API}/auth/otp/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: acc.phone, mode: 'login' }),
    }).then((r) => r.json());
    const verifyRes = await fetch(`${API}/auth/otp/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: acc.phone, code: reqRes.devCode, mode: 'login' }),
    }).then((r) => r.json());
    expect(verifyRes.refreshToken).toBeTruthy();

    const refreshRes = await request.post(`${API}/auth/refresh`, { data: { refreshToken: verifyRes.refreshToken } });
    expect(refreshRes.status()).toBe(200);
    const body = await refreshRes.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).not.toBe(verifyRes.refreshToken);

    // eski refreshToken endi ishlamasligi kerak (rotatsiya)
    const reuseRes = await request.post(`${API}/auth/refresh`, { data: { refreshToken: verifyRes.refreshToken } });
    expect(reuseRes.status()).toBe(401);
  });

  test('an invalid refresh token is rejected', async ({ request }) => {
    const res = await request.post(`${API}/auth/refresh`, { data: { refreshToken: 'not-a-real-token' } });
    expect(res.status()).toBe(401);
  });
});

test.describe('Two-factor step-up on withdraw', () => {
  test('withdraw requires a fresh code once 2FA is enabled, and succeeds with the right one', async ({ request }) => {
    const acc = await apiRegister({ fullName: '2FA Test' });
    await request.patch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${acc.token}` }, data: { twoFaEnabled: true } });

    await request.post(`${API}/wallet/topup`, { headers: { Authorization: `Bearer ${acc.token}` }, data: { amount: 200000 } });
    const card = await request.post(`${API}/cards`, {
      headers: { Authorization: `Bearer ${acc.token}` },
      data: { cardNumber: '4111111111111111', expiry: '12/29', cvv: '123', cardholderName: '2FA Test' },
    }).then((r) => r.json());

    const noCodeRes = await request.post(`${API}/wallet/withdraw`, {
      headers: { Authorization: `Bearer ${acc.token}` }, data: { amount: 50000, cardId: card.id },
    });
    expect(noCodeRes.status()).toBe(428);
    expect((await noCodeRes.json()).message).toBe('2FA_REQUIRED');

    const challenge = await request.post(`${API}/auth/2fa/challenge`, { headers: { Authorization: `Bearer ${acc.token}` } }).then((r) => r.json());
    expect(challenge.devCode).toBeTruthy();

    const wrongCodeRes = await request.post(`${API}/wallet/withdraw`, {
      headers: { Authorization: `Bearer ${acc.token}` }, data: { amount: 50000, cardId: card.id, twoFaCode: '0000' },
    });
    expect(wrongCodeRes.status()).toBe(400);

    // yangi kod so'raladi (avvalgisi noto'g'ri urinishdan keyin ham bazada qoladi, lekin urinish soni oshadi)
    const challenge2 = await request.post(`${API}/auth/2fa/challenge`, { headers: { Authorization: `Bearer ${acc.token}` } }).then((r) => r.json());
    const okRes = await request.post(`${API}/wallet/withdraw`, {
      headers: { Authorization: `Bearer ${acc.token}` }, data: { amount: 50000, cardId: card.id, twoFaCode: challenge2.devCode },
    });
    expect(okRes.status()).toBe(200);
  });

  test('withdraw works without a code when 2FA is disabled (default)', async ({ request }) => {
    const acc = await apiRegister({ fullName: 'No 2FA Test' });
    await request.post(`${API}/wallet/topup`, { headers: { Authorization: `Bearer ${acc.token}` }, data: { amount: 100000 } });
    const card = await request.post(`${API}/cards`, {
      headers: { Authorization: `Bearer ${acc.token}` },
      data: { cardNumber: '4111111111111111', expiry: '12/29', cvv: '123', cardholderName: 'No 2FA Test' },
    }).then((r) => r.json());
    const res = await request.post(`${API}/wallet/withdraw`, {
      headers: { Authorization: `Bearer ${acc.token}` }, data: { amount: 50000, cardId: card.id },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('Business document upload (backend fully working, paused in UI)', () => {
  test('a valid PDF/image can be uploaded and marks the business as having a document', async ({ request }) => {
    const acc = await apiRegister({ fullName: 'Doc Upload Owner', accountType: 'business', companyName: 'Doc Upload Co' });
    await apiSubscribe(acc.token);

    const res = await request.post(`${API}/business/verification/document`, {
      headers: { Authorization: `Bearer ${acc.token}` },
      multipart: { document: { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) } },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).documentUploaded).toBe(true);

    const overview = await request.get(`${API}/business/overview`, { headers: { Authorization: `Bearer ${acc.token}` } }).then((r) => r.json());
    expect(overview.verification.documentUploaded).toBe(true);
  });

  test('an unsupported file type is rejected', async ({ request }) => {
    const acc = await apiRegister({ fullName: 'Doc Reject Owner', accountType: 'business', companyName: 'Doc Reject Co' });
    await apiSubscribe(acc.token);
    const res = await request.post(`${API}/business/verification/document`, {
      headers: { Authorization: `Bearer ${acc.token}` },
      multipart: { document: { name: 'test.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('not a real exe') } },
    });
    expect(res.status()).toBe(400);
  });

  test('the "not available yet" badge is shown in Settings instead of an active uploader', async ({ page }) => {
    await registerBusiness(page, { companyName: 'Paused UI Co', ownerName: 'Paused UI Owner' });
    await page.click('.profile-btn');
    await page.click('.pd-item:has-text("Sozlamalar")');
    await page.waitForTimeout(400);
    await expect(page.locator('.pd-item-verify:has-text("Hujjat")')).toContainText('Hozircha mavjud emas');
  });
});
