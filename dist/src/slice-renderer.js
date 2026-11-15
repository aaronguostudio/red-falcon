import {W,H} from './game.js';
import {ART_COLORS,closeImages,imageBytes} from './campaign-art.js';
import {drawTerrainDetails} from './scenes.js';
import {SLICE_ZOOM,FALCON_SCALE,falconRegistration,falconOrigin,falconAimRig,falconBarrel,AIM_SCALE} from './slice-spec.js';
const TAU=Math.PI*2;
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function atlas(image,index,cols,rows){const x=Math.round(index%cols*image.width/cols),y=Math.round(Math.floor(index/cols)*image.height/rows);return{x,y,w:Math.round((index%cols+1)*image.width/cols)-x,h:Math.round((Math.floor(index/cols)+1)*image.height/rows)-y};}
function drawCell(c,img,index,cols,rows,x,y,w,h){const a=atlas(img,index,cols,rows);c.drawImage(img,a.x,a.y,a.w,a.h,x,y,w,h);}

export class SliceRenderer {
  constructor(owner,{shared,stage,index=0,theme='jungle'}){
    this.owner=owner;this.images=shared;this.stage=stage;this.index=index;this.theme=theme;this.accent=ART_COLORS[index];this.tiles=new Map();this.cachedPixels=0;
    const images=shared;
    // All gradients and full-screen color treatment are baked once.
    this.backdrop=surface(1600,900);let c=this.backdrop.getContext('2d');
    c.drawImage(stage.backdrop,0,-95,1600,1067);c.fillStyle='#082a3515';c.fillRect(0,0,1600,900);
    const shade=c.createLinearGradient(0,0,0,900);shade.addColorStop(0,'#041b2a35');shade.addColorStop(.6,'#06262d00');shade.addColorStop(1,'#04242c99');c.fillStyle=shade;c.fillRect(0,0,1600,900);
    this.crate=surface(48,48);const box=this.crate.getContext('2d');
    box.drawImage(images.terrain,663,805,260,240,3,6,40,38);box.fillStyle='#8c9988';box.fillRect(3,6,40,3);box.fillStyle='#182f31';box.fillRect(3,43,40,4);box.strokeStyle='#a7ad8c';box.lineWidth=3;box.strokeRect(4,8,38,35);box.fillStyle='#b8a777';box.fillRect(21,9,5,33);box.fillStyle='#253b3a';box.fillRect(17,21,13,11);box.fillStyle='#dbe6b3';box.fillRect(21,24,5,4);
    this.light=surface(160,160);c=this.light.getContext('2d');const light=c.createRadialGradient(80,80,1,80,80,80);light.addColorStop(0,'#ffeabbcf');light.addColorStop(.15,'#ffad5c55');light.addColorStop(1,'#ffad5c00');c.fillStyle=light;c.fillRect(0,0,160,160);
    this.vignette=surface(W,H);c=this.vignette.getContext('2d');const v=c.createRadialGradient(W/2,H*.44,280,W/2,H*.44,790);v.addColorStop(0,'#00161f00');v.addColorStop(1,'#00131c8f');c.fillStyle=v;c.fillRect(0,0,W,H);
    // A small terrain vocabulary, independent of world length or camera position.
    for(const type of ['earth','metal','platform'])this.tile(type);
    stage.backdrop.close();delete stage.backdrop;
  }
  dispose(){closeImages(this.stage);this.stage={};for(const c of [this.backdrop,this.crate,this.light,this.vignette,...this.tiles.values()]){c.width=1;c.height=1;}this.tiles.clear();}
  get retainedBytes(){return imageBytes(this.images)+imageBytes(this.stage)+(this.cachedPixels+1600*900+48*48+160*160+W*H)*4;}
  tile(type,width=320){
    const key=type+width;if(this.tiles.has(key))return this.tiles.get(key);
    const short=type==='platform',height=short?94:246,canvas=surface(width,height),c=canvas.getContext('2d');
    if(this.stage.tile){
      const img=this.stage.tile;
      c.drawImage(img,0,0,img.width,img.height,0,0,width,height);
      if(short){c.fillStyle='#06172144';c.fillRect(0,height*.65,width,height*.35);}
      this.tiles.set(key,canvas);this.cachedPixels+=width*height;return canvas;
    }
    const idx=short?2:type==='earth'?0:1,a=atlas(this.images.terrain,idx,2,2);
    // The horizontal wet lip is the collision surface. Moss can overhang it.
    const top=short?112:type==='earth'?116:119;
    c.drawImage(this.images.terrain,a.x+3,a.y+top,621,short?185:455,0,0,width,height);
    this.tiles.set(key,canvas);this.cachedPixels+=width*height;return canvas;
  }
  terrain(game,cam){
    const c=this.owner.c,right=cam+W/SLICE_ZOOM;
    for(const p of game.platforms){
      if(p.x>right+40||p.x+p.w<cam-40)continue;
      const type=p.h<70?'platform':p.type==='earth'?'earth':'metal';
      const tile=this.tile(type),height=type==='platform'?Math.min(68,p.h+36):Math.max(p.h,180);
      const first=Math.max(0,Math.floor((cam-p.x)/320));
      for(let i=first;i*320<p.w&&p.x+i*320<right+20;i++){
        const x=p.x+i*320,w=Math.min(320,p.w-i*320);
        c.drawImage(tile,0,0,w,tile.height,x,p.y,w,height);
      }
      // A stable highlight makes ledges readable through rain and muzzle flashes.
      c.fillStyle=this.accent+'90';c.fillRect(p.x,p.y,p.w,1.5);
    }
    for(const x of game.level.checkpoints){if(x<cam-50||x>right+50)continue;
      c.fillStyle='#162f33';c.fillRect(x,548,7,42);c.fillStyle='#a2d5ba';c.fillRect(x-3,542,13,9);
      this.glow(x+3,547,28,.35);c.fillStyle='#d9f5bb';c.fillRect(x,543,7,3);
    }
  }
  items(game,t,cam){
    const c=this.owner.c;for(const b of game.crates)if(!b.dead&&b.x>cam-60&&b.x<cam+W/SLICE_ZOOM+60)c.drawImage(this.crate,b.x-5,b.y-10,48,48);
    this.owner.items({crates:[],pickups:game.pickups.filter(p=>p.x>cam-60&&p.x<cam+W/SLICE_ZOOM+60)},t);
    if(game.sample==='intro'&&cam>2400){c.fillStyle='#d7edb65c';c.fillRect(3383,465,2,125);c.font='10px monospace';c.textAlign='right';c.fillStyle='#e3eec7';c.fillText(this.owner.i18n.t('sample.hold'),3368,515);}
  }
  glow(x,y,r,alpha=1){const c=this.owner.c;c.save();c.globalAlpha*=alpha;c.drawImage(this.light,x-r,y-r,r*2,r*2);c.restore();}
  player(p,t,{alpha=1,ghost=false}={}){
    const c=this.owner.c,img=this.images.falcon,{pose,gunY,footY}=falconRegistration(p),a=atlas(img,pose,4,3);
    const origin=falconOrigin(p),angle=p.face===1?p.aim:Math.PI-p.aim,rig=falconAimRig(p);
    if(!ghost&&p.grounded)ellipse(c,p.x+14,p.y+p.h,24,4,'#03171aa0');
    c.save();c.globalAlpha=alpha*(p.invuln>0&&!ghost&&Math.sin(t*30)>0?.55:1);
    c.translate(p.x+14,p.y+p.h);c.scale(p.face,1);
    if(rig){
      const aimImage=this.images.aim,cell=atlas(aimImage,rig.index,4,2),running=p.grounded&&Math.abs(p.vx)>28,useLegs=p.crouching||running;
      if(useLegs){const seam=p.crouching?264:195;c.save();c.scale(FALCON_SCALE,FALCON_SCALE);c.drawImage(img,a.x,a.y+seam,a.w,a.h-seam,-180,seam-footY,a.w,a.h-seam);c.restore();}
      c.scale(AIM_SCALE,AIM_SCALE);
      if(!useLegs)c.drawImage(aimImage,cell.x,cell.y+285,cell.w,cell.h-285,-200,285-455,cell.w,cell.h-285);
      c.translate(0,211-455+(p.crouching?22/AIM_SCALE:0));c.rotate(rig.angle-rig.baseAngle);c.translate(p.muzzle>0?-4*p.muzzle/.06:0,0);
      c.drawImage(aimImage,cell.x,cell.y,cell.w,292,-200,-211,cell.w,292);
    }else{
      c.scale(FALCON_SCALE,FALCON_SCALE);
      const seam=gunY+53;c.drawImage(img,a.x,a.y+seam,a.w,a.h-seam,-180,seam-footY,a.w,a.h-seam);
      c.translate(0,gunY-footY);c.rotate(angle);
      const kick=p.muzzle>0?(p.weapon===2?6:3)*(p.muzzle/.06):0;c.translate(-kick,0);
      c.drawImage(img,a.x,a.y,a.w,seam+7,-180,-gunY,a.w,seam+7);
    }
    c.restore();
    if(p.muzzle>0&&!ghost){
      const x=origin.x+Math.cos(p.aim)*falconBarrel(p),y=origin.y+Math.sin(p.aim)*falconBarrel(p);
      c.save();c.translate(x,y);c.rotate(p.aim);c.fillStyle='#fff6c7';c.beginPath();c.moveTo(-2,-3);c.lineTo(13,-7);c.lineTo(9,-2);c.lineTo(27,0);c.lineTo(9,3);c.lineTo(13,7);c.lineTo(-2,3);c.fill();c.restore();this.glow(x,y,30,.6);
    }
  }
  enemy(e,t){
    const c=this.owner.c;let index=e.type==='drone'?6:e.type==='turret'?7:Math.abs(e.vx)>25&&Math.sin(e.phase*12)>0?5:4;
    const crops=[[20,24,403,380],[24,76,403,327],[32,42,402,361],[37,43,386,361],[103,118,228,260],[88,129,266,256],[23,147,385,154],[64,99,345,276]];
    const a=atlas(this.images.combat,index,4,2),[sx,sy,sw,sh]=crops[index];
    const height=e.type==='drone'?37:e.type==='turret'?49:e.type==='heavy'?78:68,width=sw/sh*height;
    const center=e.x+e.w/2,foot=e.y+e.h;
    c.save();c.translate(center,foot);c.scale(-e.face,1);c.drawImage(this.images.combat,a.x+sx,a.y+sy,sw,sh,-width/2,-height,width,height);c.restore();
    if(e.flash>0)this.glow(center,e.y+24,30,.6);
    if(e.telegraph>.15){c.fillStyle='#ffc286';c.fillRect(center-2,e.y-height+e.h-12,4,8);this.glow(center,e.y+15,25,e.telegraph*.5);}
    if(e.hp<e.maxHp){c.fillStyle='#071b23';c.fillRect(e.x-4,e.y-20,e.w+8,3);c.fillStyle='#ffbe81';c.fillRect(e.x-4,e.y-20,(e.w+8)*e.hp/e.maxHp,3);}
  }
  boss(b,t){
    if(b.kind!=='guardian'){this.chapterBoss(b,t);return;}
    const c=this.owner.c,age=b.actionAge??10,idx=b.dead?3:age<.15?2:age<.55?3:b.telegraph>.25?1:0;
    const a=atlas(this.images.combat,idx,4,2),scale=.77,center=b.x+b.w*.58,foot=b.y+b.h;
    const recoil=age<.16?Math.sin(age/.16*Math.PI)*7:0;
    ellipse(c,center,foot+2,114,11,'#03141ac4');
    c.save();c.translate(center+recoil,foot);if(b.dead){c.rotate(Math.min(b.deathTime*.025,.07));c.globalAlpha=Math.max(.3,1-b.deathTime*.15);}
    c.drawImage(this.images.combat,a.x,a.y,a.w,a.h,-235*scale,-404*scale,a.w*scale,a.h*scale);c.restore();
    const coreX=center+13,coreY=foot-177;
    if(!b.dead)this.glow(coreX,coreY,45+(b.telegraph||0)*25,b.phase===2?.8:.45);
    if(b.flash>0)this.glow(coreX,coreY,100,.6);
    if(age<.13&&b.activeAttack==='volley'){this.glow(b.x-64,b.y+137,75,.9);c.fillStyle='#fff0b0';c.fillRect(b.x-95,b.y+133,34,8);}
    if(b.active&&!b.dead&&b.telegraph>.12){
      const label=this.owner.i18n.t(`boss.${b.patterns[b.attack%b.patterns.length]}`);
      c.textAlign='center';c.font='bold 11px monospace';const width=c.measureText(label).width+24;
      c.fillStyle='#091d27dd';c.fillRect(center-width/2,foot-342,width,23);c.fillStyle='#ffcb95';c.fillText(label,center,foot-327);
      c.fillStyle='#f5ac70';c.fillRect(center-width/2,foot-318,width*b.telegraph,2);
    }
  }
  chapterBoss(b,t){
    const c=this.owner.c,age=b.actionAge??10,attack=age<.42||b.telegraph>.55;
    const poses=this.stage.bosses,index=(b.kind==='queen'&&b.phase===3?2:0)+(attack?1:0),img=poses[index];
    // A common scale per pose pair prevents attack silhouettes from pumping in size.
    const reg=this.stage.bossRegistration[index],scale=b.kind==='ray'?(b.w+64)/reg.pairW:(b.h+20)/reg.pairH,width=img.width*scale,height=img.height*scale;
    const center=b.x+b.w/2,foot=b.kind==='ray'?b.y+b.h*.5+reg.pairH*scale*.5:b.y+b.h,hover=['ray','prism'].includes(b.kind);
    const recoil=age<.22?Math.sin(age/.22*Math.PI)*6:0,breath=b.dead?0:Math.sin(t*2)*.007;
    ellipse(c,center,590,Math.min(130,b.w*.48),hover?7:10,'#03141a80');
    c.save();c.translate(center+recoil,foot);c.scale(1+breath,1-breath);
    if(b.dead){c.rotate(Math.min(b.deathTime*.025,.07));c.globalAlpha=Math.max(.3,1-b.deathTime*.15);}
    c.drawImage(img,-reg.anchorX*scale,-reg.anchorY*scale,width,height);c.restore();
    const coreX=b.x+b.w*.35,coreY=b.y+b.h*.5;
    if(!b.dead)this.glow(coreX,coreY,28+b.telegraph*28,b.phase>1?.5:.22);
    if(b.flash>0)this.glow(coreX,coreY,70,.6);
    if(age<.16&&['volley','spiral','brood','barrage','crossfire'].includes(b.activeAttack))this.glow(coreX,coreY,65,.85);
    if(b.active&&!b.dead&&b.telegraph>.12){
      const label=this.owner.i18n.t(`boss.${b.patterns[b.attack%b.patterns.length]}`);
      c.textAlign='center';c.font='bold 11px monospace';const w=c.measureText(label).width+24,y=Math.max(160,foot-height-29);
      c.fillStyle='#091d27e8';c.fillRect(center-w/2,y,w,23);c.fillStyle='#ffceab';c.fillText(label,center,y+16);
      c.fillStyle=this.accent;c.fillRect(center-w/2,y+25,w*b.telegraph,2);
    }
  }
  atmosphere(cam,t){
    const c=this.owner.c,theme=this.theme,count=theme==='snow'?48:theme==='jungle'||theme==='waterfall'?42:24;
    c.save();c.strokeStyle=theme==='snow'?'#efffff88':this.accent+'40';c.lineWidth=theme==='snow'?2:1;c.beginPath();
    for(let i=0;i<count;i++){
      const rain=theme==='jungle'||theme==='waterfall',up=theme==='foundry'||theme==='reactor'||theme==='hive';
      const x=((i*173-t*(rain?65:18)-cam*.12)%1380+1380)%1380-50,y=((i*83+t*(rain?430:up?-24:32))%790+790)%790-40;
      c.moveTo(x,y);c.lineTo(x+(rain?-5:1),y+(rain?19:theme==='snow'?3:1));
    }c.stroke();c.restore();
  }
  render(game){
    const r=this.owner,c=r.c,t=game.visualTime,menu=game.state==='menu',cam=menu?game.world-W/SLICE_ZOOM:game.camera;
    c.setTransform(r.dpr,0,0,r.dpr,0,0);c.fillStyle='#06171d';c.fillRect(0,0,r.width,r.height);c.translate(r.ox,r.oy);c.scale(r.scale,r.scale);c.save();c.beginPath();c.rect(0,0,W,H);c.clip();
    const shift=Math.max(0,Math.min(320,cam/(game.world-W/SLICE_ZOOM)*320));c.drawImage(this.backdrop,-shift,-70,1600,900);
    const shake=r.reduced?0:Math.min(game.shake,9);c.translate(Math.sin(t*103)*shake,Math.cos(t*131)*shake*.5);
    c.save();c.translate(0,H*(1-SLICE_ZOOM));c.scale(SLICE_ZOOM,SLICE_ZOOM);c.translate(-cam,0);
    this.terrain(game,cam);
    // Hazard warnings and conveyor arrows remain registered to real collision surfaces.
    c.save();c.translate(cam,0);drawTerrainDetails(c,{platforms:game.platforms.filter(p=>p.conveyor),environment:game.environment},cam,t);c.restore();
    const visible=W/SLICE_ZOOM;
    if(menu){this.boss({...game.boss,active:false,dead:false,actionAge:10},t);this.player({...game.player,x:game.boss.arena+240,y:532,h:58,crouching:false,grounded:true,invuln:0,aim:0,face:1,vx:0},t);}
    else{
      this.items(game,t,cam);
      for(const e of game.enemies)if(!e.dead&&e.x>cam-120&&e.x<cam+visible+120)this.enemy(e,t);
      if(game.boss.x<cam+visible+240&&game.boss.x>cam-400)this.boss(game.boss,t);
      for(let i=0;i<game.ghosts.length;i+=2){const g=game.ghosts[i];this.player({...game.player,...g,invuln:0,muzzle:0},t,{ghost:true,alpha:g.life/.22*.22});}
      this.player(game.player,t);r.effects(game,t);
      if(game.boss.active&&!game.boss.dead){c.fillStyle='#f5a77c60';c.fillRect(game.boss.arena,340,2,250);}
    }
    c.restore();
    if(!r.reduced)this.atmosphere(cam,t);
    const a=atlas(this.images.terrain,3,2,2);
    if(this.theme==='jungle')for(let i=-1;i<3;i++){const x=i*780-(cam*.18)%780;c.drawImage(this.images.terrain,a.x,a.y+230,a.w,380,x,650,400,240);}
    c.drawImage(this.vignette,0,0);
    if(game.flash>0){c.fillStyle=`rgba(255,94,55,${game.flash*.7})`;c.fillRect(0,0,W,H);}c.restore();
  }
}
