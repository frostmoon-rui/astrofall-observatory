import test from 'node:test';
import assert from 'node:assert/strict';
import {createArena,TICK} from '../co-op/arena.mjs';
import {platformLevels} from '../co-op/legacy-platform-levels.mjs';

const step=(room,n=1)=>{for(let i=0;i<n;i++)room.step(TICK);};

test('Jump Race shares a round and obstacle course; players can double-jump independently',()=>{
  const room=createArena('jump');
  room.join('one');room.join('two');
  step(room,64);
  assert.equal(room.snapshot().round,1);
  room.input('one',{jump:true,seq:1});step(room,4);
  room.input('one',{jump:false,seq:2});step(room);
  room.input('one',{jump:true,seq:3});step(room);
  const [one,two]=room.snapshot().players;
  assert.equal(one.jumps,2);
  assert.ok(one.y<two.y);
  assert.equal(two.y,291);
  assert.equal(one.ack,3);
  step(room,32);
  assert.ok(room.snapshot().obstacles.length>0);
  room.join('mid-round');
  assert.equal(room.snapshot().players.at(-1).alive,true);
  assert.equal(room.snapshot().round,1);
  const current=room.snapshot().round;
  step(room,200);
  assert.ok(room.snapshot().round>current);
});

test('Platform Co-op uses the original eight stages and shares switches and the flag requirement',()=>{
  assert.equal(platformLevels.length,8);
  const switches=createArena('platform',{checkpoint:4});
  switches.join('one');switches.join('two');
  for(let i=0;i<8;i++){switches.input('one',{axis:1});step(switches);}
  assert.equal(switches.snapshot().switchCount,1);
  assert.equal(switches.snapshot().players[1].x,42);
  const room=createArena('platform');
  room.join('one');room.join('two');
  function reachFlag(id){
    for(let i=0;i<2000;i++){
      const state=room.snapshot();
      if(state.checkpoint>0)return;
      const p=state.players.find(item=>item.id===id);
      if(p.reached)return;
      const ledge=platformLevels[0].ledges[p.ride];
      const jump=Boolean(ledge && p.ride<platformLevels[0].goal.ledge && p.x+24>ledge.x+ledge.w-18);
      room.input(id,{axis:1,jump});
      step(room);
    }
    assert.fail('Player could not reach the original flag');
  }
  reachFlag('one');
  assert.equal(room.snapshot().checkpoint,0);
  assert.equal(room.snapshot().players[0].reached,true);
  assert.ok(room.snapshot().spawnLedge>0);
  room.join('late');
  assert.ok(room.snapshot().players.at(-1).x>42);
  reachFlag('two');
  assert.equal(room.snapshot().checkpoint,0);
  room.leave('late');
  step(room);
  assert.equal(room.snapshot().checkpoint,1);
  assert.equal(room.snapshot().players.every(p=>p.x===42),true);
});
