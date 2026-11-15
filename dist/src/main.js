import {LEVELS} from './levels.js';
import {createProgress} from './progress.js';
import {Game,WEAPONS,clamp} from './game.js';
import {Renderer} from './render.js';
import {AudioEngine} from './audio.js';
import {createI18n} from './i18n.js';

const $=id=>document.getElementById(id),canvas=$('game'),audio=new AudioEngine();
let storage=null;
try { storage=window.localStorage; } catch { /* Storage is optional. */ }
const progress=createProgress(storage);
let selectedLevel=progress.unlocked;
const i18n=createI18n(storage),t=(key,params)=>i18n.t(key,params);
let renderer,game,last=0,hudClock=0,noticeTimeout,bannerTimeout,hintTimeout;
let difficulty='normal',mouseAim=false,pointer={x:0,y:0},guidePaused=false;
let activeNotice=null,activeSector=0,bestScore=0;
const held=new Set(),pressed=new Set();
const gameKeys=new Set(['KeyA','KeyD','KeyW','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyJ','KeyK','KeyL','KeyH','KeyQ','ShiftLeft','ShiftRight']);
const formatTime=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;

function selectLevel(index){
  if(!progress.isOpen(index))return;
  selectedLevel=index;game.setLevel(index);game.populate(0);game.player=game.makePlayer(120);game.sector=0;activeSector=0;game.maxX=120;game.clearEffects();renderCampaign();
}
function renderCampaign(){
  const level=LEVELS[selectedLevel],number=String(selectedLevel+1).padStart(2,'0');
  $('selected-chapter').textContent=`${number} / ${t(level.nameKey)}`;
  $('chapter-brief').textContent=t(level.briefKey);
  $('chapter-count').textContent=t('campaign.chapter',{number});
  $('chapter-number').textContent=number;$('chapter-code').textContent=t('campaign.chapter',{number});$('chapter-name').textContent=t(level.nameKey);
  $('scene-name').textContent=t(level.nameKey);$('campaign-progress').textContent=t(progress.persistent?'campaign.saved':'campaign.session',{count:progress.completed.length});
  level.sectors.forEach((s,i)=>$('route-'+i).textContent=t(s.nameKey));
  const list=$('chapter-list');list.replaceChildren();
  LEVELS.forEach((chapter,i)=>{
    const button=document.createElement('button');button.className='chapter-option';button.disabled=!progress.isOpen(i);button.dataset.chapter=String(i);button.setAttribute('aria-pressed',String(i===selectedLevel));
    const numberEl=document.createElement('span');numberEl.className='chapter-index';numberEl.textContent=String(i+1).padStart(2,'0');
    const copy=document.createElement('span'),name=document.createElement('strong'),brief=document.createElement('small'),status=document.createElement('em');
    name.textContent=t(chapter.nameKey);brief.textContent=t(chapter.briefKey);status.textContent=t(button.disabled?'campaign.locked':progress.completed.includes(i)?'campaign.cleared':'campaign.ready');copy.append(name,brief,status);button.append(numberEl,copy);
    button.onclick=()=>{selectLevel(i);$('chapters').close();$('start').focus();};list.append(button);
  });
}

function notice(message){
  activeNotice=message;
  $('notification').textContent=i18n.text(message);
  $('notification').classList.add('show');
  clearTimeout(noticeTimeout);
  noticeTimeout=setTimeout(()=>$('notification').classList.remove('show'),3500);
}
function clearInput(){held.clear();pressed.clear();mouseAim=false;}
function updateAudioLabel(){
  $('sound').textContent=audio.enabled?'♫':'♪';
  $('sound').setAttribute('aria-label',t(audio.enabled?'action.mute':'action.unmute'));
  $('sound').setAttribute('aria-pressed',String(audio.enabled));
}
function updateFullscreenLabel(){
  $('fullscreen').setAttribute('aria-label',t(document.fullscreenElement?'action.exitFullscreen':'action.fullscreen'));
}
function updateBanner(){
  const sector=game.sectors[activeSector],el=$('sector-banner');
  el.querySelector('small').textContent=t('campaign.chapter',{number:String(game.levelIndex+1).padStart(2,'0')})+` · 0${activeSector+1}`;
  el.querySelector('strong').textContent=t(sector.nameKey);
  el.querySelector('span').textContent=t(sector.objectiveKey);
}
function applyLanguage(){
  document.documentElement.lang=i18n.locale;
  document.title=t('meta.title');
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  for(const attr of ['aria-label','title','content']){
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el=>el.setAttribute(attr,t(el.getAttribute(`data-i18n-${attr}`))));
  }
  document.querySelectorAll('[data-locale]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.locale===i18n.locale)));
  $('difficulty-note').textContent=t(`difficulty.${difficulty}Note`);
  updateAudioLabel();updateFullscreenLabel();updateBanner();
  if(activeNotice)$('notification').textContent=i18n.text(activeNotice);
  if(game){renderCampaign();updateHUD();if(game.state==='victory')renderResults();}
}
function setLanguage(locale){
  if(!i18n.setLocale(locale))return;
  clearInput();applyLanguage();
  if(game?.state==='playing')canvas.focus();
}
function showState(){
  for(const [id,state]of [['menu','menu'],['pause-screen','paused'],['death-screen','dead'],['victory','victory']])$(id).classList.toggle('hidden',game.state!==state);
  const running=game.state==='playing';
  $('hud').classList.toggle('hidden',game.state==='menu');
  $('pause').classList.toggle('hidden',!running);
  $('touch-controls').classList.toggle('hidden',!running);
  if(!running){clearInput();$('sector-banner').classList.add('hidden');}
  if(game.state==='paused')$('resume').focus();
  if(game.state==='dead')$('retry').focus();
  if(game.state==='victory')$(game.levelIndex<LEVELS.length-1?'next-chapter':'replay').focus();
  if(game.state==='menu')$('start').focus();
}
function event(e){
  audio.play(e);
  switch(e.type){
    case'notice':notice(e.message);break;
    case'sector':
      activeSector=e.sector;updateBanner();$('sector-banner').classList.remove('hidden');
      clearTimeout(bannerTimeout);bannerTimeout=setTimeout(()=>$('sector-banner').classList.add('hidden'),3100);break;
    case'pause':case'resume':case'death':showState();break;
    case'victory':finish();break;
  }
}
function start(){
  clearInput();game.difficulty=difficulty;game.start(selectedLevel);showState();canvas.focus();audio.init();
  clearTimeout(hintTimeout);
  if(window.innerHeight>window.innerWidth)notice({key:'notice.touch'});
  else hintTimeout=setTimeout(()=>{if(game.state==='playing'&&game.maxX<900)notice({key:'notice.controls'});},4000);
  updateHUD();
}
function menu(){game.state='menu';clearInput();selectLevel(progress.unlocked);showState();$('boss-hud').classList.add('hidden');}
function retry(){game.retry();clearInput();showState();canvas.focus();updateHUD();}
function pause(){game.pause();clearInput();if(game.state==='playing')canvas.focus();}
function renderResults(){
  const final=game.levelIndex===LEVELS.length-1;
  $('victory-eyebrow').textContent=t(final?'campaign.complete':'campaign.clearCode');
  $('victory-title').textContent=t(final?'campaign.ending':'campaign.clear');
  $('victory-body').textContent=t(game.level.endingKey);
  $('next-chapter').classList.toggle('hidden',final);
  $('rank').textContent=game.deaths===0&&game.time<220?'S':game.deaths<=2?'A':game.deaths<=5?'B':'C';
  $('final-score').textContent=i18n.number(game.score);
  $('final-time').textContent=formatTime(game.time);
  $('final-kills').textContent=game.kills+' / '+game.deaths;
  $('best-result').textContent=t('victory.best',{difficulty:{key:`difficulty.${difficulty}`},score:i18n.number(bestScore)})+(game.score>=bestScore?t('victory.newRecord'):'');
}
function finish(){
  progress.complete(game.levelIndex,difficulty,game.score);
  bestScore=progress.best(game.levelIndex,difficulty);renderCampaign();
  renderResults();showState();
}
function updateHUD(){
  const p=game.player,s=game.sectors[game.sector],w=WEAPONS[p.weapon];
  $('health-number').textContent=Math.ceil(p.hp);
  $('health-bar').firstElementChild.style.width=p.hp+'%';
  $('health-bar').firstElementChild.style.background=p.hp<30?'#ff7049':'#e4f69e';
  $('dash-status').textContent=p.dashCd>0?t('hud.dashCooldown',{seconds:p.dashCd.toFixed(1)}):t('hud.dashReady');
  $('grenade-count').textContent='◆ '.repeat(p.grenades)||t('hud.noGrenades');
  $('sector-label').textContent=`0${game.levelIndex+1} · ${t(s.nameKey)}`;
  $('objective-label').textContent=game.boss.active?t('campaign.target',{name:{key:game.boss.nameKey}}):t(s.objectiveKey);
  $('progress').style.width=clamp(game.maxX/(game.world-300)*100,0,100)+'%';
  $('score').textContent=String(game.score).padStart(6,'0');$('timer').textContent=formatTime(game.time);
  $('weapon-code').textContent=`0${p.weapon+1} / ${w.code}`;
  $('weapon-label').textContent=t(w.nameKey);
  $('weapon-hint').textContent=p.unlocked.length>1?t('hud.weaponSwitch',{count:p.unlocked.length}):t('hud.weaponPickup');
  $('boss-hud').classList.toggle('hidden',!game.boss.active||game.boss.dead);
  $('boss-hud').querySelector('.boss-track i').style.width=game.boss.hp/game.boss.maxHp*100+'%';
  $('boss-phase').textContent=t(`boss.phase${game.boss.phase}`);
  $('boss-code').textContent=game.boss.code;$('boss-name').textContent=t(game.boss.nameKey);
}
function keyDown(e){
  if(e.code==='Escape'){
    if($('chapters').open){$('chapters').close();return;}
    if($('guide').open){$('guide').close();return;}
    if(game.state==='playing'||game.state==='paused'){e.preventDefault();pause();}return;
  }
  if($('guide').open||$('chapters').open)return;
  if(e.code==='KeyM'&&!e.repeat){toggleSound();return;}
  if(e.code==='KeyF'&&!e.repeat){fullScreen();return;}
  if(e.code==='Enter'&&!e.repeat&&(e.target===document.body||e.target===canvas)){
    if(game.state==='menu')start();else if(game.state==='dead')retry();else if(game.state==='paused')pause();
  }
  if(game.state!=='playing')return;
  if(gameKeys.has(e.code)){e.preventDefault();if(!held.has(e.code))pressed.add(e.code);held.add(e.code);if(e.code==='KeyJ'||e.code==='KeyW'||e.code==='KeyS')mouseAim=false;}
}
window.addEventListener('keydown',keyDown);window.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(game.state==='playing')game.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.state==='playing')game.pause();}});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){pointer={x:e.clientX,y:e.clientY};if(held.has('Mouse0'))mouseAim=true;}});
canvas.addEventListener('pointerdown',e=>{if(game.state!=='playing'||e.pointerType==='touch')return;e.preventDefault();canvas.focus();audio.init();pointer={x:e.clientX,y:e.clientY};mouseAim=true;const key='Mouse'+e.button;if(!held.has(key))pressed.add(key);held.add(key);canvas.setPointerCapture(e.pointerId);});
window.addEventListener('pointerup',e=>held.delete('Mouse'+e.button));canvas.addEventListener('pointercancel',clearInput);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const b of document.querySelectorAll('[data-key]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(game.state!=='playing')return;b.setPointerCapture(e.pointerId);const k=b.dataset.key;if(!held.has(k))pressed.add(k);held.add(k);mouseAim=false;audio.init();});
  const release=()=>held.delete(b.dataset.key);
  b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
}
async function toggleSound(){await audio.init();audio.toggle();updateAudioLabel();notice({key:audio.enabled?'notice.soundOn':'notice.soundOff'});}
async function fullScreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch{notice({key:'notice.fullscreen'});}}
$('open-chapters').onclick=()=>{renderCampaign();$('chapters').showModal();};
$('close-chapters').onclick=()=>$('chapters').close();
$('next-chapter').onclick=()=>{if(game.state!=='victory'||!progress.isOpen(game.levelIndex+1))return;selectedLevel=game.levelIndex+1;start();};
$('start').onclick=start;$('replay').onclick=start;$('resume').onclick=pause;$('pause').onclick=pause;$('restart').onclick=retry;$('retry').onclick=retry;
for(const id of ['exit','death-exit','victory-exit'])$(id).onclick=menu;
$('sound').onclick=toggleSound;$('fullscreen').onclick=fullScreen;
$('help').onclick=()=>{guidePaused=game.state==='playing';if(guidePaused)game.pause();$('guide').showModal();};
const closeGuide=()=>$('guide').close();$('close-guide').onclick=closeGuide;$('guide-ready').onclick=closeGuide;
$('guide').addEventListener('close',()=>{if(guidePaused&&game.state==='paused'){guidePaused=false;pause();}});
document.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{difficulty=b.dataset.difficulty;document.querySelectorAll('[data-difficulty]').forEach(x=>{const selected=x===b;x.classList.toggle('selected',selected);x.setAttribute('aria-pressed',String(selected));});$('difficulty-note').textContent=t(`difficulty.${difficulty}Note`);});
document.querySelectorAll('[data-locale]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.locale));
window.addEventListener('resize',()=>renderer?.resize());
document.addEventListener('fullscreenchange',()=>{updateFullscreenLabel();renderer?.resize();});

try{
  game=new Game({onEvent:event,level:selectedLevel});applyLanguage();renderer=new Renderer(canvas,i18n);
  Object.defineProperty(window,'redFalcon',{value:Object.freeze({snapshot:()=>({...game.snapshot(),locale:i18n.locale}),get metrics(){return{width:renderer.width,height:renderer.height,scale:renderer.scale,particles:game.particles.length};}})});
  function frame(time){
    try{
      const dt=Math.min((time-last)/1000||.016,.034);last=time;
      const input={held,pressed,aim:mouseAim?renderer.point(pointer.x,pointer.y,game.camera):null};
      const stalled=game.hitstop>0;game.update(dt,input);if(!stalled)pressed.clear();
      audio.update(dt,game.state,game.boss.active);renderer.render(game);hudClock+=dt;
      if(hudClock>.08){hudClock=0;if(game.state!=='menu')updateHUD();}
      requestAnimationFrame(frame);
    }catch(error){$('boot-error').classList.remove('hidden');console.error('Game runtime error',error);}
  }
  requestAnimationFrame(frame);
}catch(error){$('boot-error').classList.remove('hidden');console.error('Game failed to initialize',error);}
