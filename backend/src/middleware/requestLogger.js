// Render (va shunga o'xshash hosting) konsolga (stdout/stderr) yozilgan
// narsani avtomatik yig'ib, qidiriladigan qilib beradi — shuning uchun faylga
// emas, konsolga tuzilgan (structured) qatorlar chiqaramiz. Har bir so'rov:
// vaqt, metod, yo'l, holat kodi, davomiyligi. 5xx xatolar alohida ko'rinadi.
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
    if (res.statusCode >= 500) console.error(line);
    else if (res.statusCode >= 400) console.warn(line);
    else console.log(line);
  });
  next();
}
