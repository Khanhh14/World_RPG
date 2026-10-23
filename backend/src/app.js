
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
app.use('/api/fishing', require('./routes/fishing.routes'));
app.use('/api/quests', require('./routes/quest.routes'));
app.use('/api/shop', require('./routes/shop.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/wings', require('./routes/wings.routes'));
app.use('/api/boss-rewards', require('./routes/bossReward.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/daily', require('./routes/daily.routes'));
app.use('/api/skills', require('./routes/skills.routes'));
app.use((req, res) => res.status(404).json({ success: false, message: 'API không tồn tại.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'JSON không hợp lệ.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Dữ liệu quá lớn.' });
  const status = error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status === 500) console.error('Lỗi API:', error.code || error.message);
  res.status(status).json({ success: false, message: status === 500 ? 'Máy chủ gặp lỗi. Vui lòng thử lại.' : error.message });
});
module.exports = app;
