import { test, expect } from '@playwright/test';
import { registerPersonal, registerBusiness, randomPhone, verifyOtpAndSkipEmail } from './helpers.js';

test.describe('Phone + OTP authentication', () => {
  test('personal registration has no email/password fields and lands on /dashboard', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.click('button.btn-submit');
    await page.waitForTimeout(300);
    expect(await page.locator('input[type="email"]').count()).toBe(0);
    expect(await page.locator('input[type="password"]').count()).toBe(0);

    await registerPersonal(page, { fullName: 'Auth Flow Personal' });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('business registration collects company name and requires subscription', async ({ page }) => {
    await registerBusiness(page, { companyName: 'Auth Flow Co', ownerName: 'Auth Flow Owner' });
    await expect(page).toHaveURL(/\/business/);
  });

  test('wrong OTP code is rejected with a clear error and stays on the OTP step', async ({ page }) => {
    const phone = randomPhone();
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.click('button.btn-submit');
    await page.waitForTimeout(300);
    await page.locator('input[type="text"]').first().fill('Wrong Code User');
    await page.locator('input[type="tel"]').first().fill(phone);
    await page.locator('label.checkbox').first().click();
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);

    await page.locator('input[type="text"]').last().fill('0000');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(600);

    await expect(page.locator('h1')).toHaveText(/kod/i);
    const texts = await page.locator('.auth-error').allTextContents();
    expect(texts.some((t) => /noto'g'ri/i.test(t))).toBeTruthy();
  });

  test('logging out and back in with the same phone works', async ({ page }) => {
    const phone = await registerPersonal(page, { fullName: 'Relogin User' });
    await page.evaluate(() => localStorage.removeItem('ravonpay_access_token'));
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.locator('input[type="tel"]').fill(phone);
    await page.click('button[type="submit"]');
    await verifyOtpAndSkipEmail(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
