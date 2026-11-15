import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PLATFORMS,segmentRect} from '../dist/src/game.js';
const input=(held=[],pressed=[],aim=null)=>({held:new Set(held),pressed:new Set(pressed),aim});
function frames(g,n,keys=input()){for(let i=0;i<n;i++)g.update(1/60,i===0?keys:{...keys,pressed:new Set()});}
test('player lands, double jumps, cannot triple jump, dash has cooldown',()=>{const g=new Game();g.start();frames(g,60);assert.equal(g.player.grounded,true);frames(g,1,input([],['Space']));assert.equal(g.player.jumps,1);frames(g,12);frames(g,1,input([],['Space']));assert.equal(g.player.jumps,2);const vy=g.player.vy;frames(g,1,input([],['Space']));assert.ok(g.player.vy>vy);frames(g,1,input([],['ShiftLeft']));assert.ok(g.player.dash>0);const cd=g.player.dashCd;frames(g,1,input([],['ShiftLeft']));assert.ok(g.player.dashCd<cd);});
test('swept collision catches a fast shot through a thin object',()=>{assert.equal(segmentRect(0,12,150,12,{x:55,y:0,w:4,h:30}),true);assert.equal(segmentRect(0,40,150,40,{x:55,y:0,w:4,h:30}),false);assert.equal(segmentRect(60,10,60,10,{x:55,y:0,w:8,h:30}),true);});
test('shooting destroys enemies and creates score; bullets expire',()=>{const g=new Game();g.start();frames(g,30);g.player.x=430;const enemy=g.enemies[0];frames(g,80,input(['KeyJ']));assert.equal(enemy.dead,true);assert.ok(g.score>0);frames(g,400);assert.ok(g.bullets.length<20);});
test('weapon pickups unlock and cycle; grenade blast damages enemies',()=>{const g=new Game();g.start();g.player.x=750;g.player.y=532;frames(g,1);assert.equal(g.player.weapon,1);assert.deepEqual(g.player.unlocked,[0,1]);frames(g,1,input([],['KeyQ']));assert.equal(g.player.weapon,0);const e=g.enemies[1];g.grenades.push({x:e.x,y:e.y,vx:0,vy:0,life:.001});frames(g,1);assert.equal(e.dead,true);});
test('checkpoint restores health, weapons and supplies after death',()=>{const g=new Game();g.start();g.player.x=2400;g.player.unlocked=[0,1];frames(g,1);assert.equal(g.checkpoint,2380);g.player.invuln=0;g.damagePlayer(200);assert.equal(g.state,'dead');g.retry();assert.equal(g.state,'playing');assert.equal(g.player.x,2380);assert.equal(g.player.hp,100);assert.equal(g.player.grenades,4);assert.deepEqual(g.player.unlocked,[0,1]);assert.equal(g.deaths,1);});
test('pausing freezes world and clears no progress',()=>{const g=new Game();g.start();frames(g,5);const before=g.snapshot();g.pause();frames(g,120,input(['KeyD']));assert.equal(g.time,before.time);assert.equal(g.player.x,before.player.x);g.pause();frames(g,10,input(['KeyD']));assert.ok(g.player.x>before.player.x);});
test('boss activates, enters overdrive, uses all patterns and can be defeated',()=>{const g=new Game();g.start();g.player.x=6100;g.player.y=532;g.player.invuln=100;frames(g,1);assert.equal(g.boss.active,true);frames(g,550);assert.ok(g.boss.attack>=3);g.damageBoss(g.boss.maxHp*.51);frames(g,1);assert.equal(g.boss.phase,2);g.damageBoss(9999);assert.equal(g.boss.dead,true);frames(g,240);assert.equal(g.state,'victory');assert.ok(g.score>=5000);});
test('fall damage returns player to a safe checkpoint',()=>{const g=new Game();g.start();g.player.y=850;frames(g,1);assert.equal(g.player.hp,70);assert.equal(g.player.x,120);assert.ok(PLATFORMS.some(p=>g.player.x>=p.x&&g.player.x<p.x+p.w));});
test('veteran mode increases incoming damage',()=>{const g=new Game({difficulty:'veteran'});g.start();g.player.invuln=0;g.damagePlayer(20);assert.equal(g.player.hp,67);});

test('complete first level using only movement, aim, jump and grenade inputs',()=>{
  const g=new Game();g.start();let jumpWait=0,grenadeWait=0;
  for(let frame=0;frame<60*180&&g.state!=='victory';frame++){
    if(g.state==='dead'){g.retry();assert.ok(g.deaths<5,'route must remain survivable');}
    const p=g.player,held=new Set(['KeyJ']),pressed=new Set();
    if(p.x<6210)held.add('KeyD');
    const target=g.boss.active&&!g.boss.dead?{x:g.boss.x+70,y:g.boss.y+140}:g.enemies.filter(e=>!e.dead&&e.x>p.x-30&&e.x<p.x+650).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    const aim=target?{x:target.x+10,y:target.y+20}:null;
    const support=PLATFORMS.find(s=>p.x+p.w>s.x&&p.x<s.x+s.w&&Math.abs(p.y+p.h-s.y)<4);
    const gapAhead=support&&support.x+support.w-(p.x+p.w)<90;
    const floorSoon=PLATFORMS.some(s=>p.x+100>s.x&&p.x+100<s.x+s.w&&s.y>=p.y+p.h&&s.y<690);
    const waveNear=g.boss.active&&g.hazards.some(h=>h.type==='wave'&&h.x>p.x&&h.x-p.x<180)&&p.grounded;
    if(jumpWait<=0&&(gapAhead||(!p.grounded&&p.vy>30&&!floorSoon&&p.jumps<2)||waveNear)){pressed.add('Space');jumpWait=10;}
    if(g.boss.active&&p.grenades>0&&grenadeWait<=0){pressed.add('KeyK');grenadeWait=90;}
    jumpWait--;grenadeWait--;g.update(1/60,{held,pressed,aim});
  }
  assert.equal(g.state,'victory');assert.equal(g.checkpoint,5900);assert.deepEqual(g.player.unlocked,[0,1,2]);assert.equal(g.boss.phase,2);assert.ok(g.boss.attack>=3,'all three boss attacks must be experienced');assert.ok(g.kills>=10);
});
