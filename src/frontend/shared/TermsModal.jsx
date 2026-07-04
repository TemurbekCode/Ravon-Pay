// Ilova haqida to'liq ma'lumot — hujjat ko'rinishidagi modal. Sozlamalar
// bo'limidagi "Foydalanish shartlari" tugmasi ochadi (shaxsiy va biznes
// tomonlarida bir xil).
export default function TermsModal({ show, onClose }) {
  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal terms-modal">
        <div className="modal-head">
          <h3>Foydalanish shartlari va maxfiylik siyosati</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="doc-body">
          <section>
            <h4>1. RavonPay haqida</h4>
            <p>RavonPay — Markaziy Osiyo foydalanuvchilari uchun yaratilgan raqamli hamyon va to'lov platformasi. Xizmat orqali foydalanuvchilar pul jo'natishi va qabul qilishi, kartalarini boshqarishi, kommunal xizmatlar uchun to'lov qilishi, valyuta kursini kuzatishi, shuningdek biznes egalari o'z mijozlaridan onlayn to'lov qabul qilishi mumkin.</p>
          </section>
          <section>
            <h4>2. Xizmat tavsifi</h4>
            <p>Shaxsiy foydalanuvchilar uchun asosiy funksiyalar — pul o'tkazmalari, hamyon, kartalar va kommunal to'lovlar — doimiy ravishda bepul taqdim etiladi. Biznes foydalanuvchilari uchun to'lov havolalari, hisob-fakturalar, checkout sahifalari, jamoa boshqaruvi va analitika kabi kengaytirilgan imkoniyatlar oylik yoki yillik obuna asosida ishlaydi.</p>
          </section>
          <section>
            <h4>3. Ro'yxatdan o'tish va hisob xavfsizligi</h4>
            <p>Hisobga kirish telefon raqami va unga yuboriladigan bir martalik tasdiqlash kodi (SMS) orqali amalga oshiriladi — bu parolga asoslangan tizimlarga xos bo'lgan "unutilgan parol" muammosini bartaraf etadi. Email ixtiyoriy bo'lib, hisobni tiklash uchun istalgan vaqtda Sozlamalar bo'limidan qo'shilishi, o'zgartirilishi yoki olib tashlanishi mumkin. Foydalanuvchi o'z hisobiga kirish ma'lumotlarining maxfiyligini ta'minlash uchun javobgardir.</p>
          </section>
          <section>
            <h4>4. To'lovlar va komissiyalar</h4>
            <p>Shaxsiy foydalanuvchilar o'rtasidagi pul o'tkazmalari (P2P) hech qanday komissiyasiz amalga oshiriladi. RavonPay daromadi asosan biznes mijozlarning obuna to'lovlaridan va biznes hisobiga tushgan to'lovlar bo'yicha kichik xizmat haqidan shakllanadi. Barcha tariflar Sozlamalar va biznes panelidagi obuna bo'limida ochiq ko'rsatiladi.</p>
          </section>
          <section>
            <h4>5. Ma'lumotlar himoyasi va maxfiylik</h4>
            <p>Foydalanuvchi ma'lumotlari (ism, telefon raqami, tranzaksiyalar tarixi) shifrlangan holda saqlanadi va faqat xizmat ko'rsatish maqsadida ishlatiladi. Ma'lumotlar foydalanuvchining aniq roziligisiz uchinchi tomon tashkilotlarga reklama yoki boshqa maqsadlarda berilmaydi. Qonun talab qilgan hollarda vakolatli davlat organlariga ma'lumot taqdim etilishi mumkin.</p>
          </section>
          <section>
            <h4>6. Biznes hisoblari va tekshiruv</h4>
            <p>Biznes hisoblari uchun kompaniya nomi, soliq to'lovchining identifikatsiya raqami (STIR) va yuridik manzil kabi ma'lumotlarni taqdim etish tavsiya etiladi — bu hisobning ishonchliligini oshiradi va yuqori limitli operatsiyalarga yo'l ochadi. Ma'lumotlar taqdim etilgandan so'ng "Ko'rib chiqilmoqda" holatiga o'tadi va tekshiruv yakunlanguncha shu holatda qoladi.</p>
          </section>
          <section>
            <h4>7. Foydalanuvchi majburiyatlari</h4>
            <p>Foydalanuvchi platformadan noqonuniy faoliyat (pul yuvish, firibgarlik, boshqa shaxslarni aldash va h.k.) uchun foydalanmaslikka, ro'yxatdan o'tishda aniq va haqiqiy ma'lumot taqdim etishga majburdir. Shubhali faoliyat aniqlangan taqdirda hisob vaqtincha cheklanishi mumkin.</p>
          </section>
          <section>
            <h4>8. Shartlarning o'zgarishi</h4>
            <p>RavonPay ushbu shartlarni vaqti-vaqti bilan yangilashi mumkin. Muhim o'zgarishlar haqida foydalanuvchilarga ilova ichidagi bildirishnomalar orqali xabar beriladi.</p>
          </section>
        </div>
        <div className="doc-footer">
          <span>Versiya 1.0.0</span>
          <span>Oxirgi yangilanish: 2026-yil 4-iyul</span>
          <span>© {new Date().getFullYear()} RavonPay</span>
        </div>
      </div>
    </div>
  );
}
