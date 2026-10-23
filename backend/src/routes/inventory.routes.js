const router = require('express').Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth.middleware');
const service = require('../services/inventory.service').createInventoryService(db);
router.use(requireAuth);
router.get('/state', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.load(req.user.id) }); }
  catch (error) { next(error); }
});
router.post('/use', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.use(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
router.post('/exchange-food', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.exchangeFood(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
router.post('/harvest-mushroom', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.harvestMushroom(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
router.post('/monster-drop', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.collectMonsterDrop(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
router.post('/exchange-monster-materials', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.exchangeMonsterMaterials(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
router.post('/exchange-mushrooms', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.exchangeMushrooms(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
router.post('/equipment', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.equip(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
module.exports = router;