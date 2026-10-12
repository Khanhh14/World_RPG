const db = require('../config/database');
const { createAuthService } = require('../services/auth.service');
const { cookieName } = require('../config/auth');
const service = createAuthService(db);
function readToken(req) {
  const cookie = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='));
  const value = cookie?.slice(cookieName.length + 1);
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
async function requireAuth(req, res, next) {
  try { req.user = await service.me(readToken(req)); next(); }
  catch (error) { next(error); }
}
module.exports = { readToken, requireAuth };
