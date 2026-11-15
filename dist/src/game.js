import {SLICE_ZOOM,SLICE_END,falconOrigin,falconBarrel} from './slice-spec.js';
import {LEVELS} from './levels.js';
import {runBossAttack,updateHazards} from './patterns.js';
export const W = 1280, H = 720, WORLD = 7040;
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const lerp = (a,b,t) => a+(b-a)*t;
export const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w>b.x && a.y < b.y+b.h && a.y+a.h>b.y;
export const WEAPONS = [
  {nameKey:'weapon.pulse',code:'PULSE RIFLE',color:'#dff5a0',rate:.105,damage:16,speed:1100},
  {nameKey:'weapon.swarm',code:'SWARM SHOT',color:'#ffc87b',rate:.27,damage:13,speed:980},
  {nameKey:'weapon.rail',code:'ARC RAILGUN',color:'#82e7f0',rate:.36,damage:70,speed:2000},
];
export const SECTORS=LEVELS[0].sectors, PLATFORMS=LEVELS[0].platforms;
export class Game {
  constructor({onEvent=()=>{},difficulty='normal',random=Math.random,level=0}={}) {
    this.sample=null;this.setLevel(level);this.onEvent=onEvent;this.random=random;this.difficulty=difficulty;this.state='menu';this.time=0;this.visualTime=0;
    this.checkpoint=0;this.deaths=0;this.score=0;this.kills=0;this.maxX=100;this.sector=0;
    this.particles=[];this.bullets=[];this.grenades=[];this.hazards=[];this.rings=[];this.texts=[];this.ghosts=[];
    this.shake=0;this.flash=0;this.hitstop=0;this.camera=0;this.combo=0;this.comboTime=0;
    this.stats={shots:0,hits:0,damage:0};this.player=this.makePlayer(120);this.populate(0);
  }
  setLevel(index){if(!Number.isInteger(index)||!LEVELS[index])throw new RangeError('Unknown chapter');this.levelIndex=index;this.level=LEVELS[index];this.world=this.level.world;this.platforms=this.level.platforms;this.sectors=this.level.sectors;}
  makePlayer(x){return {x,y:500,w:28,h:58,vx:0,vy:0,face:1,aim:0,hp:100,grounded:false,jumps:0,coyote:0,jumpBuffer:0,invuln:1.7,fire:0,dash:0,dashCd:0,grenadeCd:0,weapon:0,unlocked:[0],grenades:4,step:0,muzzle:0,land:0};}
  emit(type,data={}){this.onEvent({type,...data});}
  makeEnemy([ex,y,type],i){return {id:i,x:ex,origin:ex,y:y-(type==='drone'?22:type==='turret'?34:56),baseY:y,w:type==='heavy'?38:type==='turret'?46:30,h:type==='drone'?28:type==='turret'?34:56,type,hp:type==='heavy'?120:type==='turret'?88:type==='drone'?40:48,maxHp:type==='heavy'?120:type==='turret'?88:type==='drone'?40:48,cd:1+(i%3)*.3,telegraph:0,flash:0,phase:i*.7,face:-1,vx:0,dead:false};}
  populate(x){
    this.enemies=this.level.enemies.filter(([ex])=>ex>x-180).map((entry,i)=>this.makeEnemy(entry,i));
    this.pickups=this.level.pickups.filter(([px])=>px>x-60).map(([px,y,type])=>({x:px,y,w:30,h:30,type,dead:false}));
    this.crates=this.level.crates.filter(([cx])=>cx>x-50).map(([cx,y])=>({x:cx,y,w:38,h:38,hp:32,dead:false}));
    this.environment=this.level.hazards.map(h=>({...h,active:false,warning:false,cycle:-1}));
    this.boss={...this.level.boss,baseX:this.level.boss.x,baseY:this.level.boss.y,maxHp:this.level.boss.hp,active:false,phase:1,cd:2,attack:0,telegraph:0,flash:0,dead:false,deathTime:0,actionAge:10,activeAttack:null};
  }
  start(level=this.levelIndex){this.sample=null;this.setLevel(level);this.time=0;this.checkpoint=0;this.deaths=0;this.score=0;this.kills=0;this.maxX=120;this.sector=0;this.stats={shots:0,hits:0,damage:0};this.player=this.makePlayer(120);this.populate(0);this.clearEffects();this.state='playing';this.camera=0;this.emit('sector',{sector:0});}
  startSample(mode='intro'){
    if(!['intro','boss'].includes(mode))throw new RangeError('Unknown sample');
    this.start(0);this.sample=mode;
    if(mode==='boss')this.enterSampleBoss();
    else{this.enemies=this.enemies.filter(e=>e.x<SLICE_END+200);this.sampleWave=0;}
  }
  enterSampleBoss(){
    this.sample='boss';this.checkpoint=6120;this.player=this.makePlayer(6120);this.player.unlocked=[0,1,2];this.player.weapon=2;this.player.y=532;this.populate(5900);this.enemies=[];this.clearEffects();this.camera=5900;this.state='playing';this.maxX=6120;this.sector=2;
  }
  clearEffects(){this.bullets=[];this.grenades=[];this.hazards=[];this.particles=[];this.rings=[];this.texts=[];this.ghosts=[];this.shake=0;this.flash=0;this.hitstop=0;this.combo=0;this.comboTime=0;}
  retry(){if(this.sample==='intro'){const deaths=this.deaths+1;this.startSample('intro');this.deaths=deaths;return;}if(this.sample==='boss'){this.deaths++;this.enterSampleBoss();return;}const saved=this.player.unlocked.slice();this.deaths++;this.score=Math.max(0,this.score-300);this.player=this.makePlayer(this.checkpoint||120);this.player.unlocked=saved;this.player.weapon=saved.at(-1);this.populate(this.checkpoint);this.clearEffects();this.state='playing';this.camera=clamp(this.player.x-300,0,this.world-W);this.emit('notice',{message:{key:'notice.retry'}});}
  pause(){if(this.state==='playing'){this.state='paused';this.emit('pause');}else if(this.state==='paused'){this.state='playing';this.emit('resume');}}
  fx(x,y,count,color,speed=180){for(let i=0;i<count;i++){const a=this.random()*Math.PI*2,v=(.2+this.random())*speed;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:.2+this.random()*.5,max:.7,r:1.4+this.random()*3,color});}const limit=this.sample?240:700;if(this.particles.length>limit)this.particles.splice(0,this.particles.length-limit);}
  ring(x,y,color,r=90){this.rings.push({x,y,color,r,life:.35});}
  floating(x,y,text,color='#e4f69e'){this.texts.push({x,y,text,color,life:1.1});}
  update(dt,input={held:new Set(),pressed:new Set(),aim:null}){
    dt=Math.min(dt,.034);this.visualTime+=dt;
    if(this.state!=='playing')return;
    if(this.hitstop>0){this.hitstop-=dt;return;}
    this.time+=dt;this.shake=Math.max(0,this.shake-dt*25);this.flash=Math.max(0,this.flash-dt*3);
    this.comboTime-=dt;if(this.comboTime<0)this.combo=0;
    this.updatePlayer(dt,input);if(this.state!=='playing')return;
    this.updateEnvironment();this.updateEnemies(dt);this.updateBoss(dt);updateHazards(this,dt);this.updateBullets(dt);this.updateGrenades(dt);this.updatePickups(dt);this.updateEffects(dt);
    const p=this.player;this.maxX=Math.max(this.maxX,p.x);const target=this.sample?clamp(p.x-250,this.boss.active?5900:0,this.world-W/SLICE_ZOOM):clamp(p.x-W*.32,0,this.world-W);this.camera=lerp(this.camera,target,1-Math.exp(-dt*5));
    const sector=this.sectors.reduce((index,s,i)=>this.maxX>=s.x?i:index,0);if(sector>this.sector){this.sector=sector;this.emit('sector',{sector});}
    if(this.sample==='intro'){
      if(this.time>=30&&p.grounded){this.state='sample-ready';this.emit('sampleReady');return;}
      if(p.x>2200&&this.time>16+this.sampleWave*6&&this.sampleWave<2){const e=this.makeEnemy([Math.min(SLICE_END,p.x+500),350,'drone'],this.enemies.length);this.enemies.push(e);this.sampleWave++;}
    }
    for(const cp of this.level.checkpoints)if(p.x>=cp&&this.checkpoint<cp){this.checkpoint=cp;p.hp=100;p.grenades=4;this.fx(p.x+14,p.y+30,28,'#dff5a0');this.ring(p.x+14,p.y+30,'#dff5a0',120);this.emit('checkpoint');this.emit('notice',{message:{key:'notice.checkpoint'}});}
  }
  updatePlayer(dt,input){
    const p=this.player,h=input.held||new Set(),k=input.pressed||new Set(),has=(...ks)=>ks.some(v=>h.has(v)),press=(...ks)=>ks.some(v=>k.has(v));
    p.invuln-=dt;p.fire-=dt;p.dashCd-=dt;p.grenadeCd-=dt;p.muzzle-=dt;p.land=Math.max(0,p.land-dt*5);p.coyote-=dt;p.jumpBuffer-=dt;
    let move=(has('KeyD','ArrowRight')?1:0)-(has('KeyA','ArrowLeft')?1:0);
    if(move)p.face=move;
    if(press('Space','KeyL'))p.jumpBuffer=.13;
    if(p.jumpBuffer>0&&(p.coyote>0||p.jumps<2)){
      if(!p.grounded&&p.coyote<=0&&p.jumps===0)p.jumps=1;
      if(p.jumps<2){p.vy=-650;p.jumps++;p.grounded=false;p.coyote=0;p.jumpBuffer=0;this.fx(p.x+14,p.y+58,p.jumps===2?18:9,p.jumps===2?'#93dee0':'#94ac8d',120);if(p.jumps===2)this.ring(p.x+14,p.y+55,'#93dee0',36);this.emit('jump',{double:p.jumps===2});}
    }
    if(press('ShiftLeft','ShiftRight','KeyH')&&p.dashCd<=0){p.dash=.18;p.dashCd=1.2;p.invuln=Math.max(p.invuln,.26);p.vy=0;this.emit('dash');this.ring(p.x+14,p.y+30,'#a5f2dc',45);}
    if(p.dash>0){p.dash-=dt;p.vx=p.face*900;p.vy=0;this.ghosts.push({x:p.x,y:p.y,face:p.face,life:.22});}
    else{p.vx=lerp(p.vx,move*310,1-Math.exp(-dt*(p.grounded?(this.level.theme==='snow'?5:24):13)));p.vy+=1700*dt;}
    const prevBottom=p.y+p.h;
    const belt=p.grounded?this.platforms.find(s=>s.conveyor&&p.x+p.w>s.x&&p.x<s.x+s.w&&Math.abs(prevBottom-s.y)<3)?.conveyor||0:0;
    p.x+=(p.vx+belt)*dt;p.x=clamp(p.x,this.boss.active?this.boss.arena:20,this.sample==='intro'?SLICE_END:this.world-80);p.y+=p.vy*dt;p.grounded=false;
    for(const s of this.platforms){if(p.vy>=0&&p.x+p.w>s.x&&p.x<s.x+s.w&&prevBottom<=s.y+2&&p.y+p.h>=s.y){p.y=s.y-p.h;p.vy=0;p.grounded=true;p.coyote=.11;p.jumps=0;if(prevBottom<s.y-6){p.land=.6;if(this.sample)this.emit('land');this.fx(p.x+14,s.y,9,'#708c78',90);}}}
    if(p.y>H+80){this.damagePlayer(30,true);if(this.state==='playing'){p.x=this.checkpoint||120;p.y=440;p.vx=0;p.vy=0;p.invuln=2;this.camera=clamp(p.x-300,0,this.world-W);this.emit('notice',{message:{key:'notice.fall'}});}}
    p.step+=Math.abs(p.vx)*dt*.04;
    const origin=this.sample?falconOrigin(p):{x:p.x+14,y:p.y+22};
    if(input.aim){p.aim=Math.atan2(input.aim.y-origin.y,input.aim.x-origin.x);p.face=Math.cos(p.aim)>=0?1:-1;}
    else{let ay=(has('KeyS','ArrowDown')?1:0)-(has('KeyW','ArrowUp')?1:0);p.aim=ay?Math.atan2(ay,move||0):p.face===1?0:Math.PI;}
    if(press('KeyQ')){const idx=p.unlocked.indexOf(p.weapon);p.weapon=p.unlocked[(idx+1)%p.unlocked.length];this.emit('weapon');}
    if(has('KeyJ','Mouse0')&&p.fire<=0)this.firePlayer();
    if(press('KeyK','Mouse2')&&p.grenadeCd<=0&&p.grenades>0){p.grenades--;p.grenadeCd=.5;this.grenades.push({x:p.x+14,y:p.y+15,vx:Math.cos(p.aim)*440,vy:-390+Math.sin(p.aim)*150,life:1.15});this.emit('throw');}
    for(const e of this.enemies)if(!e.dead&&overlap(p,e))this.damagePlayer(e.type==='heavy'?18:12);
    if(this.boss.active&&!this.boss.dead&&overlap(p,this.boss))this.damagePlayer(24);
  }
  firePlayer(){
    const p=this.player,w=WEAPONS[p.weapon];p.fire=w.rate;p.muzzle=.06;this.stats.shots++;
    const origin=this.sample?falconOrigin(p):{x:p.x+14,y:p.y+22},barrel=this.sample?falconBarrel(p):34;
    const spread=p.weapon===1?[-.23,-.115,0,.115,.23]:[0];
    for(const offset of spread){const a=p.aim+offset;this.bullets.push({x:origin.x+Math.cos(a)*barrel,y:origin.y+Math.sin(a)*barrel,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,life:1.1,damage:w.damage,player:true,color:w.color,rail:p.weapon===2,hit:new Set(),r:p.weapon===2?5:3});}
    this.fx(origin.x+Math.cos(p.aim)*barrel,origin.y+Math.sin(p.aim)*barrel,2,w.color,80);this.emit('shoot',{weapon:p.weapon});
  }
  enemyShot(x,y,a,speed=250,r=5){this.bullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:5,damage:12,player:false,r,color:'#ff8458'});}
  updateEnemies(dt){
    const p=this.player;
    for(const e of this.enemies){if(e.dead)continue;e.flash=Math.max(0,e.flash-dt);e.phase+=dt;
      if(Math.abs(e.x-p.x)>900)continue;
      e.face=p.x>e.x?1:-1;
      if(e.type==='drone'){e.y=e.baseY+Math.sin(e.phase*2)*35;e.x=e.origin+Math.sin(e.phase*.7)*80;}
      else if(e.type!=='turret'){const dx=p.x-e.x;const speed=e.type==='heavy'?30:55;const desired=Math.abs(dx)>300?Math.sign(dx)*speed:Math.sin(e.phase*1.6)*20;e.vx=desired;const nx=e.x+desired*dt;const ground=this.platforms.some(s=>s.y===e.baseY&&nx>s.x+5&&nx+e.w<s.x+s.w-5);if(ground&&Math.abs(nx-e.origin)<160)e.x=nx;}
      if(e.x<p.x-650)continue;
      e.cd-=dt;
      if(e.cd<=.55&&e.cd>0)e.telegraph=1-e.cd/.55;
      if(e.cd<=0){const a=Math.atan2(p.y+24-(e.y+18),p.x+14-(e.x+e.w/2));const speed=this.difficulty==='veteran'?330:245;
        if(e.type==='heavy'){for(const n of [-.2,0,.2])this.enemyShot(e.x+e.w/2,e.y+20,a+n,speed,6);}
        else if(e.type==='turret'){for(const n of [-.12,.12])this.enemyShot(e.x+e.w/2,e.y+6,a+n,speed,5);}
        else this.enemyShot(e.x+e.w/2,e.y+18,a,e.type==='drone'?speed*.85:speed,5);
        e.cd=e.type==='heavy'?2.2:e.type==='turret'?1.8:2.5;e.telegraph=0;this.fx(e.x+e.w/2,e.y+18,4,'#ff8458',70);
      }
    }
  }
  damageEnemy(e,damage){if(e.dead)return;e.hp-=damage;e.flash=.09;this.stats.hits++;this.fx(e.x+e.w/2,e.y+e.h*.4,6,'#ffc17c',140);
    if(e.hp<=0){e.dead=true;this.kills++;this.combo++;this.comboTime=3;const points=(e.type==='heavy'?250:e.type==='turret'?200:100)*Math.min(this.combo,5);this.score+=points;this.floating(e.x,e.y-10,'+'+points);this.fx(e.x+e.w/2,e.y+e.h/2,25,'#ffac66',220);this.fx(e.x+e.w/2,e.y+e.h/2,12,'#627f76',120);this.ring(e.x+e.w/2,e.y+e.h/2,'#ffc17c',45);this.shake=Math.max(this.shake,3);this.hitstop=.025;this.emit('kill');}
    else this.emit('hit');
  }
  damagePlayer(amount,force=false){const p=this.player;if((p.invuln>0&&!force)||this.state!=='playing')return;
    amount*=this.difficulty==='veteran'?1.65:1;p.hp=Math.max(0,p.hp-amount);this.stats.damage+=amount;p.invuln=1.1;this.shake=8;this.flash=.22;this.fx(p.x+14,p.y+28,18,'#ff7a56',190);this.emit('hurt');
    if(p.hp<=0){this.state='dead';this.emit('death');}
  }
  updateBullets(dt){
    const p=this.player;
    for(const b of this.bullets){if(b.life<=0)continue;const oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      // Sweep each projectile segment; a fast rail shot must not tunnel through thin targets.
      const hit=(r)=>segmentRect(oldX,oldY,b.x,b.y,{x:r.x-b.r,y:r.y-b.r,w:r.w+b.r*2,h:r.h+b.r*2});
      if(b.player){
        for(const e of this.enemies){if(!e.dead&&!b.hit.has(e)&&hit(e)){this.damageEnemy(e,b.damage);b.hit.add(e);if(!b.rail){b.life=0;break;}}}
        if(b.life>0&&this.boss.active&&!this.boss.dead&&!b.hit.has(this.boss)&&hit(this.boss)){this.damageBoss(b.damage);b.hit.add(this.boss);if(!b.rail)b.life=0;}
        if(b.life>0)for(const c of this.crates)if(!c.dead&&!b.hit.has(c)&&hit(c)){c.hp-=b.damage;b.hit.add(c);if(!b.rail)b.life=0;this.fx(c.x+19,c.y+10,6,'#baaf7b');if(c.hp<=0)this.destroyCrate(c);break;}
      }else if(hit(p)){this.damagePlayer(b.damage);b.life=0;}
      if(b.y>H+50||b.y< -100||Math.abs(b.x-p.x)>1600)b.life=0;
    }this.bullets=this.bullets.filter(b=>b.life>0);
  }
  destroyCrate(c){c.dead=true;this.fx(c.x+19,c.y+19,18,'#b5ac7d',170);this.score+=50;this.pickups.push({x:c.x+5,y:c.y-5,w:30,h:30,type:this.player.hp<70?'health':'grenade',dead:false});this.emit('break');}
  updateGrenades(dt){for(const g of this.grenades){g.life-=dt;g.vy+=950*dt;const prev=g.y;g.x+=g.vx*dt;g.y+=g.vy*dt;
    for(const s of this.platforms)if(g.x>s.x&&g.x<s.x+s.w&&prev<=s.y&&g.y>=s.y&&g.vy>0){g.y=s.y-3;g.vy*=-.45;g.vx*=.65;}
    if(g.life<=0){this.explode(g.x,g.y,170);for(const e of this.enemies)if(!e.dead&&Math.hypot(e.x+e.w/2-g.x,e.y+e.h/2-g.y)<190)this.damageEnemy(e,160);if(this.boss.active&&!this.boss.dead&&Math.hypot(this.boss.x+70-g.x,this.boss.y+150-g.y)<280)this.damageBoss(150);for(const c of this.crates)if(!c.dead&&Math.hypot(c.x-g.x,c.y-g.y)<170)this.destroyCrate(c);}
    }this.grenades=this.grenades.filter(g=>g.life>0);
  }
  explode(x,y,size=120){this.fx(x,y,48,'#ffb36a',size*2.3);this.fx(x,y,24,'#fae9af',size);this.fx(x,y,20,'#48605d',size*.9);this.ring(x,y,'#ffe5a2',size);this.shake=Math.max(this.shake,9);this.emit('explosion');}
  updatePickups(){const p=this.player;for(const item of this.pickups){if(item.dead||!overlap({x:p.x-15,y:p.y-15,w:p.w+30,h:p.h+30},item))continue;item.dead=true;
    if(item.type==='health'){p.hp=Math.min(100,p.hp+35);this.floating(item.x,item.y,{key:'pickup.armor'});}
    else if(item.type==='grenade'){p.grenades=Math.min(6,p.grenades+2);this.floating(item.x,item.y,{key:'pickup.grenades'});}
    else{const index=item.type==='scatter'?1:2;if(!p.unlocked.includes(index))p.unlocked.push(index);p.weapon=index;this.emit('notice',{message:{key:'notice.weapon',params:{weapon:{key:WEAPONS[index].nameKey}}}});this.floating(item.x,item.y,{key:WEAPONS[index].nameKey},WEAPONS[index].color);}
    this.fx(item.x+15,item.y+15,20,'#dff5a0',150);this.ring(item.x+15,item.y+15,'#dff5a0',45);this.emit('pickup');}}
  updateEnvironment(){
    for(const h of this.environment){
      const clock=this.time+h.offset,cycle=Math.floor(clock/h.period),phase=clock%h.period;
      h.warning=phase>1.5&&phase<2.4;h.active=phase>=2.4&&phase<3.4;
      if(h.type==='shell'){
        if(cycle!==h.cycle&&Math.abs(h.x-this.player.x)<750){h.cycle=cycle;this.hazards.push({type:'mortar',x:h.x,y:590,timer:1.2,life:2,hit:false});}
      }else if(h.active&&overlap(this.player,h))this.damagePlayer(h.type==='laser'?20:15);
    }
  }
  updateBoss(dt){const b=this.boss,p=this.player;b.flash=Math.max(0,b.flash-dt);b.actionAge+=dt;
    if(b.dead){b.deathTime+=dt;if(b.deathTime<2.4&&this.random()<dt*15)this.explode(b.x+this.random()*b.w,b.y+this.random()*b.h,70);if(b.deathTime>3){this.state='victory';this.score+=Math.max(0,3000-Math.floor(this.time)*5)+Math.max(0,2000-this.deaths*400);this.emit('victory',{level:this.levelIndex,final:this.levelIndex===LEVELS.length-1});}return;}
    if(!b.active&&p.x>b.arena+50){b.active=true;this.emit('boss');this.emit('notice',{message:{key:'campaign.bossAlert',params:{name:{key:b.nameKey}}}});}
    if(!b.active)return;
    if(b.kind==='ray')b.y=b.baseY+Math.sin(this.time*1.4)*55;
    if(b.kind==='train')b.x=b.baseX+Math.sin(this.time*.7)*100;
    if(b.kind==='prism')b.y=b.baseY+Math.sin(this.time)*25;
    const phase=b.kind==='queen'&&b.hp<b.maxHp*.28?3:b.hp<b.maxHp*.5?2:1;
    if(phase>b.phase){b.phase=phase;b.cd=1.7;if(phase===3)this.pickups.push({x:b.arena+300,y:548,w:30,h:30,type:'health',dead:false});this.shake=12;this.emit('notice',{message:{key:phase===3?'campaign.finalPhase':'campaign.overdrive',params:{name:{key:b.nameKey}}}});this.emit('alarm');this.ring(b.x+b.w/2,b.y+b.h/2,b.color,300);}
    b.cd-=dt;b.telegraph=b.cd<1?1-b.cd:0;
    if(b.cd<=0){b.actionAge=0;b.activeAttack=b.patterns[b.attack%b.patterns.length];runBossAttack(this,b.activeAttack);b.attack++;b.cd=b.phase===3?1.35:b.phase===2?1.8:2.5;b.telegraph=0;}
  }
  damageBoss(damage){const b=this.boss;if(b.dead)return;b.hp=Math.max(0,b.hp-damage);b.flash=.07;this.stats.hits++;this.fx(b.x+30,b.y+90+this.random()*120,7,'#ffc17c',200);this.emit('hit');
    if(b.hp<=0){b.dead=true;this.bullets=this.bullets.filter(b=>b.player);this.hazards=[];this.enemies.forEach(e=>e.dead=true);this.player.invuln=10;this.kills++;this.score+=5000;this.shake=20;this.hitstop=.08;this.emit('bossDeath');}
  }
  updateEffects(dt){for(const f of this.particles){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=360*dt;f.vx*=Math.exp(-dt*2);}this.particles=this.particles.filter(f=>f.life>0);
    for(const r of this.rings)r.life-=dt;this.rings=this.rings.filter(r=>r.life>0);
    for(const t of this.texts){t.life-=dt;t.y-=dt*35;}this.texts=this.texts.filter(t=>t.life>0);
    for(const g of this.ghosts)g.life-=dt;this.ghosts=this.ghosts.filter(g=>g.life>0);
  }
  snapshot(){return {sample:this.sample,level:this.levelIndex,levelId:this.level.id,world:this.world,camera:this.camera,hazards:this.hazards.map(h=>({...h})),environment:this.environment.map(h=>({...h})),enemies:this.enemies.filter(e=>!e.dead).map(e=>({x:e.x,y:e.y,w:e.w,h:e.h})),threats:this.bullets.filter(b=>!b.player).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy})),state:this.state,time:this.time,score:this.score,kills:this.kills,deaths:this.deaths,checkpoint:this.checkpoint,sector:this.sector,player:{x:this.player.x,y:this.player.y,vx:this.player.vx,vy:this.player.vy,hp:this.player.hp,grounded:this.player.grounded,jumps:this.player.jumps,weapon:this.player.weapon,unlocked:[...this.player.unlocked],grenades:this.player.grenades,dashCd:this.player.dashCd},boss:{x:this.boss.x,y:this.boss.y,w:this.boss.w,h:this.boss.h,kind:this.boss.kind,actionAge:this.boss.actionAge,activeAttack:this.boss.activeAttack,attack:this.boss.attack,hp:this.boss.hp,phase:this.boss.phase,active:this.boss.active,dead:this.boss.dead},enemiesAlive:this.enemies.filter(e=>!e.dead).length,bullets:this.bullets.length};}
}
export function segmentRect(x0,y0,x1,y1,r){let t0=0,t1=1;const dx=x1-x0,dy=y1-y0;for(const [p,q]of[[-dx,x0-r.x],[dx,r.x+r.w-x0],[-dy,y0-r.y],[dy,r.y+r.h-y0]]){if(Math.abs(p)<1e-9){if(q<0)return false;}else{const t=q/p;if(p<0){if(t>t1)return false;t0=Math.max(t0,t);}else{if(t<t0)return false;t1=Math.min(t1,t);}}}return t0<=t1;}
