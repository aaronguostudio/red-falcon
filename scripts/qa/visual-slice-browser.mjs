const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {LEVELS} from '../../dist/src/levels.js';
import assert from 'node:assert/strict';import {writeFile,mkdir} from 'node:fs/promises';
const out=process.env.QA_OUTPUT||'/tmp/red-falcon-slice-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const snap=()=>page.evaluate(()=>redFalcon.snapshot());
async function play(end){let held=new Set(),mouse=false,jumpAt=0,grenadeAt=0,dodgeUntil=0,destination=6120,screen=false;
 for(let frame=0;frame<1800;frame++){
  const s=await snap(),p=s.player;
  if(s.state===end){for(const k of held)await page.keyboard.up(k);await page.mouse.up();return s;}
  if(s.state==='dead'){assert.ok(s.deaths<4);await page.mouse.up();await page.locator('#retry').click();held.clear();mouse=false;continue;}
  assert.equal(s.state,'playing');
  const mortar=s.hazards.find(h=>h.type==='mortar'&&!h.hit&&h.timer<.9&&Math.abs(h.x-p.x)<90);
  if(mortar&&s.time>dodgeUntil){destination=p.x<6250?6400:6090;dodgeUntil=s.time+1.3;}
  if(s.time>dodgeUntil)destination=6120;
  const next=new Set();if(s.sample==='intro'){if(p.x<3335)next.add('KeyD');}else if(p.x<destination-15)next.add('KeyD');else if(p.x>destination+35)next.add('KeyA');
  for(const k of held)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;
  const target=s.boss.active&&!s.boss.dead?{x:s.boss.x+80,y:s.boss.y+145}:s.enemies.filter(e=>e.x>p.x-100&&e.x<p.x+750).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  const aim=target?{x:target.x+10,y:target.y+20}:{x:p.x+240,y:p.y+6};
  await page.mouse.move(Math.max(5,Math.min(1275,(aim.x-s.camera)*1.2)),Math.max(160,Math.min(650,aim.y*1.2-144)));if(!mouse){await page.mouse.down();mouse=true;}
  const support=LEVELS[0].platforms.find(v=>p.x+28>v.x&&p.x<v.x+v.w&&Math.abs(p.y+58-v.y)<4),gap=support&&support.x+support.w-(p.x+28)<115;
  const floor=LEVELS[0].platforms.some(v=>p.x+100>v.x&&p.x+100<v.x+v.w&&v.y>=p.y+58&&v.y<690);
  const wave=s.hazards.some(h=>h.type==='wave'&&h.x>p.x&&h.x-p.x<220),bullet=s.threats.some(b=>b.vx<0&&b.x>p.x&&b.x-p.x<150&&Math.abs(b.y-(p.y+24))<50);
  if(s.time>jumpAt&&(gap||!p.grounded&&p.vy>30&&!floor&&p.jumps<2||p.grounded&&(wave||bullet))){await page.keyboard.press('Space');jumpAt=s.time+.2;}
  if(s.boss.active&&s.time>grenadeAt&&p.grenades>0){await page.keyboard.press('KeyK');grenadeAt=s.time+1.5;}
  if(!screen&&s.time>7){await page.screenshot({path:out+`/slice-${s.sample}-action.png`});screen=true;}
  await page.clock.runFor(100);
 }
 throw Error('Failed to finish: '+JSON.stringify(await snap()));
}
try{
 await page.goto((process.env.GAME_URL||'http://red-falcon.localhost:4177')+'/?sample=intro');await page.waitForFunction(()=>redFalcon.metrics.sampleAssetsReady);await page.clock.install();
 const before=await page.evaluate(()=>localStorage.getItem('red-falcon-campaign-v1'));assert.equal((await snap()).locale,'en');await page.locator('#start').click();
 await page.clock.runFor(400);await page.keyboard.press('Escape');const paused=await snap();await page.clock.runFor(2000);assert.equal((await snap()).time,paused.time);await page.locator('#resume').click();
 const intro=await play('sample-ready');assert.ok(intro.time>=30&&intro.time<32);await page.screenshot({path:out+'/slice-intermission-en.png'});
 await page.locator('.topbar [data-locale="zh-CN"]').click();assert.equal(await page.locator('#sample-ready h2').innerText(),'前哨就在前方。');await page.locator('#sample-enterboss').click();
 const boss=await play('victory');assert.equal(boss.boss.phase,2);assert.ok(boss.boss.attack>=3);assert.equal(await page.locator('#victory-title').innerText(),'守卫已击破。');assert.equal(await page.evaluate(()=>localStorage.getItem('red-falcon-campaign-v1')),before);await page.screenshot({path:out+'/slice-victory-zh.png'});
 await page.locator('#next-chapter').click();assert.equal((await snap()).sample,'boss');assert.equal((await snap()).boss.hp,3600);await page.keyboard.press('Escape');await page.locator('#exit').click();await page.locator('#slice-menu a').click();await page.waitForFunction(()=>!!window.redFalcon);assert.equal((await snap()).sample,null);assert.equal((await snap()).level,0);
 assert.deepEqual(errors,[]);await writeFile(out+'/slice-flow-qa.json',JSON.stringify({intro,boss,campaignSaveUnchanged:true,pauseVerified:true,replayVerified:true,errors},null,2));console.log(JSON.stringify({introTime:intro.time,introDeaths:intro.deaths,bossTime:boss.time,bossDeaths:boss.deaths,attacks:boss.boss.attack,errors}));
}finally{await browser.close();}
