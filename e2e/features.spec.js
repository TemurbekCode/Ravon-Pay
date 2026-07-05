import { test, expect } from '@playwright/test';
import { API, apiRegister, apiSubscribe, registerPersonal, registerBusiness, randomPhone } from './helpers.js';

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

test.describe('Send money — P2P by phone vs. card', () => {
  test('sending by phone to a registered RavonPay user credits their wallet in real time', async ({ request }) => {
    const sender = await apiRegister({ fullName: 'Send Sender' });
    const receiver = await apiRegister({ fullName: 'Send Receiver' });
    await request.post(`${API}/wallet/topup`, { headers: { Authorization: `Bearer ${sender.token}` }, data: { amount: 200000 } });

    const res = await request.post(`${API}/transactions/send`, {
      headers: { Authorization: `Bearer ${sender.token}` },
      data: { recipient: receiver.phone, recipientType: 'phone', amount: 50000 },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).balance).toBe(150000);

    const receiverWallet = await request.get(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${receiver.token}` } }).then((r) => r.json());
    expect(receiverWallet.balance).toBe(50000);
  });

  test('sending by phone to a number not registered on RavonPay is rejected', async ({ request }) => {
    const sender = await apiRegister({ fullName: 'Send Nowhere' });
    await request.post(`${API}/wallet/topup`, { headers: { Authorization: `Bearer ${sender.token}` }, data: { amount: 200000 } });

    const res = await request.post(`${API}/transactions/send`, {
      headers: { Authorization: `Bearer ${sender.token}` },
      data: { recipient: randomPhone().slice(-9), recipientType: 'phone', amount: 50000 },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).message).toBe('RECIPIENT_NOT_FOUND');
  });

  test('sending by card is a payout-style transfer that works with the mock provider', async ({ request }) => {
    const sender = await apiRegister({ fullName: 'Send By Card' });
    await request.post(`${API}/wallet/topup`, { headers: { Authorization: `Bearer ${sender.token}` }, data: { amount: 200000 } });

    const res = await request.post(`${API}/transactions/send`, {
      headers: { Authorization: `Bearer ${sender.token}` },
      data: { recipient: '4111111111111111', recipientType: 'card', amount: 50000 },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).balance).toBe(150000);
  });
});

test.describe('Payment request link (Receive → prefilled Send)', () => {
  test('opening a shared request link prefills recipient/amount, and sending completes the transfer', async ({ page, request }) => {
    // Haqiqiy O'zbekiston raqamlari 9 xonali (+998 dan keyin) — Send sahifasidagi
    // telefon maydoni ham shu uzunlikka cheklangan, shuning uchun test raqami
    // ham aynan shu formatda bo'lishi kerak (aks holda oxirgi raqam kesilib,
    // qidiruv mos kelmay qoladi).
    const receiverPhone = randomPhone().slice(-9);
    const receiver = await apiRegister({ phone: receiverPhone, fullName: 'Request Receiver' });
    const sender = await apiRegister({ fullName: 'Request Sender' });
    await request.post(`${API}/wallet/topup`, { headers: { Authorization: `Bearer ${sender.token}` }, data: { amount: 200000 } });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate((tok) => localStorage.setItem('ravonpay_access_token', tok), sender.token);
    await page.goto(`/dashboard/send?to=${receiverPhone}&amount=15000`, { waitUntil: 'networkidle' });

    await expect(page.locator('.phone-input-wrap input')).toHaveValue(receiverPhone);
    await expect(page.locator('.amount-input input')).toHaveValue('15000');

    await page.click('.form-panel-page button[type="submit"]');
    await page.waitForTimeout(500);

    const receiverWallet = await request.get(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${receiver.token}` } }).then((r) => r.json());
    expect(receiverWallet.balance).toBe(15000);
  });
});

test.describe('Business "Havola" bottom-nav button', () => {
  test('opens the real create-link modal (not a placeholder toast) and adds the link', async ({ page }) => {
    // Pastki navigatsiya (bottom-nav) faqat mobil kenglikda ko'rinadi (Business.scss,
    // max-width: 860px) — aynan foydalanuvchi skrinshotlaridagi ko'rinish.
    await page.setViewportSize({ width: 390, height: 844 });
    await registerBusiness(page, { companyName: 'Havola Nav Co' });
    await page.click('.bn-item.center');
    await page.waitForTimeout(300);

    const modal = page.locator('.modal-overlay.show .modal');
    await expect(modal).toBeVisible();
    await modal.locator('input').first().fill('Nav Test Link');
    await modal.locator('input').nth(1).fill('75000');
    await modal.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/business\/links$/);
    await expect(page.locator('.link-card:has-text("Nav Test Link")')).toBeVisible();
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
