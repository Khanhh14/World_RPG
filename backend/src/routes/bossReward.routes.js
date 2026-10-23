const router=require('express').Router();
const {requireAuth}=require('../middleware/auth.middleware');
const service=require('../services/bossReward.service').createBossRewardService(require('../config/database'));
router.use(requireAuth);
router.get('/status',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json({success:true,...await service.status(req.user.id,req.query.bossId || 'naga')});}catch(e){next(e);}});
router.post('/claim',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json({success:true,...await service.claim(req.user.id,req.body||{})});}catch(e){next(e);}});
module.exports=router;
