
console.log('Đang nạp app.js:', __filename);
const express = require('express');
const db = require('./config/database');
const { browserAccess } = require('./middleware/request.middleware');
const app = express();
app.disable('x-powered-by');
app.use(browserAccess);
app.use(express.json({ limit: '16kb' }));
app.get('/', (req, res) => res.json({ success: true, message: 'Backend Tiny RPG đang hoạt động!' }));
app.get('/api/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { await db.execute('SELECT 1'); res.json({ success: true, server: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ success: false, server: 'ok', database: 'disconnected' }); }
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/characters', require('./routes/character.routes'));
// Gắn API nhân vật/mua đồ tại đây sau khi triển khai; dùng requireAuth để bảo vệ.
app.use((req, res) => res.status(404).json({ success: false, message: 'API không tồn tại.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'JSON không hợp lệ.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Dữ liệu quá lớn.' });
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  if (status === 500) console.error('Lỗi API:', error.code || error.message);
  res.status(status).json({ success: false, message: status === 500 ? 'Máy chủ gặp lỗi. Vui lòng thử lại.' : error.message });
});
module.exports = app;
