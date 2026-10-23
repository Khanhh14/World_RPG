const configuredHours = Number(process.env.SESSION_HOURS ?? 2);
const sessionHours = Number.isFinite(configuredHours) && configuredHours >= 0.0167 && configuredHours <= 168 ? configuredHours : 2;
const production = process.env.NODE_ENV === 'production';
const origins = (process.env.FRONTEND_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173').split(',').map(value => value.trim()).filter(Boolean);
module.exports = {
  origins,
  cookieName: 'tiny_rpg_session_v2',
  cookie: { httpOnly: true, secure: production, sameSite: 'lax', path: '/api' },
  sessionMs: Math.round(sessionHours * 60 * 60 * 1000),
};
