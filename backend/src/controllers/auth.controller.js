const db = require('../config/database');
const { createAuthService } = require('../services/auth.service');
const { readToken } = require('../middleware/auth.middleware');
const { cookieName, cookie, sessionMs } = require('../config/auth');
const service = createAuthService(db);
exports.register = async (req, res, next) => {
  try { const user = await service.register(req.body || {}); res.status(201).json({ success: true, user }); }
  catch (error) { next(error); }
};
exports.login = async (req, res, next) => {
  try {
    const { user, token } = await service.login(req.body || {}, readToken(req));
    res.cookie(cookieName, token, { ...cookie, maxAge: sessionMs });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};
exports.me = (req, res) => res.json({ success: true, user: req.user });
exports.logout = async (req, res, next) => {
  try {
    await service.logout(readToken(req));
    res.clearCookie(cookieName, cookie);
    res.json({ success: true });
  } catch (error) { next(error); }
};
