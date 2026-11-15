import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/src/game.js';
import {SLICE_END,falconOrigin,falconBarrel} from '../dist/src/slice-spec.js';
const idle={held:new Set(),pressed:new Set(),aim:null};
function tick(g,n,input=idle){for(let i=0;i<n;i++)g.update(1/60,input);}
test('sample has a timed, paused-aware opening and bounded effects',()=>{
 const events=[],g=new Game({onEvent:e=>events.push(e.type)});g.startSample();g.enemies=[];
 tick(g,600);g.pause();tick(g,600);assert.ok(g.time<10.1);g.pause();tick(g,1300);
 assert.equal(g.state,'sample-ready');assert.ok(g.time>=30&&g.time<30.1);assert.equal(events.filter(e=>e==='sampleReady').length,1);
 g.fx(0,0,900,'#fff');assert.equal(g.particles.length,240);
 g.retry();assert.equal(g.sample,'intro');assert.equal(g.state,'playing');assert.equal(g.time,0);assert.equal(g.deaths,1);
});
test('sample boss is immediately accessible, retries in its arena, and never leaks into campaign start',()=>{
 const g=new Game();g.startSample('boss');assert.equal(g.player.x,6120);assert.deepEqual(g.player.unlocked,[0,1,2]);assert.equal(g.enemies.length,0);tick(g,2);assert.equal(g.boss.active,true);
 g.player.hp=1;g.player.invuln=0;g.damagePlayer(5);g.retry();assert.equal(g.player.hp,100);assert.equal(g.player.x,6120);assert.equal(g.boss.hp,g.boss.maxHp);assert.equal(g.deaths,1);
 g.start(3);assert.equal(g.sample,null);assert.equal(g.levelIndex,3);assert.equal(g.player.x,120);assert.deepEqual(g.player.unlocked,[0]);
});
test('sample rifle registration and attack timing follow animation state',()=>{
 const g=new Game();g.startSample('boss');const p=g.player;p.grounded=true;p.aim=-.4;g.firePlayer();const o=falconOrigin(p),bullet=g.bullets[0];assert.ok(Math.abs(bullet.x-o.x-Math.cos(p.aim)*falconBarrel(p))<.0001);assert.ok(Math.abs(bullet.y-o.y-Math.sin(p.aim)*falconBarrel(p))<.0001);
 tick(g,130);assert.equal(g.boss.activeAttack,'volley');assert.ok(g.boss.actionAge>=0&&g.boss.actionAge<.3);
});
test('opening cannot run into the unfinished part of the visual sample',()=>{
 const g=new Game();g.startSample();g.player.x=SLICE_END-1;g.enemies=[];tick(g,120,{...idle,held:new Set(['KeyD'])});assert.equal(g.player.x,SLICE_END);assert.equal(g.boss.active,false);
});
test('sample boss can be defeated using movement, aiming, jumps and grenades',()=>{
 const g=new Game();g.startSample('boss');let jumpWait=0,grenadeWait=0;
 for(let f=0;f<60*120&&g.state!=='victory';f++){
  if(g.state==='dead'){g.retry();assert.ok(g.deaths<4);}
  const p=g.player,held=new Set(['KeyJ']),pressed=new Set();
  const mortar=g.hazards.find(h=>h.type==='mortar'&&!h.hit&&h.timer<.7&&Math.abs(h.x-p.x)<90);
  if(mortar)held.add(p.x<6200?'KeyD':'KeyA');
  if(jumpWait<=0&&p.grounded&&(g.hazards.some(h=>h.type==='wave'&&h.x>p.x&&h.x-p.x<210)||g.bullets.some(b=>!b.player&&b.x>p.x&&b.x-p.x<140&&Math.abs(b.y-p.y-25)<50))){pressed.add('Space');jumpWait=15;}
  if(grenadeWait<=0&&p.grenades>0){pressed.add('KeyL');grenadeWait=90;}
  jumpWait--;grenadeWait--;g.update(1/60,{held,pressed,aim:{x:g.boss.x+80,y:g.boss.y+145}});
 }
 assert.equal(g.state,'victory');assert.equal(g.boss.phase,2);assert.ok(g.boss.attack>=3);
});
