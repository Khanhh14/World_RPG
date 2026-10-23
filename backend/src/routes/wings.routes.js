const router = require('express').Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth.middleware');
const service = require('../services/wings.service').createWingsService(db);
router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', async (req, res, next) => {
 try { res.json({ success:true, ...await service.load(req.user.id) }); } catch (error) { next(error); }
});
router.post('/:action', async (req, res, next) => {
 try { res.json({ success:true, ...await service.mutate(req.user.id, req.params.action, req.body || {}) }); } catch (error) { next(error); }
});
module.exports = router;
