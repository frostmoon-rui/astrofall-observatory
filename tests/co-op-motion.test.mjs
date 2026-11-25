
import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotion} from '../co-op/motion.mjs';
import {createArena,TICK} from '../co-op/arena.mjs';

const state=(clock,x,spawnId=1,checkpoint=0)=>({mode:'relay',clock,checkpoint,
  players:[{id:'remote',x,y:10,spawnId},{id:'local',x,y:10,vx:244,spawnId}]});

test('remote motion advances between snapshots and local motion follows the latest position',()=>{
  const motion=createMotion();
  motion.push(state(0,0),0);
  motion.sample(5,'local',1);
  motion.push(state(.06,60),60);
  motion.push(state(.12,120),120);
  const first=motion.sample(145,'local',1);
  const second=motion.sample(155,'local',1);
  assert.equal(first.players[0].x,40);
  assert.equal(second.players[0].x,50);
  assert.ok(second.players[1].x>first.players[1].x);
  assert.ok(second.players[1].x>second.players[0].x);
});

test('respawns, checkpoint transitions, and a long pause snap directly to the new course position',()=>{
  const motion=createMotion();
  motion.push(state(.3,400),270);
  motion.sample(280,'local',1);
  motion.push(state(.36,42,2),330);
  assert.deepEqual(motion.sample(332,'local',1).players.map(p=>p.x),[42,42]);
  motion.push(state(.42,882,3,1),390);
  assert.deepEqual(motion.sample(392,'local',1).players.map(p=>p.x),[882,882]);
  motion.push(state(.5,930,3,1),870);
  assert.deepEqual(motion.sample(871,'local',1).players.map(p=>p.x),[930,930]);
});

test('a stopped input stream releases held movement and link controls',()=>{
  const arena=createArena('relay');
  arena.join('local');
  arena.input('local',{axis:1,link:true});
  for(let tick=0;tick<27;tick++) arena.step(TICK);
  const [player]=arena.snapshot().players;
  assert.equal(player.vx,0);
  assert.equal(player.link,false);
  assert.ok(player.x>42 && player.x<225);
});
