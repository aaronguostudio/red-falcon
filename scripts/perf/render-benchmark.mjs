// Run with PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs.
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const sample=process.argv.includes('--sample'),results=[];
try {
 for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  await page.route('**/src/main.js',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.goto(process.env.GAME_URL||'http://red-falcon.localhost:4177');
  const result=await page.evaluate(async({sample,viewport})=>{
   const [{Game},{Renderer},{createI18n}]=await Promise.all([import('./src/game.js'),import('./src/render.js'),import('./src/i18n.js')]);
   document.querySelectorAll('main>*:not(canvas)').forEach(e=>e.remove());
   const game=new Game({random:()=>.5,enhanced:sample}),renderer=new Renderer(document.querySelector('canvas'),createI18n());
   if(sample)await renderer.loadSlice();
   const cases=[];
   for(const [name,x] of [['opening',400],['traversal',1550],['boss',6200]]){
    game.start();if(sample){game.sample=name==='boss'?'boss':'intro';renderer.sliceMode=true;}
    game.player.x=x;game.player.y=532;game.player.grounded=true;game.player.invuln=0;
    game.camera=Math.max(0,x-(sample?250:409.6));game.boss.active=name==='boss';
    game.enemies=game.enemies.filter(e=>Math.abs(e.x-x)<1100);
    for(let i=0;i<120;i++)game.fx(x+Math.sin(i)*400,350+(i%12)*20,1,'#ffc17c');
    const times=[];
    for(let i=0;i<330;i++){
     await new Promise(requestAnimationFrame);game.visualTime=i/60;game.player.step=i*.2;game.player.vx=310;
     const begin=performance.now();renderer.render(game);const elapsed=performance.now()-begin;
     if(i>=90)times.push(elapsed);
    }
    times.sort((a,b)=>a-b);cases.push({name,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],maxMs:times.at(-1),samples:times.length});
   }
   return{viewport,dpr:devicePixelRatio,renderer:sample?'visual-slice':'original',cases};
  },{sample,viewport});results.push(result);console.log(JSON.stringify(result));await page.close();
 }
 await writeFile(`docs/visual-slice/perf-${sample?'slice':'baseline'}.json`,JSON.stringify({browser:await browser.version(),date:new Date().toISOString(),note:'Canvas command submission CPU time; headless Chrome, not total GPU/frame time. Identical scene fixtures and 120 particles.',results},null,2));
}finally{await browser.close();}
