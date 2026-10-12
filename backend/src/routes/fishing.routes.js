const router = require('express').Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth.middleware');
const { createFishingService } = require('../services/fishing.service');
const service = createFishingService(db);
const cleanup = setInterval(() => service.prune(), 60000); cleanup.unref();
router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const handle = fn => async (req, res, next) => {
  try { res.json({ success: true, ...await fn(req) }); } catch (error) { next(error); }
};
router.post('/bootstrap', handle(req => service.bootstrap(req.user.id)));
router.post('/rod', handle(req => service.grantRod(req.user.id)));
router.post('/start', handle(req => service.start(req.user.id, req.body)));
router.post('/finish', handle(req => service.finish(req.user.id, req.body)));
router.post('/cancel', handle(req => service.cancel(req.user.id, req.body?.attemptId)));
module.exports = router;
