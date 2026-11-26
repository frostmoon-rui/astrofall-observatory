
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
  assert.ok(Math.abs(first.players[0].x-40)<.01);
  assert.ok(Math.abs(second.players[0].x-50)<.01);
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
  motion.push(state(.5,930,3,1),1490);
  assert.deepEqual(motion.sample(1491,'local',1).players.map(p=>p.x),[930,930]);
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


test('local movement and jump render while a 240 ms packet gap delays the server',()=>{
  const arena=createArena('relay');
  arena.join('local');
  arena.join('remote');
  const motion=createMotion();
  motion.push(arena.snapshot(),10,'local');
  motion.sample(16,'local');
  motion.control({axis:1,jump:true,link:false},20);
  motion.control({axis:1,jump:false,link:false},23);
  const first=motion.sample(33,'local');
  assert.ok(first.players[0].x>42 && first.players[0].y<442);
  for(let now=49;now<241;now+=16) motion.sample(now,'local');
  const last=motion.sample(241,'local');
  assert.ok(last.players[0].x>85 && last.players[0].y<420);
  assert.equal(last.players[1].x,42);
  assert.equal(arena.snapshot().players[0].x,42);
});

test('prediction stays blocked at unopened gates and the server owns checkpoints',()=>{
  const arena=createArena('relay');
  arena.join('local');
  const snapshot=arena.snapshot();
  snapshot.players[0].x=791;
  const motion=createMotion();
  motion.push(snapshot,10,'local');
  motion.control({axis:1,jump:false,link:false},11);
  for(let now=17;now<240;now+=16){
    const render=motion.sample(now,'local');
    assert.ok(render.players[0].x<=792);
    assert.equal(render.state.checkpoint,0);
  }
});

test('a runner recovers once, after the countdown, without freezing the room',()=>{
  const arena=createArena('runner');
  arena.join('local');
  arena.join('remote');
  let falling, advancing, partnerJumped=false;
  for(let tick=0;tick<100;tick++){
    arena.step(TICK);
    [falling,advancing]=arena.snapshot().players;
    if(!partnerJumped && advancing.x>219){
      arena.input('remote',{axis:1,jump:true});
      partnerJumped=true;
    }
    if(falling.respawnAt!=null) break;
  }
  assert.ok(falling.respawnAt>0);
  const old=falling, partnerX=advancing.x;
  arena.input('local',{axis:1,jump:true,seq:2});
  for(let tick=0;tick<15;tick++) arena.step(TICK);
  [falling,advancing]=arena.snapshot().players;
  assert.equal(falling.x,old.x);
  assert.equal(falling.spawnId,old.spawnId);
  assert.equal(falling.ack,2);
  assert.ok(advancing.respawnAt==null && advancing.x>partnerX);
  for(let tick=0;tick<15;tick++) arena.step(TICK);
  const [reset]=arena.snapshot().players;
  assert.equal(reset.respawnAt,null);
  assert.equal(reset.spawnId,old.spawnId+1);
  assert.ok(reset.ground && reset.x>=42 && reset.x<85);
});

test('predicted fall shows waiting even when the server confirmation is delayed',()=>{
  const arena=createArena('runner');
  arena.join('local');
  const state=arena.snapshot();
  Object.assign(state.players[0],{x:280,y:580,vy:700,ground:false});
  const motion=createMotion();
  motion.push(state,10,'local');
  const view=motion.sample(26,'local');
  assert.ok(view.players[0].respawnAt>0);
  assert.equal(view.players[0].spawnId,1);
  for(let now=42;now<1200;now+=16) assert.ok(motion.sample(now,'local').players[0].respawnAt>0);
});

test('packets between painted frames do not change steady movement speed',()=>{
  const arena=createArena('relay');
  arena.join('local');
  const motion=createMotion();
  const ctrl={axis:1,jump:false,link:false};
  const start=1000;
  motion.push(arena.snapshot(),start,'local');
  motion.control(ctrl,start);
  motion.sample(start,'local');
  let before=42;
  for(let tick=1;tick<=30;tick++){
    const time=start+tick*10;
    if(tick%3===0){
      motion.track(tick,time-5);
      arena.input('local',{...ctrl,seq:tick});
      arena.step(.03);
      motion.push(arena.snapshot(),time-2,'local');
    }
    const x=motion.sample(time,'local').players[0].x;
    assert.ok(Math.abs(x-before-2.44)<.32,JSON.stringify({x,before,time}));
    before=x;
  }
});
