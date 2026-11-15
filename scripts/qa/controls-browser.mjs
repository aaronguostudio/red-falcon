const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUTPUT||'/tmp/red-falcon-controls-qa';await mkdir(out,{recursive:true});
const url=process.env.GAME_URL||'http://red-falcon.localhost:4177';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),errors=[],results=[];
try{
 for(const sample of [false,true]){
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
  const snapshot=()=>page.evaluate(()=>redFalcon.snapshot());
  await page.goto(url+(sample?'/?sample=intro':'/'));await page.waitForFunction(sample?()=>redFalcon.metrics.sampleAssetsReady:()=>!!window.redFalcon);await page.clock.install();
  await page.locator('#help').click();assert.equal(await page.locator('[data-i18n="guide.jumpKey"]').last().innerText(),'K / Space');assert.equal(await page.locator('[data-i18n="guide.grenadeKey"]').innerText(),'L / Right click');assert.ok((await page.locator('[data-i18n="guide.crouch"]').innerText()).includes('Hold'));
  await page.locator('#close-guide').click();await page.locator('#start').click();await page.clock.runFor(1800);
  const standing=await snapshot(),feet=standing.player.y+standing.player.h;await page.keyboard.down('ArrowDown');await page.keyboard.down('KeyJ');await page.clock.runFor(300);
  const crouched=await snapshot();assert.equal(crouched.player.crouching,true);assert.equal(crouched.player.h,36);assert.equal(crouched.player.y+crouched.player.h,feet);assert.ok(crouched.bullets>0);await page.screenshot({path:out+`/${sample?'sample':'campaign'}-crouch.png`});await page.keyboard.up('KeyJ');
  await page.keyboard.press('KeyK');await page.clock.runFor(100);let jumping=await snapshot();assert.equal(jumping.player.crouching,false);assert.equal(jumping.player.jumps,1);assert.equal(jumping.player.grenades,standing.player.grenades);
  await page.keyboard.press('KeyK');await page.clock.runFor(100);assert.equal((await snapshot()).player.jumps,2);await page.keyboard.up('ArrowDown');
  await page.keyboard.press('KeyL');await page.clock.runFor(40);assert.equal((await snapshot()).player.grenades,standing.player.grenades-1);
  await page.locator('.topbar [data-locale="zh-CN"]').click();await page.keyboard.press('Escape');await page.locator('#exit').click();await page.locator('#help').click();assert.equal(await page.locator('[data-i18n="guide.jumpKey"]').last().innerText(),'K / 空格');assert.equal(await page.locator('[data-i18n="guide.grenadeKey"]').innerText(),'L / 右键');assert.ok((await page.locator('[data-i18n="guide.crouch"]').innerText()).includes('蹲下'));
  results.push({sample,crouchHeight:crouched.player.h,feetPreserved:true,jumpAndGrenadeBindings:true,translations:true});await page.close();
 }
 const phone=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url+'/?sample=intro');await phone.waitForFunction(()=>redFalcon.metrics.sampleAssetsReady);await phone.clock.install();await phone.locator('#start').click();await phone.clock.runFor(500);
 const client=await phone.context().newCDPSession(phone),box=await phone.locator('[data-key="ArrowDown"]').boundingBox();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await phone.clock.runFor(150);assert.equal(await phone.evaluate(()=>redFalcon.snapshot().player.crouching),true);await phone.screenshot({path:out+'/touch-crouch.png'});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.clock.runFor(150);assert.equal(await phone.evaluate(()=>redFalcon.snapshot().player.crouching),false);
 await phone.locator('[data-key="KeyK"]').tap();await phone.clock.runFor(100);assert.equal(await phone.evaluate(()=>redFalcon.snapshot().player.jumps),1);await phone.locator('[data-key="KeyL"]').tap();await phone.clock.runFor(50);assert.equal(await phone.evaluate(()=>redFalcon.snapshot().player.grenades),3);
 assert.deepEqual(errors,[]);const report={results,touchVerified:true,errors};await writeFile(out+'/controls-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
