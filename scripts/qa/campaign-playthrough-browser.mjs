// Entire campaign through ordinary browser keyboard/mouse inputs, with no state overrides.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {LEVELS} from '../../dist/src/levels.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT||'/tmp/red-falcon-campaign-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const snap=()=>page.evaluate(()=>redFalcon.snapshot());
try{
 await page.goto(process.env.GAME_URL||'http://red-falcon.localhost:4177');await page.waitForFunction(()=>redFalcon.metrics.assetsReady);await page.clock.install();await page.locator('#start').click();
 for(let index=0;index<8;index++){
  let held=new Set(),mouse=false,jumpAt=0,grenadeAt=0,dodgeUntil=0,destination=LEVELS[index].boss.arena+310,captured=false;
  for(let frame=0;frame<2400;frame++){
   const s=await snap(),p=s.player,level=LEVELS[index];assert.equal(s.level,index);
   if(s.state==='victory'){for(const k of held)await page.keyboard.up(k);await page.mouse.up();results.push({chapter:index+1,time:s.time,deaths:s.deaths,kills:s.kills,bossPhase:s.boss.phase,attacks:s.boss.attack});console.log(JSON.stringify(results.at(-1)));break;}
   if(s.state==='dead'){assert.ok(s.deaths<8);for(const k of held)await page.keyboard.up(k);await page.mouse.up();await page.locator('#retry').click();held.clear();mouse=false;jumpAt=0;continue;}
   assert.equal(s.state,'playing');
   const mortar=s.hazards.find(h=>h.type==='mortar'&&!h.hit&&h.timer<.9&&Math.abs(h.x-p.x)<90);
   if(mortar&&s.time>dodgeUntil){destination=p.x<level.boss.arena+350?level.boss.arena+510:level.boss.arena+160;dodgeUntil=s.time+1.6;}
   if(s.time>dodgeUntil)destination=level.boss.arena+310;
   const next=new Set();if(p.x<destination-15)next.add('KeyD');else if(p.x>destination+35&&s.boss.active)next.add('KeyA');
   for(const k of held)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;
   const target=s.boss.active&&!s.boss.dead?{x:s.boss.x+level.boss.w*.4,y:s.boss.y+level.boss.h*.55}:s.enemies.filter(e=>e.x>p.x-30&&e.x<p.x+650).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
   const aim=target?{x:target.x+10,y:target.y+20}:{x:p.x+240,y:p.y+6};
   await page.mouse.move(Math.max(5,Math.min(1275,(aim.x-s.camera)*1.2)),Math.max(160,Math.min(650,aim.y*1.2-144)));if(!mouse){await page.mouse.down();mouse=true;}
   const support=level.platforms.find(v=>p.x+p.w>v.x&&p.x<v.x+v.w&&Math.abs(p.y+p.h-v.y)<4),gap=support&&support.x+support.w-(p.x+p.w)<115;
   const floor=level.platforms.some(v=>p.x+100>v.x&&p.x+100<v.x+v.w&&v.y>=p.y+p.h&&v.y<690);
   const wave=s.hazards.some(h=>h.type==='wave'&&h.x>p.x&&h.x-p.x<220),beam=s.hazards.some(h=>h.type==='beam'&&h.timer<.35&&h.timer>0&&h.y>p.y),vent=s.environment.some(h=>h.x>p.x&&h.x-p.x<100&&(h.active||h.warning)),bullet=s.threats.some(b=>b.vx<0&&b.x>p.x&&b.x-p.x<150&&Math.abs(b.y-(p.y+24))<50);
   if(s.time>jumpAt&&(gap||!p.grounded&&p.vy>30&&!floor&&p.jumps<2||p.grounded&&(wave||beam||vent||bullet))){await page.keyboard.press('KeyK');jumpAt=s.time+.2;}
   if(s.boss.active&&bullet&&p.dashCd<=0)await page.keyboard.press('ShiftLeft');
   if(s.boss.active&&s.time>grenadeAt&&p.grenades>0){await page.keyboard.press('KeyL');grenadeAt=s.time+1.5;}
   if(s.boss.active&&!captured&&s.boss.attack>=1){await page.screenshot({path:`${out}/${index+1}-combat.png`});captured=true;}
   await page.clock.runFor(100);
  }
  assert.equal((await snap()).state,'victory',JSON.stringify(await snap()));
  if(index<7){await page.locator('#next-chapter').click();await page.waitForFunction(i=>redFalcon.metrics.readyLevel===i&&redFalcon.snapshot().state==='playing',index+1);}
 }
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('red-falcon-campaign-v1')));assert.deepEqual(saved.completed,[0,1,2,3,4,5,6,7]);assert.deepEqual(errors,[]);
 await page.locator('.topbar [data-locale="zh-CN"]').click();await page.screenshot({path:out+'/campaign-complete-zh.png'});
 await writeFile(out+'/campaign-playthrough.json',JSON.stringify({inputOnly:true,results,completed:saved.completed,errors},null,2));
}finally{await browser.close();}
