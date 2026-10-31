const test=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../src/config/huntEvent.json');
const {huntSnapshot}=require('../src/services/events.service');

test('hunt event exposes the requested milestone thresholds',()=>{
 assert.deepEqual(catalog.monsterMilestones.map(m=>m.threshold),[100,300,500,1000,1500,2000]);
 assert.deepEqual(catalog.bossMilestones.map(m=>m.threshold),[10,20,40,70,100]);
});

test('milestones unlock at their thresholds and a claimed milestone cannot be claimed again',()=>{
 const events=Array.from({length:300},()=>({action_type:'monster_kill',payload:'{}'}));
 events.push({action_type:'event_milestone_claim',payload:JSON.stringify({eventId:catalog.id,milestoneId:'monster-100'})});
 const event=huntSnapshot(events,{class_code:'swordsman'});
 assert.equal(event.monsterKills,300);
 assert.equal(event.monsterMilestones.find(m=>m.id==='monster-100').claimed,true);
 assert.equal(event.monsterMilestones.find(m=>m.id==='monster-100').canClaim,false);
 assert.equal(event.monsterMilestones.find(m=>m.id==='monster-300').canClaim,true);
 assert.equal(event.monsterMilestones.find(m=>m.id==='monster-500').canClaim,false);
});

test('boss milestone preview selects the class-specific +120 weapon',()=>{
 const event=huntSnapshot(Array.from({length:100},()=>({action_type:'boss_reward',payload:'{}'})),{class_code:'mage'});
 const final=event.bossMilestones.find(m=>m.id==='boss-100');
 assert.equal(event.bossKills,100);
 assert.equal(final.canClaim,true);
 assert.equal(final.reward.weapon.id,'doat_hon_truong');
 assert.equal(final.reward.weapon.attack,120);
});
