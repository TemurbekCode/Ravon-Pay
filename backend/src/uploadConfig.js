import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { DATA_DIR, uid } from './db.js';

// Hozircha lokal diskka saqlanadi (SQLite fayli bilan bir xil joyda) — bu ham
// production'da (Render'ning bepul tarifida, doimiy disksiz) yo'qolishi mumkin,
// xuddi backend/data/ravonpay.db kabi. Doimiy saqlash uchun kelajakda S3/Cloudinary
// kabi bulut xizmatiga ko'chirish kerak bo'ladi (kod shu bitta faylda o'zgaradi).
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uid('doc')}${ext}`);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) return cb(new Error("Faqat JPG, PNG yoki PDF fayl qabul qilinadi"));
    cb(null, true);
  },
});
