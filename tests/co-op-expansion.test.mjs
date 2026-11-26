import assert from 'node:assert/strict';
import test from 'node:test';
import {createArena,TICK} from '../co-op/arena.mjs';
import {gravityCourses,routeWalls} from '../co-op/expansion-maps.mjs';

function driver(room,id='one'){
  const read=()=>room.snapshot().players.find(p=>p.id===id);
  const step=(command={},frames=1)=>{
    for(let i=0;i<frames;i++){room.input(id,command);room.step(TICK);}
  };
  const settle=direction=>{
    const stage=room.checkpoint;
    if(read().polarity!==direction) step({act:true});
    step({},45);
    assert.ok(room.checkpoint!==stage || read().ground && read().polarity===direction,JSON.stringify({direction,checkpoint:room.checkpoint,player:read()}));
  };
  function walk(target,max=160){
    const stage=room.checkpoint;
    for(let i=0;i<max && stage===room.checkpoint && Math.abs(read().x-target)>7;i++) step({axis:Math.sign(target-read().x)});
    step();
    assert.ok(room.checkpoint!==stage || Math.abs(read().x-target)<9,'Position '+read().x+' vs '+target);
  }
  function navigate(target,walls){
    for(const wall of walls){
      const p=read();
      if(p.x>=wall.x+wall.w+11 || target<=wall.x-11) continue;
      if((wall.y<80 && p.polarity<0) || (wall.y>100 && p.polarity>0)) settle(-p.polarity);
      walk(Math.min(target,wall.x+wall.w+25));
    }
    walk(target);
  }
  return {read,step,settle,walk,navigate};
}

test('gravity rooms require two humans, reciprocal switches and the marked finish rails',()=>{
  const room=createArena('gravity');
  assert.ok(room.join('one'));
  const crew=['one','two'].map(id=>driver(room,id));
  crew[0].step({axis:1},95);
  assert.equal(crew[0].read().x,48);
  assert.ok(room.join('two'));
  assert.equal(room.join('three'),false);
  for(const [stage,course] of gravityCourses.entries()){
    const walls=routeWalls(course.variant);
    for(const gate of course.gates){
      for(const [slot,p] of crew.entries()){
        const pre=gate-118;
        p.navigate(Math.max(p.read().x,pre),walls);
        p.settle(course.directions[slot]);
      }
      assert.ok(crew.every(p=>p.read().open[course.gates.indexOf(gate)]),'Both turn switches on at '+gate);
      crew[0].navigate(gate+65,walls);
      crew[0].settle(course.directions[0]);
      assert.ok(crew[1].read().open[course.gates.indexOf(gate)],'The first player holds the far switch');
      crew[1].navigate(gate+65,walls);
    }
    for(const [slot,p] of crew.entries()){
      p.navigate(878,walls);
      if(room.checkpoint===stage && !room.complete) p.settle(course.directions[slot]);
    }
    assert.ok(room.complete || room.checkpoint===stage+1);
  }
  assert.ok(room.complete);
});

test('tank CPU moves and shoots, leaves when a human joins and returns on disconnect',()=>{
  const room=createArena('tanks');
  room.join('one');
  const bot=room.snapshot().players.find(p=>p.bot);
  assert.ok(bot);
  let firing=false;
  for(let i=0;i<90;i++){
    room.step(TICK);
    firing ||= room.snapshot().projectiles.length>0;
  }
  assert.ok(firing);
  const moved=room.snapshot().players.find(p=>p.bot);
  assert.ok(Math.hypot(moved.x-bot.x,moved.y-bot.y)>25);
  room.join('two');
  assert.equal(room.snapshot().players.some(p=>p.bot),false);
  room.leave('two');
  assert.equal(room.snapshot().players.some(p=>p.bot),true);
});
test('brawler strike changes damage and knockback and comet racers can flip',()=>{
  const room=createArena('brawl');
  room.join('one');room.join('two');
  const one=driver(room);
  one.walk(735,95);
  one.step({act:true});
  assert.ok(driver(room,'two').read().damage>0);
  const race=createArena('comets');
  race.join('one');
  const pilot=driver(race);
  pilot.settle(-1);
  assert.equal(pilot.read().y,64);
  pilot.settle(1);
  assert.equal(pilot.read().y,476);
});


test('tank rounds bounce on solid walls before their lifetime ends',()=>{
  const room=createArena('tanks');
  room.join('one');room.join('two');
  const pilot=driver(room);
  pilot.step({act:true});
  assert.ok(room.snapshot().projectiles[0].x>100);
  let peakX=0, reflected=false;
  for(let i=0;i<28;i++){
    pilot.step();
    const shot=room.snapshot().projectiles[0];
    if(shot){
      reflected ||= shot.x<peakX-15;
      peakX=Math.max(peakX,shot.x);
    }
  }
  assert.ok(reflected && peakX>185 && peakX<220);
});

test('the comet match counts three completed legs, then rotates the layout',()=>{
  const room=createArena('comets');
  room.join('one');
  const pilot=driver(room);
  for(let lap=1;lap<=3;lap++){
    pilot.navigate(893,routeWalls(0));
    pilot.step({axis:1},3);
    assert.equal(pilot.read().score,lap);
  }
  assert.equal(room.snapshot().winner,'one');
  pilot.step({},100);
  assert.equal(room.snapshot().round,2);
  assert.equal(room.snapshot().variant,1);
  assert.equal(pilot.read().score,0);
});
