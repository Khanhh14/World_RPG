const { sessionMs } = require('../config/auth');
const { randomBytes, createHash } = require('node:crypto');
const { hashPassword, verifyPassword, dummyHash } = require('./password.service');
function fail(status, message) { return Object.assign(new Error(message), { status }); }
function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }
function userView(row) { return { id: String(row.id), username: row.username, email: row.email }; }
// Nhận db từ ngoài để tái sử dụng pool hiện có và kiểm tra độc lập.
function createAuthService(db) {
  return {
    async register(input = {}) {
      const username = typeof input.username === 'string' ? input.username.trim() : '';
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
      const password = input.password;
      if (!/^[A-Za-z0-9_]{3,50}$/.test(username)) throw fail(400, 'Tài khoản cần 3–50 ký tự: chữ không dấu, số hoặc dấu gạch dưới.');
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, 'Email không hợp lệ.');
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw fail(400, 'Mật khẩu cần từ 8 đến 128 ký tự.');
      const hashed = await hashPassword(password);
      try {
        const [result] = await db.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hashed]);
        return { id: String(result.insertId), username, email };
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') throw fail(409, 'Tài khoản hoặc email đã được sử dụng.');
        throw error;
      }
    },
    async login(input = {}, previousToken) {
      const username = typeof input.username === 'string' ? input.username.trim() : '';
      const password = input.password;
      if (!/^[A-Za-z0-9_]{3,50}$/.test(username) || typeof password !== 'string' || password.length < 1 || password.length > 128) throw fail(400, 'Vui lòng nhập tài khoản và mật khẩu hợp lệ.');
      const [rows] = await db.execute('SELECT id, username, email, password_hash FROM users WHERE username = ? LIMIT 1', [username]);
      const match = await verifyPassword(password, rows[0]?.password_hash || dummyHash);
      if (!rows[0] || !match) throw fail(401, 'Tài khoản hoặc mật khẩu không đúng.');
      const token = randomBytes(32).toString('hex');
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        if (previousToken) await connection.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash(previousToken)]);
        await connection.execute('DELETE FROM sessions WHERE user_id = ? AND expires_at <= UTC_TIMESTAMP()', [rows[0].id]);
        await connection.execute('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))', [rows[0].id, tokenHash(token), Math.floor(sessionMs / 1000)]);
        await connection.commit();
      } catch (error) {
        await connection.rollback(); throw error;
      } finally { connection.release(); }
      return { user: userView(rows[0]), token };
    },
    async me(token) {
      if (!token) throw fail(401, 'Vui lòng đăng nhập.');
      const [rows] = await db.execute('SELECT u.id, u.username, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1', [tokenHash(token)]);
      if (!rows[0]) throw fail(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return userView(rows[0]);
    },
    async logout(token) {
      if (token) await db.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash(token)]);
    },
  };
}
module.exports = { createAuthService, tokenHash };
