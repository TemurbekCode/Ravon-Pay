import { test, expect } from '@playwright/test';
import { API, apiRegister, apiSubscribe, becomeFounder, randomPhone } from './helpers.js';

// ravonpay@gmail.com bo'lmagan hisoblar uchun /admin butunlay yopiq bo'lishi,
// va shu emailni olganlar uchun ochilishi shart. Google Sign-In'ni testda
// simulyatsiya qilib bo'lmagani uchun to'g'ridan-to'g'ri API orqali ro'yxatdan
// o'tkazib, keyin shu emailni PATCH /auth/me orqali qo'shamiz — bu ham
// production'dagi "keyinroq Sozlamalardan qo'shish" yo'lini sinaydi. Email
// UNIQUE bo'lgani uchun butun fayl uchun BITTA founder hisob yaratiladi
// (becomeFounder avvalgi test yugurishidan qolgan egalikni tozalab, keyin ko'chiradi).
let adminToken;

test.beforeAll(async () => {
  const admin = await apiRegister({ fullName: 'Admin E2E', accountType: 'business', companyName: 'Admin E2E Co' });
  await becomeFounder(admin.token);
  adminToken = admin.token;
});

test.describe('Admin panel access control', () => {
  test('a regular account is redirected away from /admin', async ({ page }) => {
    const acc = await apiRegister({ fullName: 'Regular User' });
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate((tok) => localStorage.setItem('ravonpay_access_token', tok), acc.token);
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('the founder account has role=admin and can open /admin', async ({ page, request }) => {
    const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } }).then((r) => r.json());
    expect(me.user.role).toBe('admin');

    await page.goto('/business', { waitUntil: 'networkidle' });
    await page.evaluate((tok) => localStorage.setItem('ravonpay_access_token', tok), adminToken);
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('.admin-header-title')).toBeVisible();
  });
});

test.describe('Admin verification review flow', () => {
  test('a pending business verification can be approved and the pill updates', async ({ page, request }) => {
    // Har yugurishda noyob kompaniya nomi — aks holda avvalgi test yugurishlaridan
    // qolgan bir xil nomli qatorlar to'planib, lokator bir nechta elementga mos kelib qoladi.
    const companyName = `Verify Flow Co ${randomPhone()}`;
    const biz = await apiRegister({ fullName: 'Verify Flow Owner', accountType: 'business', companyName });
    await apiSubscribe(biz.token);
    await request.patch(`${API}/business/verification`, {
      headers: { Authorization: `Bearer ${biz.token}` },
      data: { taxId: '999888777', legalAddress: 'Test manzil 1' },
    });

    await page.goto('/business', { waitUntil: 'networkidle' });
    await page.evaluate((tok) => localStorage.setItem('ravonpay_access_token', tok), adminToken);
    await page.goto('/admin', { waitUntil: 'networkidle' });

    const row = page.locator('.tbl tbody tr', { hasText: companyName });
    await expect(row).toBeVisible();
    await expect(row.locator('.pill')).toHaveText(/ko'rib chiqilmoqda/i);
    await row.locator('button:has-text("Tasdiqlash")').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.tbl tbody tr', { hasText: companyName }).locator('.pill')).toHaveText(/tasdiqlangan/i);
  });
});
