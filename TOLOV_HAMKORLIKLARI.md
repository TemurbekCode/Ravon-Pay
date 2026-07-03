# RavonPay — To'lov provayderlari bilan hamkorlik uchun qo'llanma

Bu fayl Payme, Click, Payoneer, Wise va PayPal bilan bog'lanishdan OLDIN bilib
olishingiz kerak bo'lgan narsalarni jamlaydi — kimga qo'ng'iroq qilish, qanday
hujjat tayyorlash, va nima so'rashlari mumkinligi haqida.

Backend kodida bu provayderlarning har biri uchun tayyor skelet allaqachon
yozilgan (`backend/src/payments/`). Kalitlar qo'lingizga tegishi bilan — `.env`
fayliga qo'shib, sinab ko'ramiz.

---

## 1. Payme Business — O'zbekiston ichida (hamyon to'ldirish)

**Nima uchun**: RavonPay hamyoniga Uzcard/Humo/Visa/Mastercard orqali pul
to'ldirish uchun.

**Qayerga murojaat**: https://business.payme.uz/ — ariza to'ldirasiz, menejer
qo'ng'iroq qiladi.

**Kerakli hujjatlar**: YaTT yoki tashkilot sifatida ro'yxatdan o'tgan bo'lishingiz
kerak (ro'yxatdan o'tish — alohida, tez jarayon).

**Sizga beriladigan kalitlar**:
- `PAYME_MERCHANT_ID` — Merchant ID
- `PAYME_KEY` — maxfiy kalit (Basic Auth uchun)

**Narxi**: Ro'yxatdan o'tish — kelishuvga bog'liq (menejer bilan gaplashganda
aniqlashtiring). Har bir to'lovdan komissiya olinadi.

**Ularga so'rashingiz kerak bo'lgan savollar**:
- Sandbox (test) muhiti bormi, u orqali kodni haqiqiy pulni tekshirmasdan sinab
  ko'rish mumkinmi?
- Komissiya foizi qancha?
- Checkout havolasi (`checkout.paycom.uz`) formatida `ac.order_id` o'rniga
  boshqa maydon nomi ishlatilishi kerakmi (ba'zi merchant'larga moslashtiriladi)?

---

## 2. Click Merchant — O'zbekiston ichida (muqobil)

**Nima uchun**: Payme bilan bir xil maqsad — mahalliy kartalardan pul
to'ldirish, muqobil/qo'shimcha variant sifatida.

**Qayerga murojaat**: https://business.click.uz/uz

**MUHIM**: Shaxsiy Click ilovasi hisobingiz (dadangiznikidek) bunga yaramaydi —
alohida **Merchant** ro'yxatdan o'tish kerak (avvalgi javobimda batafsil
tushuntirgan edim).

**Kerakli hujjatlar**: Rahbar pasporti nusxasi, ro'yxatdan o'tish guvohnomasi
(yoki YaTT), bank hisob raqami + MFO kodi.

**Sizga beriladigan kalitlar**:
- `CLICK_SERVICE_ID`
- `CLICK_MERCHANT_ID`
- `CLICK_SECRET_KEY`

**Narxi**: Ro'yxatdan o'tish — bepul. Har bir to'lovdan taxminan ~1% komissiya
(aniq foizni ariza jarayonida tasdiqlang).

**Ularga so'rashingiz kerak bo'lgan savollar**:
- Test/sandbox `service_id` bormi?
- Webhook (Prepare/Complete) qaysi formatda yuboriladi — JSON yoki
  form-urlencoded? (Bu texnik jihatdan muhim, men ikkalasini ham qo'llab
  quvvatlaydigan qilib tayyorlab qo'ydim, lekin aniqlashtirish yaxshi.)

---

## 3. Payoneer — xalqaro daromad (frilanser/dropshipping)

**Nima uchun**: AQSH/Yevropadan kelgan frilanser/dropshipping daromadini qabul
qilish va O'zbekiston bank hisobiga chiqarish — bu sizning asosiy g'oyangiz
uchun eng muhim integratsiya.

**Qayerga murojaat**: https://www.payoneer.com/integration-partnerships/ —
"White-label" hamkorlik dasturiga ariza.

**Bu boshqalardan farqi**: Bu — pul TO'LDIRISH emas, balki foydalanuvchining
Payoneer hisobidan uning O'zbek bank kartasiga pul CHIQARISH (payout) uchun.

**Sizga kerak bo'ladigan narsa**: Bu ariza jarayonida ular RavonPay'ni biznes
sifatida tekshiradilar (KYB — Know Your Business). Tayyorlab qo'ying:
- Kompaniya haqida qisqa taqdimot (nima qilasiz, kimlarga xizmat qilasiz)
- Taxminiy foydalanuvchilar soni / kutilayotgan tranzaksiya hajmi
- RavonPay veb-sayti/ilovasi havolasi (demo bo'lsa ham ko'rsating)

**Sizga beriladigan kalitlar** (tasdiqlangach):
- `PAYONEER_CLIENT_ID`
- `PAYONEER_CLIENT_SECRET`
- `PAYONEER_PROGRAM_ID`
- Aniq API endpoint manzillari (developer portal ochilgach)

**Ularga so'rashingiz kerak bo'lgan savollar**:
- O'zbekistondagi foydalanuvchilar uchun onboarding (ro'yxatdan o'tish)
  qanchalik soddalashtirilishi mumkin — bu aynan sizning "oson interfeys"
  g'oyangizga tegishli savol
- Payout (chiqim) komissiyasi qancha va necha kunda yetib boradi

---

## 4. Wise Platform — xalqaro pul o'tkazmalar (kelajakda)

**Nima uchun**: Xalqaro pul o'tkazmalar uchun muqobil/qo'shimcha — Payoneer
asosan frilanser/marketplace to'lovlariga yo'naltirilgan, Wise esa umumiy
xalqaro pul o'tkazmalar (masalan, Rossiya/Turkiya yo'nalishi kelajakda ochilsa)
uchun ham qulay.

**Qayerga murojaat**: https://wise.com/gb/partner/ (Wise Platform bo'limi) —
sotuv (sales) va amalga oshirish (implementation) jamoasi bilan gaplashasiz.

**Jarayon**: Ular bilan suhbatda qaysi integratsiya modeli (3 xil model bor —
implementation jamoasi tanlab beradi) sizga mos ekanligini aniqlaysiz.

**Sizga beriladigan narsa**: `client_id` + `client_secret` (avval sandbox
uchun, keyin production uchun) — Developer Hub orqali boshqariladi.

**Texnik jamoa tayyorlashi kerak bo'lgan narsa**: `redirect_url` — foydalanuvchi
o'z Wise hisobiga ruxsat berganidan keyin qaytariladigan manzil.

**Ularga so'rashingiz kerak bo'lgan savollar**:
- KYC (foydalanuvchini tekshirish) jarayonini Wise o'zi qiladimi, yoki
  RavonPay o'zi qilib, natijasini yuborishi kerakmi ("Partner-Led KYC")?
- O'zbekiston va Markaziy Osiyo davlatlari qo'llab-quvvatlanadimi?

**Texnik savollar uchun**: api@wise.com

---

## 5. PayPal — xalqaro to'lovlar (eng murakkab, oxirgi navbatda)

**Nima uchun**: PayPal orqali to'lov qabul qilish/chiqarish — lekin RavonPay
kabi yangi, kichik loyihalar uchun eng qiyin variant (PayPal odatda yirikroq
platformalar/marketplace'lar bilan ishlaydi).

**Qayerga murojaat**: PayPal Partner dasturi uchun forma to'ldirasiz, PayPal
vakili biznesingizni baholab, keyin bog'lanadi.

**Jarayon**: Avval sandbox (test) muhitida integratsiyani sinaysiz, keyin
"live" (real) kalitlar uchun ariza berasiz — platforma tasdiqlangandan keyingina
ishga tushiradilar.

**Ikki turdagi "sotuvchi" (seller)**:
- Norasmiy (ro'yxatdan o'tmagan) — kam hujjat kerak
- Rasmiy biznes — to'liq tekshiruvdan o'tadi

**Ularga so'rashingiz kerak bo'lgan savollar**:
- O'zbekiston PayPal orqali chiqim qilish uchun qo'llab-quvvatlanadigan
  davlatlar ro'yxatida bormi? (Bu MUHIM — PayPal ba'zi davlatlarda faqat
  "qabul qilish" ga ruxsat beradi, "chiqarish"ga emas — buni ARIZADAN OLDIN
  albatta aniqlashtiring, aks holda vaqt behuda ketishi mumkin.)

---

## Umumiy tavsiya — qaysi tartibda harakat qilish

1. **Birinchi**: Click yoki Payme (O'zbekiston ichi) — eng tez, eng oson,
   RavonPay'ning asosiy hamyon funksiyasini "jonlantiradi"
2. **Ikkinchi**: Payoneer — sizning asosiy g'oyangiz (dropshipping/frilanser
   daromadi) uchun eng to'g'ridan-to'g'ri yechim
3. **Uchinchi (keyinroq)**: Wise — Payoneer bilan solishtirib, qaysi biri
   yaxshiroq shart taklif qilishiga qarab
4. **Oxirgi**: PayPal — eng murakkab, kichik loyiha uchun eng past ustuvorlik

Har birida "O'zbekiston qo'llab-quvvatlanadimi va qanday shartlar bilan?"
degan savolni ALBATTA birinchi bo'lib bering — bu vaqtingizni tejaydi.
