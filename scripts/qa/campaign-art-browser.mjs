// Visual fixtures plus real UI navigation/loading recovery. Fixture hooks exist only
// in this test's intercepted main module; production exposes read-only snapshots.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT||'/tmp/red-falcon-art-qa';await mkdir(out,{recursive:true});
const url=process.env.GAME_URL||'http://red-falcon.localhost:4177';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
 const main=await readFile(new URL('../../dist/src/main.js',import.meta.url),'utf8');
 await page.route('**/src/main.js',r=>r.fulfill({contentType:'application/javascript',body:main+'\nwindow.__artFixture={game,renderer,showState,finish};'}));
 await page.addInitScript(()=>localStorage.setItem('red-falcon-campaign-v1',JSON.stringify({completed:[0,1,2,3,4,5,6,7],best:{}})));
 await page.goto(url);await page.waitForFunction(()=>redFalcon.metrics.assetsReady);await page.clock.install();
 const choose=async index=>{await page.locator('#open-chapters').click();await page.locator(`[data-chapter="${index}"]`).click();await page.waitForFunction(i=>redFalcon.metrics.assetsReady&&redFalcon.metrics.readyLevel===i,index);};
 for(const index of [0,1,2,3,4,5,6,7,0,7,1]){
  await choose(index);await page.locator('#start').click();await page.clock.runFor(1900);
  assert.equal(await page.evaluate(()=>redFalcon.snapshot().state),'playing');
  assert.equal(await page.locator('#boot-error').isVisible(),false);
  if(results.length<8){
   await page.screenshot({path:`${out}/${index+1}-route.png`});
   await page.evaluate(()=>{const {game:g}=__artFixture;g.player.x=g.boss.arena+260;g.player.y=532;g.player.invuln=1000;g.player.unlocked=[0,1,2];g.player.weapon=2;g.camera=g.world-1280/1.2;g.enemies=[];g.boss.active=true;g.boss.telegraph=.8;g.boss.cd=.2;g.time=50;g.maxX=g.player.x;});
   await page.clock.runFor(50);await page.screenshot({path:`${out}/${index+1}-boss.png`});
   await page.clock.runFor(3500);const s=await page.evaluate(()=>redFalcon.snapshot());assert.ok(s.boss.attack>=1);
  }
  const metrics=await page.evaluate(()=>redFalcon.metrics);assert.ok(metrics.retainedTextureBytes<52*1024*1024,JSON.stringify(metrics));
  results.push({chapter:index+1,theme:metrics.artTheme,retainedTextureBytes:metrics.retainedTextureBytes,terrainCachePixels:metrics.terrainCachePixels});
  await page.keyboard.press('Escape');await page.locator('#exit').click();await page.waitForFunction(()=>redFalcon.metrics.assetsReady);
 }
 // A failed chapter texture must never start the clock; retry recovers without reload.
 await page.route('**/campaign/foundry-backdrop.webp',r=>r.abort('failed'));
 await page.locator('#open-chapters').click();await page.locator('[data-chapter="3"]').click();await page.locator('#asset-retry').waitFor({state:'visible'});
 assert.equal(await page.locator('#start').isDisabled(),true);assert.equal(await page.evaluate(()=>redFalcon.snapshot().state),'menu');
 await page.locator('.topbar [data-locale="zh-CN"]').click();assert.ok((await page.locator('#asset-message').innerText()).includes('重试'));
 await page.unroute('**/campaign/foundry-backdrop.webp');await page.locator('#asset-retry').click();await page.waitForFunction(()=>redFalcon.metrics.assetsReady&&redFalcon.metrics.readyLevel===3);
 // Cancel a slow decode/download by selecting a different chapter.
 await page.route('**/campaign/waterfall-backdrop.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,450));try{await r.continue();}catch{}});
 await page.locator('#open-chapters').click();await page.locator('[data-chapter="2"]').click();await page.locator('#open-chapters').click();await page.locator('[data-chapter="6"]').click();await page.waitForFunction(()=>redFalcon.metrics.assetsReady&&redFalcon.metrics.readyLevel===6);
 await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>redFalcon.metrics.artTheme),'reactor');await page.unroute('**/campaign/waterfall-backdrop.webp');
 // A stalled response times out and exposes the same recoverable loading UI.
 let stalled;await page.route('**/campaign/snow-backdrop.webp',r=>{stalled=r;});
 const requested=page.waitForRequest('**/campaign/snow-backdrop.webp');await page.locator('#open-chapters').click();await page.locator('[data-chapter="4"]').click();await requested;
 await page.clock.runFor(30100);await page.locator('#asset-retry').waitFor({state:'visible'});assert.equal(await page.locator('#start').isDisabled(),true);
 try{await stalled.abort();}catch{}await page.unroute('**/campaign/snow-backdrop.webp');await choose(6);
 // Victory-to-next-chapter loading recovers and only starts the requested chapter.
 await page.locator('#start').click();await page.clock.runFor(100);await page.evaluate(()=>{const {game,finish}=__artFixture;game.state='victory';game.boss.dead=true;finish();});
 await page.route('**/campaign/hive-backdrop.webp',r=>r.abort('failed'));await page.locator('#next-chapter').click();await page.locator('#asset-retry').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>redFalcon.snapshot().state),'victory');
 await page.unroute('**/campaign/hive-backdrop.webp');await page.locator('#asset-retry').click();await page.waitForFunction(()=>redFalcon.snapshot().state==='playing'&&redFalcon.snapshot().level===7);assert.ok(await page.evaluate(()=>redFalcon.snapshot().time)<.1);
 assert.deepEqual(errors,[]);
 const report={note:'All chapters unlocked in a disposable browser profile; boss positions and victory transitions are controlled visual/UI fixtures, not playthrough evidence.',results,textureRecovery:true,staleSelectionCancelled:true,nextChapterRecovery:true,stalledDownloadTimeout:true,errors};
 await writeFile(out+'/campaign-art-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
