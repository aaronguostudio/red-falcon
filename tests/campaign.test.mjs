import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/src/game.js';
import {LEVELS} from '../dist/src/levels.js';
import {MESSAGES} from '../dist/src/i18n.js';
import {createProgress,PROGRESS_KEY} from '../dist/src/progress.js';

function storage(initial={}){const map=new Map(Object.entries(initial));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};}
test('eight routes have safe checkpoints and fully translated chapter and boss copy',()=>{
  assert.equal(LEVELS.length,8);assert.equal(new Set(LEVELS.map(l=>l.boss.kind)).size,8);
  for(const level of LEVELS){
    for(const x of [120,...level.checkpoints])assert.ok(level.platforms.some(p=>p.y===590&&x>=p.x&&x+28<p.x+p.w),`${level.id}: unsafe checkpoint ${x}`);
    assert.ok(level.boss.x+level.boss.w<level.world);
    for(const key of [level.nameKey,level.briefKey,level.endingKey,level.boss.nameKey,...level.sectors.flatMap(s=>[s.nameKey,s.objectiveKey]),...level.boss.patterns.map(p=>'boss.'+p)])assert.ok(MESSAGES[key],key);
  }
});
test('unlocks persist sequentially; scores stay separate by chapter and difficulty',()=>{
  const db=storage(),progress=createProgress(db);assert.equal(progress.unlocked,0);
  assert.equal(progress.complete(7,'normal',9000),false);
  for(let i=0;i<8;i++){assert.equal(progress.isOpen(i),true);progress.complete(i,'normal',1000+i);}
  const restored=createProgress(db);assert.equal(restored.unlocked,7);assert.equal(restored.completed.length,8);
  restored.complete(1,'veteran',800);restored.complete(1,'normal',500);
  assert.equal(restored.best(1,'normal'),1001);assert.equal(restored.best(1,'veteran'),800);assert.equal(restored.best(2,'veteran'),0);
});
test('malformed saves and denied storage do not prevent a campaign',()=>{
  for(const raw of ['garbage','null','{"completed":[7,-1,999,"0"]}','{"completed":{},"best":null}'])assert.equal(createProgress(storage({[PROGRESS_KEY]:raw})).unlocked,0);
  const p=createProgress({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});p.complete(0,'normal',123);assert.equal(p.unlocked,1);
});
test('players who cleared the original release retain their score and unlock chapter two',()=>{
  const progress=createProgress(storage({'red-falcon-best-normal':'21000','red-falcon-best-veteran':'18000'}));
  assert.equal(progress.unlocked,1);assert.deepEqual(progress.completed,[0]);assert.equal(progress.best(0,'normal'),21000);assert.equal(progress.best(0,'veteran'),18000);
});
test('retry and chapter changes use the current route and reset transient combat state',()=>{
  const g=new Game({level:4});g.start();g.player.x=1800;g.update(1/60);g.player.unlocked=[0,2];g.retry();
  assert.equal(g.levelIndex,4);assert.equal(g.player.x,1760);assert.equal(g.player.weapon,2);
  g.start(6);assert.equal(g.level.id,'ion');assert.equal(g.checkpoint,0);assert.equal(g.deaths,0);assert.equal(g.boss.kind,'prism');assert.deepEqual(g.player.unlocked,[0]);
  assert.throws(()=>g.start(10),RangeError);
});
test('final boss has three phases and a bounded, destructible drone brood',()=>{
  const g=new Game({level:7});g.start();g.player.x=g.boss.arena+300;g.player.y=532;g.player.invuln=1000;
  g.update(1/60);g.damageBoss(g.boss.maxHp*.73);g.update(1/60);assert.equal(g.boss.phase,3);
  for(let i=0;i<1500;i++)g.update(1/60);
  const brood=g.enemies.filter(e=>e.summoned);assert.ok(brood.length>0);assert.ok(brood.length<=4);g.damageEnemy(brood[0],999);assert.equal(brood[0].dead,true);
  g.damageBoss(99999);for(let i=0;i<240;i++)g.update(1/60);assert.equal(g.state,'victory');
});

test('conveyors move an idle grounded player; ice retains more momentum than normal terrain',()=>{
  const belt=new Game({level:3});belt.start();for(let i=0;i<45;i++)belt.update(1/60);
  const x=belt.player.x;for(let i=0;i<30;i++)belt.update(1/60);assert.ok(belt.player.x>x+25);
  const stopDistances=[0,4].map(level=>{
    const g=new Game({level});g.start();for(let i=0;i<40;i++)g.update(1/60);
    for(let i=0;i<30;i++)g.update(1/60,{held:new Set(['KeyD'])});
    const start=g.player.x;for(let i=0;i<30;i++)g.update(1/60);return g.player.x-start;
  });
  assert.ok(stopDistances[1]>stopDistances[0]*2);
});

test('vents warn before damaging and pause freezes their cycle',()=>{
  const g=new Game({level:1});g.start();g.enemies=[];g.player.x=1025;g.player.y=532;g.player.invuln=0;g.time=1.8;
  g.update(1/60);assert.equal(g.environment[0].warning,true);assert.equal(g.player.hp,100);
  g.pause();for(let i=0;i<120;i++)g.update(1/60);assert.equal(g.player.hp,100);assert.equal(g.environment[0].warning,true);
  g.pause();g.time=2.5;g.update(1/60);assert.equal(g.environment[0].active,true);assert.equal(g.player.hp,80);
});

test('a charged beam damages only after its warning and cannot hit a jumping player above it',()=>{
  const g=new Game({level:1});g.start();g.enemies=[];g.player.invuln=0;g.player.y=532;
  g.hazards.push({type:'beam',x:0,y:540,w:900,h:24,timer:.5,life:1.2});g.update(1/60);assert.equal(g.player.hp,100);
  g.hazards[0].timer=0;g.player.y=400;g.update(1/60);assert.equal(g.player.hp,100);
  g.player.y=532;g.update(1/60);assert.equal(g.player.hp,73);
});

// These playthroughs use ordinary inputs only: no teleports, health overrides or direct damage.
for(const [levelIndex,level] of LEVELS.entries())test(`input-only playthrough: ${level.id}`,()=>{
  let seed=73;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const g=new Game({level:levelIndex,random});g.start();let jumpWait=0,grenadeWait=0,dodgeX=0,dodgeUntil=0;
  for(let frame=0;frame<60*240&&g.state!=='victory';frame++){
    if(g.state==='dead'){g.retry();assert.ok(g.deaths<8,`${level.id}: excessive retries`);}
    const p=g.player,held=new Set(['KeyJ']),pressed=new Set();
    const impact=g.hazards.find(h=>h.type==='mortar'&&!h.hit&&h.timer<.9&&Math.abs(h.x-p.x)<90);
    if(impact&&g.time>dodgeUntil){dodgeX=p.x<g.boss.arena+350?g.boss.arena+510:g.boss.arena+160;dodgeUntil=g.time+1.6;}
    const destination=g.time<dodgeUntil?dodgeX:g.boss.arena+310;
    if(p.x<destination-15)held.add('KeyD');else if(p.x>destination+35&&g.boss.active)held.add('KeyA');
    const target=g.boss.active&&!g.boss.dead?{x:g.boss.x+g.boss.w*.4,y:g.boss.y+g.boss.h*.55}:g.enemies.filter(e=>!e.dead&&e.x>p.x-30&&e.x<p.x+650).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    const aim=target?{x:target.x+10,y:target.y+20}:null;
    const support=g.platforms.find(s=>p.x+p.w>s.x&&p.x<s.x+s.w&&Math.abs(p.y+p.h-s.y)<4);
    const gapAhead=support&&support.x+support.w-(p.x+p.w)<90;
    const floorSoon=g.platforms.some(s=>p.x+100>s.x&&p.x+100<s.x+s.w&&s.y>=p.y+p.h&&s.y<690);
    const waveNear=g.hazards.some(h=>h.type==='wave'&&h.x>p.x&&h.x-p.x<200);
    const beamNear=g.hazards.some(h=>h.type==='beam'&&h.timer<.35&&h.timer>0&&h.y>p.y);
    const ventNear=g.environment.some(h=>h.x>p.x&&h.x-p.x<100&&(h.active||h.warning));
    const bulletNear=g.bullets.some(b=>!b.player&&b.vx<0&&b.x>p.x&&b.x-p.x<120&&Math.abs(b.y-(p.y+24))<50);
    if(jumpWait<=0&&(gapAhead||(!p.grounded&&p.vy>30&&!floorSoon&&p.jumps<2)||p.grounded&&(waveNear||beamNear||ventNear||bulletNear))){pressed.add('Space');jumpWait=10;}
    if(g.boss.active&&bulletNear&&p.dashCd<=0)pressed.add('ShiftLeft');
    if(g.boss.active&&p.grenades>0&&grenadeWait<=0){pressed.add('KeyK');grenadeWait=90;}
    jumpWait--;grenadeWait--;g.update(1/60,{held,pressed,aim});
  }
  assert.equal(g.state,'victory',`${level.id}: stopped at ${g.player.x}, boss hp ${g.boss.hp}`);
  assert.equal(g.checkpoint,level.checkpoints.at(-1));assert.ok(g.kills>=8);assert.ok(g.boss.phase>=2);
});
