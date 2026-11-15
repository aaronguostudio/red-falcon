import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),results=[];
try{
 for(const settings of [{width:1280,height:720,dpr:1,cpu:1},{width:1920,height:1080,dpr:2,cpu:4}])for(const sample of [false,true]){
  const page=await browser.newPage({viewport:{width:settings.width,height:settings.height},deviceScaleFactor:settings.dpr});const client=await page.context().newCDPSession(page);await client.send('Emulation.setCPUThrottlingRate',{rate:settings.cpu});
  await page.route('**/src/main.js',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto(process.env.GAME_URL||'http://red-falcon.localhost:4177');
  const data=await page.evaluate(async sample=>{
   const [{Game},{Renderer},{createI18n}]=await Promise.all([import('./src/game.js'),import('./src/render.js'),import('./src/i18n.js')]);document.querySelectorAll('main>*:not(canvas)').forEach(e=>e.remove());
   const g=new Game(),r=new Renderer(document.querySelector('canvas'),createI18n());if(sample){await r.loadSlice();r.sliceMode=true;g.startSample('boss');}else g.start();
   // Controlled sustained firefight, not a playthrough: invulnerability avoids ending the measurement.
   g.player.x=6120;g.player.y=532;g.player.unlocked=[0,1,2];g.player.weapon=1;g.player.invuln=999;g.boss.hp=1e9;g.boss.maxHp=1e9;g.boss.active=true;g.enemies=[];g.camera=5900;
   let last=0;const intervals=[],cpu=[];let maxParticles=0;
   for(let i=0;i<420;i++){
    const now=await new Promise(requestAnimationFrame),elapsed=last?now-last:16.67;last=now;const begin=performance.now();
    g.update(Math.min(elapsed/1000,.034),{held:new Set(['KeyJ']),pressed:new Set(),aim:{x:6730,y:475}});r.render(g);maxParticles=Math.max(maxParticles,g.particles.length);
    if(i>=120){intervals.push(elapsed);cpu.push(performance.now()-begin);}
   }
   intervals.sort((a,b)=>a-b);cpu.sort((a,b)=>a-b);return{frames:intervals.length,frameMedianMs:intervals[150],frameP95Ms:intervals[285],framesOver25ms:intervals.filter(x=>x>25).length,cpuMedianMs:cpu[150],cpuP95Ms:cpu[285],maxParticles};
  },sample);results.push({...settings,sample,...data});console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 await writeFile('docs/visual-slice/frame-pacing.json',JSON.stringify({browser:await browser.version(),date:new Date().toISOString(),note:'Synthetic sustained firefight after 120 warm-up frames. Headless Chrome; CPU throttling is simulation, not a real low-end device. Includes simulation and rendering, excludes DOM HUD.',results},null,2));
}finally{await browser.close();}
