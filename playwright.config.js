import { defineConfig } from '@playwright/test';

// Backend/frontend allaqachon `npm run dev` bilan ishlab turgan bo'lsa
// (dev vaqtida odatiy holat), reuseExistingServer o'shani ishlatadi —
// aks holda ikkalasini ham shu yerdan ishga tushiradi.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false, // testlar bitta umumiy backend/DB holatini baham ko'radi
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: './backend',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true,
      timeout: 30000,
      // Test to'plami bitta IP'dan o'nlab "turli foydalanuvchi"ni ro'yxatdan
      // o'tkazadi — haqiqiy trafikka mo'ljallangan qattiq limitlar bunda
      // soxta ishga tushib qoladi, shuning uchun faqat shu yerda o'chiriladi.
      env: { DISABLE_RATE_LIMIT: 'true' },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
