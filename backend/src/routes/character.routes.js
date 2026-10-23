const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { createCharacterService } = require('../services/character.service');
const service = createCharacterService(require('../config/database'));
router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const runtime = require('../services/runtime.service').createRuntimeService(require('../config/database'));
router.get('/runtime', async (req,res,next) => {try{res.json({success:true,...await runtime.load(req.user.id)});}catch(e){next(e);}});
router.post('/runtime', async (req,res,next) => {try{res.json({success:true,...await runtime.save(req.user.id,req.body)});}catch(e){next(e);}});
router.get('/me', async (req, res, next) => {
  try { res.json({ success: true, ...await service.current(req.user.id) }); } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, character: await service.create(req.user.id, req.body || {}) }); } catch (e) { next(e); }
});
module.exports = router;
