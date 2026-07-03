# RavonPay Backend

Frontend (`src/services/*.js`) dagi barcha mock (localStorage) mantiqning haqiqiy,
ma'lumotlar bazasiga asoslangan server tomonidagi ekvivalenti.

## Texnologiyalar

- **Node.js + Express** — HTTP server
- **`node:sqlite`** (Node 22.5+ ichiga o'rnatilgan) — ma'lumotlar bazasi, hech qanday
  tashqi native modul kerak emas (Windows'da eng ishonchli variant)
- **JWT** (`jsonwebtoken`) — avtorizatsiya
- **bcryptjs** — parollarni xeshlash (sof JS, native build muammolarisiz)

## Ishga tushirish

```bash
cd backend
npm install
npm start
```

Server `http://localhost:4000/api/v1` manzilida ishga tushadi. Frontend
(`.env` yoki `VITE_API_URL` orqali) shu manzilga so'rov yuboradi — standart holatda
allaqachon shunday sozlangan (`src/utils/constants.js`).

Ma'lumotlar bazasi fayli `backend/data/ravonpay.db` da saqlanadi (birinchi marta
ishga tushganda avtomatik yaratiladi, `.gitignore`ga kiritilgan).

## Demo CEO hisobi

Server birinchi marta ishga tushganda `ceo@ravonpay.uz` hisobi **avtomatik**
yaratiladi va boy namunaviy ma'lumot (`src/db.js`dagi `seedCeoWalletAndBusiness`)
bilan to'ldiriladi. Bu hisobga **istalgan parol bilan** kirish mumkin — bu ataylab
qilingan demo xatti-harakati (`authService.js`dagi `login`/`register`da ham,
`auth.routes.js`da ham bir xil qoidaga rioya qilinadi).

Boshqa har qanday email bilan ro'yxatdan o'tish/kirish esa **haqiqiy** parolni
tekshiradi (bcrypt orqali xeshlangan) va noldan (bo'sh hamyon/biznes) boshlaydi.

## Backend ishlamasa nima bo'ladi?

Frontend service fayllari (`authService.js`, `paymentService.js`,
`businessService.js`, `cardService.js`, `notificationService.js`) har biri
`try { haqiqiy so'rov } catch (tarmoq xatosi) { mock fallback }` naqshiga amal
qiladi. Demak, agar backend server ishlamasa, ilova **avtomatik** ravishda
localStorage'ga asoslangan mock rejimga o'tadi (funksional, lekin brauzerga
bog'liq va vaqtinchalik). Backend ishga tushirilganda hech narsa o'zgartirish
shart emas — so'rovlar avtomatik ravishda haqiqiy serverga boradi.

## Papka tuzilmasi

```
backend/
  server.js              — kirish nuqtasi, barcha route'larni ulaydi
  src/
    db.js                — sxema, CEO demo ma'lumotini urug'lash
    authUtil.js           — JWT imzolash/tekshirish
    helpers.js            — umumiy DB->JSON o'girish funksiyalari, bildirishnoma yordamchisi
    middleware/
      requireAuth.js       — Bearer token tekshiruvi
    routes/
      auth.routes.js       — register/login/me/logout/switch-profile/activate-profile/change-password
      cards.routes.js
      wallet.routes.js      — balance/topup/withdraw
      transactions.routes.js
      contacts.routes.js
      utilities.routes.js
      payments.routes.js    — to'lov havolalari, analitika
      business.routes.js    — biznes hisobi (eng katta modul)
      notifications.routes.js
```
