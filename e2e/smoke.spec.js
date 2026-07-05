import { test, expect } from '@playwright/test';
import { registerPersonal, registerBusiness } from './helpers.js';

const PERSONAL_ROUTES = [
  '/dashboard', '/dashboard/wallet', '/dashboard/cards', '/dashboard/receive',
  '/dashboard/send', '/dashboard/exchange', '/dashboard/utilities', '/dashboard/history', '/dashboard/profile',
];
const BUSINESS_ROUTES = [
  '/business', '/business/balance', '/business/transactions', '/business/links',
  '/business/invoices', '/business/checkout', '/business/customers', '/business/analytics',
  '/business/team', '/business/exchange', '/business/utilities',
];

// Har bir dashboard sahifasini ochib, konsolda/sahifada kutilmagan xato
// chiqmasligini tekshiradi — auth yoki umumiy state o'zgarganda butun
// ilova bo'ylab regressiyani tez ushlab olish uchun.
async function crawlNoErrors(page, routes) {
  for (const route of routes) {
    const errors = [];
    const onConsole = (msg) => { if (msg.type() === 'error') errors.push(msg.text()); };
    const onPageError = (e) => errors.push(e.message);
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    await page.goto(route, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(300);
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    expect(errors, `Console/page errors on ${route}`).toEqual([]);
  }
}

test('every personal dashboard page loads with no console/page errors', async ({ page }) => {
  await registerPersonal(page, { fullName: 'Smoke Test Personal' });
  await crawlNoErrors(page, PERSONAL_ROUTES);
});

test('every business dashboard page loads with no console/page errors', async ({ page }) => {
  await registerBusiness(page, { companyName: 'Smoke Test Co', ownerName: 'Smoke Test Owner' });
  await crawlNoErrors(page, BUSINESS_ROUTES);
});
