const router=require('express').Router();
const {requireAuth}=require('../middleware/auth.middleware');
const service=require('../services/events.service').createEventsService(require('../config/database'));
router.use(requireAuth);
router.get('/',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json({success:true,...await service.load(req.user.id)});}catch(e){next(e);}});
router.post('/exchange',async(req,res,next)=>{try{res.set('Cache-Control','no-store').json({success:true,...await service.exchange(req.user.id,req.body||{})});}catch(e){next(e);}});
module.exports=router;
