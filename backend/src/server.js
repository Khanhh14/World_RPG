const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const db = require('./config/database');
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
let server, stopping = false;
async function shutdown(code = 0) {
  if (stopping) return; stopping = true;
  const timer = setTimeout(() => process.exit(1), 10000); timer.unref();
  try {
    if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.end(); process.exitCode = code;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
async function start() {
  try {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT không hợp lệ.');
    await db.execute('SELECT 1');
    // Báo ngay khi bảng tài khoản chưa được tạo theo schema đã hướng dẫn.
    await db.execute('SELECT id, username, email, password_hash FROM users LIMIT 0');
    await db.execute('SELECT user_id, token_hash, expires_at FROM sessions LIMIT 0');
    console.log('MySQL: đã kết nối và kiểm tra bảng users/sessions.');
    server = app.listen(port, host);
    server.once('listening', () => console.log(`Backend: http://${host}:${port}\nFrontend được phép: ${require('./config/auth').origins.join(', ')}\nCtrl+C để dừng.`));
    server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Cổng ${port} đang được sử dụng.` : error.message); void shutdown(1); });
  } catch (error) { console.error('Khởi động thất bại:', error.code || '', error.message); await shutdown(1); }
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
void start();
