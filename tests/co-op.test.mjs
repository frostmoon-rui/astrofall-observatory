import assert from 'node:assert/strict';
import test from 'node:test';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createArena,gatePads,neutral,segment,SPAN,MAX_PLAYERS} from '../co-op/arena.mjs';
import {createGameServer} from '../co-op/server.mjs';

const tick = (arena,frames) => {for(let i=0;i<frames;i++) arena.step(1/30);};
const position = (arena,id) => arena.snapshot().players.find(p=>p.id===id);
function reachPlate(arena,id,index,slot,count) {
  const pad=gatePads(index,count)[slot];
  const target=pad.x+3;
  const [edge]=segment(index,'relay').gap;
  const end=segment(index,'relay').gap[1];
  let jumped=false;
  for(let frame=0;frame<260;frame++){
    const p=position(arena,id);
    if(p.x>=target && p.y>438) {arena.input(id,neutral());return;}
    const jump = !jumped && p.x+(end-edge>140?12:24)>=edge;
    if(jump) jumped=true;
    if(p.x%SPAN<95) jumped=false;
    arena.input(id,{axis:p.x>=target?0:1,jump});
    tick(arena,1);
  }
  throw Error('Could not reach plate '+slot);
}

test('membership adds and removes doors and a late arrival uses the shared checkpoint',()=>{
  const arena=createArena('relay');
  arena.join('first');arena.join('second');
  reachPlate(arena,'first',0,0,2);
  assert.equal(arena.snapshot().checkpoint,0);
  reachPlate(arena,'second',0,1,2);
  tick(arena,23);
  assert.equal(arena.snapshot().checkpoint,1);
  assert.ok(arena.join('late'));
  assert.ok(position(arena,'late').x>=SPAN);
  assert.equal(gatePads(1,arena.size).length,3);
  arena.leave('second');
  assert.equal(gatePads(1,arena.size).length,2);
  for(let i=arena.size;i<MAX_PLAYERS;i++) assert.ok(arena.join(String(i)));
  assert.equal(arena.join('overflow'),false);
});

test('opposite phases link for an actual higher jump and runner rooms extend beyond the relay map',()=>{
  const solo=createArena('relay');solo.join('one');
  solo.input('one',{jump:true});tick(solo,7);
  const paired=createArena('relay');
  paired.join('one');paired.join('two');
  paired.input('one',{link:true,jump:true});paired.input('two',{link:true});tick(paired,7);
  assert.ok(position(paired,'one').y+25 < position(solo,'one').y);
  assert.deepEqual(segment(120,'runner').x,120*SPAN);
  assert.equal(segment(120,'relay'),null);
  const runner=createArena('runner');runner.join('one');
  const start=position(runner,'one').x;
  tick(runner,15);
  assert.ok(position(runner,'one').x>start);
});

test('real WebSocket clients join during play and disconnect without restarting the room',async ()=>{
  const server=createGameServer();
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const address='ws://127.0.0.1:'+server.address().port+'/co-op/socket/relay/test-room';
  const sockets=[];
  const join=()=>{
    const ws=new WebSocket(address);
    sockets.push(ws);
    let id;
    const state=[];
    ws.on('message',raw=>{
      const data=JSON.parse(raw.toString());
      if(data.type==='welcome') id=data.id; else state.push(data);
    });
    return {ws,state,get id(){return id;}};
  };
  async function until(predicate) {
    for(let i=0;i<70;i++){
      if(predicate()) return;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.fail('WebSocket state did not reach expected values');
  }
  try {
    const one=join();
    await until(()=>one.id&&one.state.at(-1)?.players.length===1);
    one.ws.send(JSON.stringify({axis:1}));
    await until(()=>one.state.at(-1)?.players[0].x>65);
    const two=join(), three=join();
    await until(()=>two.id&&three.id&&one.state.at(-1)?.players.length===3);
    assert.ok(one.state.at(-1).players[0].x>65);
    two.ws.close();
    await until(()=>one.state.at(-1)?.players.length===2);
    assert.ok(one.state.at(-1).players.some(player=>player.id===three.id));
  } finally {
    for(const socket of sockets) socket.terminate();
    await new Promise(resolve=>server.close(resolve));
  }
});

test('relay stations accept rapid interaction in player order and report readiness',()=>{
  const arena=createArena('relay',{checkpoint:2});
  for(const id of ['first','second']) arena.join(id);
  reachPlate(arena,'first',2,0,2);
  reachPlate(arena,'second',2,1,2);
  assert.deepEqual(arena.snapshot().relayStations,[true,true]);
  function tap(id){
    arena.input(id,{act:true});
    arena.input(id,{act:false});
    tick(arena,1);
  }
  tap('second');
  assert.equal(arena.snapshot().relayStep,0);
  tap('first');
  assert.equal(arena.snapshot().relayStep,1);
  assert.ok(arena.snapshot().relayTime>0);
  tap('second');
  assert.equal(arena.snapshot().checkpoint,3);
});
