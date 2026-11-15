import {writeFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),results=[];
try{
 for(const settings of [{width:1280,height:720,dpr:1,cpu:1},{width:1920,height:1080,dpr:2,cpu:4}]){
  const page=await browser.newPage({viewport:{width:settings.width,height:settings.height},deviceScaleFactor:settings.dpr});const client=await page.context().newCDPSession(page);await client.send('Emulation.setCPUThrottlingRate',{rate:settings.cpu});
  await page.route('**/src/main.js',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto(process.env.GAME_URL||'http://red-falcon.localhost:4177');
  for(let chapter=0;chapter<8;chapter++)for(const enhanced of [false,true]){
   const data=await page.evaluate(async({chapter,enhanced})=>{
    const [{Game},{Renderer},{createI18n}]=await Promise.all([import('./src/game.js'),import('./src/render.js'),import('./src/i18n.js')]);
    document.querySelectorAll('main>*:not(canvas)').forEach(e=>e.remove());
    const g=new Game({level:chapter,enhanced,random:()=>.5}),r=new Renderer(document.querySelector('canvas'),createI18n(),{slice:enhanced});if(enhanced)await r.loadLevel(chapter);g.start();
    // Controlled sustained firefight; the same weapon/HP fixture on both renderers.
    g.player.x=g.boss.arena+260;g.player.y=532;g.player.unlocked=[0,1,2];g.player.weapon=1;g.player.invuln=999;g.boss.hp=1e9;g.boss.maxHp=1e9;g.boss.active=true;g.enemies=[];g.camera=g.boss.arena;
    let last=0;const intervals=[],cpu=[];let maxParticles=0;
    for(let i=0;i<240;i++){
     const now=await new Promise(requestAnimationFrame),elapsed=last?now-last:16.67;last=now;const begin=performance.now();
     g.update(Math.min(elapsed/1000,.034),{held:new Set(['KeyJ']),pressed:new Set(),aim:{x:g.boss.x+g.boss.w*.4,y:g.boss.y+g.boss.h*.55}});r.render(g);maxParticles=Math.max(maxParticles,g.particles.length);
     if(i>=60){intervals.push(elapsed);cpu.push(performance.now()-begin);}
    }
    intervals.sort((a,b)=>a-b);cpu.sort((a,b)=>a-b);
    const stats={chapter:chapter+1,theme:g.level.theme,renderer:enhanced?'enhanced':'procedural',frames:intervals.length,frameMedianMs:intervals[90],frameP95Ms:intervals[171],framesOver25ms:intervals.filter(x=>x>25).length,cpuMedianMs:cpu[90],cpuP95Ms:cpu[171],maxParticles,retainedTextureBytes:r.slice?.retainedBytes||0};
    r.slice?.dispose();for(const image of Object.values(r.art.shared||{}))image.close();return stats;
   },{chapter,enhanced});results.push({...settings,...data});console.log(JSON.stringify(results.at(-1)));
  }await page.close();
 }
 await mkdir('docs/campaign-art',{recursive:true});await writeFile('docs/campaign-art/frame-pacing.json',JSON.stringify({browser:await browser.version(),date:new Date().toISOString(),note:'Synthetic boss firefights, 60 warm-up + 180 measured frames each, deterministic random. Headless Chrome on this Mac. CPU throttling simulates slower hardware; not a physical phone test. Includes simulation/rendering, excludes DOM HUD and downloads. Legacy procedural renderer retained for comparison; shared simulation uses each renderer registration/camera.',results},null,2));
}finally{await browser.close();}
