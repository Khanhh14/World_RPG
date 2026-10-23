const router = require('express').Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth.middleware');
const { createQuestService } = require('../services/quest.service');
const service = createQuestService(db);

router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...await service.list(req.user.id) }); } catch (error) { next(error); }
});
router.post('/progress', async (req, res, next) => {
  try { res.json({ success: true, ...await service.record(req.user.id, req.body || {}) }); } catch (error) { next(error); }
});
router.post('/:questId/claim', async (req, res, next) => {
  try { res.json({ success: true, ...await service.claim(req.user.id, req.params.questId) }); } catch (error) { next(error); }
});

module.exports = router;
