const { origins } = require('../config/auth');
// CORS theo danh sách chính xác; kiểm tra Origin cho mọi thay đổi tài khoản.
function browserAccess(req, res, next) {
  const origin = req.headers.origin;
  res.vary('Origin');
  if (origin && !origins.includes(origin)) return res.status(403).json({ success: false, message: 'Địa chỉ frontend chưa được cho phép.' });
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  if (!['GET', 'HEAD'].includes(req.method)) {
    if (!origin || !origins.includes(origin)) return res.status(403).json({ success: false, message: 'Yêu cầu phải được gửi từ giao diện game.' });
    if (!req.is('application/json')) return res.status(415).json({ success: false, message: 'Dữ liệu phải có định dạng JSON.' });
  }
  next();
}
// Dùng cho một tiến trình backend local. Khi chạy nhiều server, chuyển sang kho giới hạn chung.
function attemptLimit({ limit = 20, windowMs = 15 * 60 * 1000 } = {}) {
  const attempts = new Map();
  const timer = setInterval(() => { const now = Date.now(); for (const [ip, value] of attempts) if (value.until <= now) attempts.delete(ip); }, 60000);
  timer.unref();
  return (req, res, next) => {
    const now = Date.now(), ip = req.ip || req.socket.remoteAddress;
    let record = attempts.get(ip);
    if (!record || record.until <= now) {
      if (attempts.size >= 10000) return res.status(503).json({ success: false, message: 'Máy chủ đang bận. Vui lòng thử lại sau.' });
      record = { count: 0, until: now + windowMs }; attempts.set(ip, record);
    }
    if (++record.count > limit) {
      res.set('Retry-After', String(Math.ceil((record.until - now) / 1000)));
      return res.status(429).json({ success: false, message: 'Bạn thử quá nhiều lần. Vui lòng thử lại sau 15 phút.' });
    }
    next();
  };
}
module.exports = { browserAccess, attemptLimit };
