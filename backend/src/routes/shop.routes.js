const router = require('express').Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth.middleware');
const service = require('../services/shop.service').createShopService(db);
router.use(requireAuth);
router.post('/buy', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, ...await service.buy(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});
const resale=require('../services/resale.service').createResaleService(db);
router.post('/sell',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json({success:true,...await resale.sell(req.user.id,req.body||{})});}catch(e){next(e);}});
module.exports = router;
