import { test, expect } from '@playwright/test';
import { registerPersonal, registerBusiness } from './helpers.js';

test.describe('Personal utility payments', () => {
  test('insufficient balance is rejected, then a valid payment produces a receipt', async ({ page }) => {
    await registerPersonal(page, { fullName: 'Utility Test User' });

    await page.click('button.bal-btn >> nth=2'); // top up
    await page.waitForTimeout(300);
    await page.locator('.inline-amount-form input').fill('200000');
    await page.click('.inline-amount-form button[type="submit"]');
    await page.waitForTimeout(800);

    await page.goto('/dashboard/utilities', { waitUntil: 'networkidle' });
    await page.click('.util-card:has-text("Mobil")');
    await page.waitForTimeout(300);
    const formPanel = page.locator('.form-panel-page');

    await formPanel.locator('form .field input[type="text"]').first().fill('901234567');
    await formPanel.locator('.amount-input input').fill('5000000');
    await formPanel.locator('button[type="submit"].btn-primary-full').click();
    await page.waitForTimeout(600);
    await expect(page.locator('.pw-msg')).toHaveText(/mablag/i);

    await formPanel.locator('.amount-input input').fill('');
    await formPanel.locator('.chip-group').nth(1).locator('button').first().click();
    await formPanel.locator('button[type="submit"].btn-primary-full').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.util-receipt-title')).toBeVisible();
  });
});

test.describe('Business utility payments', () => {
  test('single-provider category shows no provider picker, insufficient balance blocks payment', async ({ page }) => {
    await registerBusiness(page, { companyName: 'Utility Biz Co', ownerName: 'Utility Biz Owner' });

    await page.goto('/business/utilities', { waitUntil: 'networkidle' });
    await page.click('.util-link-card:has-text("Elektr")');
    await page.waitForTimeout(300);
    const bizPanel = page.locator('.panel.reveal').last();
    expect(await bizPanel.locator('.util-block-label:has-text("Provayder")').count()).toBe(0);

    await bizPanel.locator('form .biz-field input').nth(0).fill('11223344');
    await bizPanel.locator('form .biz-field input').nth(1).fill('20000');
    await bizPanel.locator('form button[type="submit"]').click();
    await page.waitForTimeout(600);
    await expect(page.locator('.pw-msg')).toHaveText(/mablag/i);
  });

  test('a paid invoice funds the business balance, then a utility payment succeeds and shows in Transactions', async ({ page }) => {
    await registerBusiness(page, { companyName: 'Funded Biz Co', ownerName: 'Funded Biz Owner' });

    await page.goto('/business/invoices', { waitUntil: 'networkidle' });
    await page.click('.head-actions .btn-new');
    await page.waitForTimeout(300);
    await page.locator('.modal-overlay.show .modal input').nth(0).fill('Test Client');
    await page.locator('.modal-overlay.show .modal input').nth(1).fill('25-iyul');
    await page.locator('.modal-overlay.show .modal input').nth(2).fill('500000');
    await page.click('.modal-overlay.show .modal button[type="submit"]');
    await page.waitForTimeout(800);
    await page.click('.panel-link');
    await page.waitForTimeout(800);

    await page.goto('/business/utilities', { waitUntil: 'networkidle' });
    await page.click('.util-link-card:has-text("Elektr")');
    await page.waitForTimeout(300);
    const bizPanel = page.locator('.panel.reveal').last();
    await bizPanel.locator('form .biz-field input').nth(0).fill('11223344');
    await bizPanel.locator('form .biz-field input').nth(1).fill('20000');
    await bizPanel.locator('form button[type="submit"]').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.util-receipt-title')).toBeVisible();

    await page.goto('/business/transactions', { waitUntil: 'networkidle' });
    const names = await page.locator('.tbl tbody tr .nm').allTextContents();
    expect(names).toContain("Kommunal to'lov");
  });
});
