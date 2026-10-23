const router=require('express').Router();
const {requireAuth}=require('../middleware/auth.middleware');
const service=require('../services/daily.service').createDailyService(require('../config/database'));
router.use(requireAuth);
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/',async(req,res,next)=>{try{res.json({success:true,...await service.load(req.user.id)});}catch(e){next(e);}});
for(const action of ['claim','collect'])router.post('/'+action,async(req,res,next)=>{try{res.json({success:true,...await service[action](req.user.id,req.body||{})});}catch(e){next(e);}});
module.exports=router;
