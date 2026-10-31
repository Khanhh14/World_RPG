const test=require('node:test');
const assert=require('node:assert/strict');
const {killRewards}=require('../src/services/quest.service');
const {validate}=require('../src/services/runtime.service');
const resale=require('../src/config/resale.json');

test('dragon ruins grant 50 percent more experience and gold than the dragon forest',()=>{
 const forest=killRewards['dia-long-forest'],ruins=killRewards['dragon-ruins'];
 assert.equal(ruins.exp,Math.ceil(forest.exp*1.5));
 assert.equal(ruins.gold,Math.ceil(forest.gold*1.5));
});

test('dragon ruins is a valid saved map and bounds its runtime coordinates',()=>{
 const position={mapId:'dragon-ruins',x:2016,y:1632,hp:100,mp:50,version:0,requestId:'00000000-0000-4000-8000-000000000001'};
 assert.doesNotThrow(()=>validate(position));
 assert.throws(()=>validate({...position,x:2017}),{status:400});
});

test('dragon ruin drops are local materials with map-bound resale credit',()=>{
 for(const id of ['dragon_bone','ancient_dragon_scale','jade_dragon_core']){
  assert.equal(resale[id].local,true);
  assert.equal(resale[id].mapId,'dragon-ruins');
  assert.equal(resale[id].exchangeCost,1);
 }
});
