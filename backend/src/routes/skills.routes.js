const router=require('express').Router();
const db=require('../config/database');
const {requireAuth}=require('../middleware/auth.middleware');
const service=require('../services/skills.service').createSkillsService(db);
router.use(requireAuth);
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/',async(req,res,next)=>{try{res.json({success:true,...await service.load(req.user.id)});}catch(e){next(e);}});
router.post('/:action',async(req,res,next)=>{try{res.json({success:true,...await service.mutate(req.user.id,req.params.action,req.body||{})});}catch(e){next(e);}});
module.exports=router;
