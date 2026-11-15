import {W,H,WORLD,PLATFORMS,WEAPONS,clamp} from './game.js';
const TAU=Math.PI*2;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function line(c,x1,y1,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
export class Renderer {
  constructor(canvas,i18n){this.i18n=i18n;this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.width=0;this.height=0;this.scale=1;this.ox=0;this.oy=0;this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.layers=this.createLayers();this.resize();}
  resize(){const dpr=Math.min(window.devicePixelRatio||1,2),w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.canvas.width=Math.floor(w*dpr);this.canvas.height=Math.floor(h*dpr);this.dpr=dpr;this.width=w;this.height=h;this.scale=Math.min(w/W,h/H);this.ox=(w-W*this.scale)/2;this.oy=(h-H*this.scale)/2;}
  point(x,y,camera){const r=this.canvas.getBoundingClientRect();return{x:(x-r.left-this.ox)/this.scale+camera,y:(y-r.top-this.oy)/this.scale};}
  createLayers(){const layers=[];for(let level=0;level<3;level++){const canvas=document.createElement('canvas');canvas.width=2300;canvas.height=720;const c=canvas.getContext('2d'),random=rng(117+level*400);const color=['#294c4d','#1a3e40','#112e31'][level];
    for(let i=0;i<34-level*5;i++){const x=random()*2300,y=330+random()*230,h=120+random()*300,w=35+random()*60;poly(c,[[x-w,y+150],[x-w*.55,y-h*.3],[x-10,y-h],[x+12,y-h*1.05],[x+w*.55,y-h*.3],[x+w,y+150]],color);for(let j=0;j<7;j++){const lx=x+(random()-.5)*w*3,ly=y-h+random()*h*.9;this.leafCluster(c,lx,ly,40+random()*65,color,random);}}
    layers.push(canvas);}return layers;}
  leafCluster(c,x,y,r,color,random){c.fillStyle=color;for(let i=0;i<6;i++){c.beginPath();c.ellipse(x+(random()-.5)*r,y+(random()-.5)*r*.6,r*(.35+random()*.6),r*(.18+random()*.3),random()*1.3-.65,0,TAU);c.fill();}}
  background(cam,t){const c=this.c;
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#102b32');sky.addColorStop(.42,'#335959');sky.addColorStop(.76,'#608076');sky.addColorStop(1,'#172f32');c.fillStyle=sky;c.fillRect(0,0,W,H);
    glow(c,850-cam*.025,150,420,'#ccdfb322');circle(c,880-cam*.025,115,42,'#c7d9b81a');
    const rand=rng(41);for(let i=0;i<14;i++){const x=i*160-(cam*.07)%160,y=270+rand()*120;poly(c,[[x-90,450],[x-35,y],[x+20,y-65],[x+70,y+30],[x+160,450]],'#315358');}
    for(let i=0;i<3;i++){const layer=this.layers[i],shift=(cam*[.12,.25,.45][i])%2300;c.globalAlpha=[.65,.7,.9][i];c.drawImage(layer,-shift,0);c.drawImage(layer,2300-shift,0);c.globalAlpha=1;
      const mist=c.createLinearGradient(0,220+i*90,0,600);mist.addColorStop(0,'#a1c6b000');mist.addColorStop(1,['#91bba61c','#80baa61c','#72b4aa10'][i]);c.fillStyle=mist;c.fillRect(0,200,W,450);}
    // Light shafts are painted between parallax planes, never over the HUD.
    c.save();c.globalCompositeOperation='screen';for(let i=0;i<4;i++){const x=420+i*240-cam*.04;const beam=c.createLinearGradient(x,0,x-230,650);beam.addColorStop(0,'#d5e8af10');beam.addColorStop(1,'#d5e8af00');poly(c,[[x,0],[x+40,0],[x-200,650],[x-380,650]],beam);}c.restore();
    this.ruins(cam,t);
    const river=c.createLinearGradient(0,590,0,720);river.addColorStop(0,'#6aa295');river.addColorStop(.25,'#244d52');river.addColorStop(1,'#0a242c');c.fillStyle=river;c.fillRect(0,590,W,130);
    for(let i=0;i<42;i++){const x=((i*113+t*(8+i%4*6)-cam*.55)%1400+1400)%1400-80,y=604+(i*31)%114;line(c,x,y,x+20+(i%6)*13,y,i%3?'#8bd5be18':'#d5edcd3c',1);}
    // A distant waterfall beneath the bridge.
    const wx=3000-cam*.8;if(wx>-300&&wx<1500){const gr=c.createLinearGradient(0,410,0,720);gr.addColorStop(0,'#b8dfc30a');gr.addColorStop(1,'#b8dfc350');rect(c,wx,410,170,310,gr);for(let i=0;i<18;i++)line(c,wx+i*9,420+(t*100+i*28)%190,wx+i*9-5,580+(t*100+i*28)%140,'#d5edcd22',2);}
  }
  ruins(cam,t){const c=this.c;
    const baseX=4740-cam*.8;
    for(let n=0;n<3;n++){const x=baseX+n*210,y=160+n%2*90;if(x< -300||x>W+200)continue;
      poly(c,[[x,590],[x+15,y+130],[x+28,y+130],[x+35,y],[x+110,y],[x+130,y+130],[x+148,y+130],[x+175,590]],'#183438');
      rect(c,x+48,y+18,50,6,'#527a6f');rect(c,x+48,y+45,50,4,'#527a6f50');
      for(let j=0;j<4;j++){rect(c,x+43,y+90+j*55,66,25,'#0c272c');rect(c,x+47,y+94+j*55,3,17,j%2?'#c6bf6640':'#8aab9240');}
      line(c,x+72,y,x+72,y-95,'#23464a',5);line(c,x+45,y-65,x+100,y-65,'#23464a',3);circle(c,x+72,y-96,3,Math.sin(t*3+n)>0?'#ff9b76':'#833c37');
      for(let j=0;j<6;j++){line(c,x+20+j*20,y+100,x+7+j*25,y+240+j*25,'#315746',3);}
    }
    for(const wx of [750,2020,4320]){const x=wx-cam*.7;if(x< -200||x>W+100)continue;poly(c,[[x,570],[x+10,260],[x+62,240],[x+80,570]],'#224245');rect(c,x+24,280,22,80,'#102d32');for(let j=0;j<4;j++)line(c,x+10,385+j*34,x+66,380+j*34,'#557a6340',3);}
    const bx=5850-cam*.9;if(bx>-1300&&bx<W){rect(c,bx,340,1200,260,'#163137');rect(c,bx,327,1200,15,'#3d5a54');for(let i=0;i<16;i++){rect(c,bx+i*80+10,360,55,35,'#0b252b');line(c,bx+i*80+10,412,bx+i*80+65,412,'#66816c40',2);}rect(c,bx+300,200,340,130,'#1a373b');rect(c,bx+320,220,300,15,'#0d272e');c.font='12px monospace';c.fillStyle='#6d8d7960';c.fillText(this.i18n.t('world.restricted'),bx+340,281);}
  }
  ground(cam,t){const c=this.c;for(const p of PLATFORMS){const x=p.x-cam;if(x>W+50||x+p.w< -50)continue;const rand=rng(p.x+123);if(p.type==='earth'){
      const grd=c.createLinearGradient(0,p.y,0,p.y+p.h);grd.addColorStop(0,'#273c35');grd.addColorStop(.3,'#172e2d');grd.addColorStop(1,'#0b1c22');rect(c,x,p.y,p.w,p.h,grd);
      for(let j=0;j<p.w/33;j++){const xx=x+rand()*p.w,yy=p.y+14+rand()*p.h;poly(c,[[xx,yy],[xx+14,yy-7],[xx+35,yy+6],[xx+28,yy+20],[xx+3,yy+16]],rand()>.5?'#364b3d66':'#09202688');}
      rect(c,x,p.y,p.w,5,'#779b63');rect(c,x,p.y+5,p.w,7,'#3c634a');
      for(let j=0;j<p.w/14;j++){const xx=x+j*14,hh=4+rand()*14;line(c,xx,p.y,xx-4,p.y-hh,'#6b9260',2);line(c,xx+4,p.y,xx+8,p.y-hh*.7,'#466b4b',2);}
      for(let j=0;j<8;j++){const xx=x+rand()*p.w;line(c,xx,p.y+8,xx+15,p.y+40+rand()*50,'#3a5c4480',2);}
    }else if(p.type==='bridge'){
      rect(c,x,p.y,p.w,p.h,'#263c3b');rect(c,x,p.y,p.w,4,'#91a28b');for(let j=0;j<p.w/27;j++){rect(c,x+j*27,p.y+4,23,p.h-5,'#506357');line(c,x+j*27,p.y+5,x+j*27+21,p.y+5,'#a2ab8270');}
      line(c,x,p.y+28,x+p.w,p.y+28,'#b4a17a',2);for(let j=0;j<p.w/90;j++){line(c,x+j*90,p.y-43,x+j*90,p.y+30,'#576e61',4);}c.strokeStyle='#647c6d';c.lineWidth=2;c.beginPath();c.moveTo(x,p.y-42);c.quadraticCurveTo(x+p.w/2,p.y-5,x+p.w,p.y-42);c.stroke();
      if(p.h>50){for(let j=0;j<p.w/150;j++){line(c,x+j*150,p.y+22,x+j*150+110,720,'#172f32',10);line(c,x+j*150+110,p.y+22,x+j*150,720,'#172f32',8);}}
    }else{
      rect(c,x,p.y,p.w,p.h,p.type==='metal'?'#273e40':'#3c5247');rect(c,x,p.y,p.w,4,p.type==='metal'?'#95a591':'#81966a');rect(c,x,p.y+5,p.w,3,'#142c30');
      for(let j=0;j<p.w/45;j++){rect(c,x+j*45+7,p.y+10,31,5,'#132c30');circle(c,x+j*45+5,p.y+14,1.5,'#83998b');}
      if(p.h<50){poly(c,[[x+15,p.y+p.h],[x+30,p.y+p.h+18],[x+55,p.y+p.h]],'#1d3435');poly(c,[[x+p.w-55,p.y+p.h],[x+p.w-30,p.y+p.h+18],[x+p.w-15,p.y+p.h]],'#1d3435');}
      else{for(let j=0;j<p.w/190;j++){rect(c,x+j*190+8,p.y+36,175,95,'#132b30');poly(c,[[x+j*190+12,p.y+38],[x+j*190+183,p.y+120],[x+j*190+183,p.y+128],[x+j*190+12,p.y+46]],'#324b44');}for(let j=0;j<p.w/36;j++)poly(c,[[x+j*36,p.y+20],[x+j*36+12,p.y+20],[x+j*36+20,p.y+10],[x+j*36+8,p.y+10]],'#c9b66665');}
    }}
    for(const cp of [2380,4480,5900]){const x=cp-cam;if(x< -50||x>W+50)continue;rect(c,x,534,8,56,'#2d5553');rect(c,x-6,528,20,12,'#7bafa0');rect(c,x-4,530,16,5,'#c2f59e');glow(c,x+4,532,46,'#c2f59e30');line(c,x+4,526,x+4,430,'#c2f59e30',1);circle(c,x+4,430+Math.sin(t*3)*4,3,'#d9f5b0');}
  }
  palm(x,y,scale,flip,t,color='#0b2427'){const c=this.c;c.save();c.translate(x,y);c.scale(scale*flip,scale);c.strokeStyle=color;c.lineWidth=22;c.beginPath();c.moveTo(-40,330);c.quadraticCurveTo(5,150,0,0);c.stroke();
    for(let i=0;i<9;i++){const a=-Math.PI+i*.38+Math.sin(t*.5)*.02,len=130+(i%3)*35,ex=Math.cos(a)*len,ey=Math.sin(a)*len*.4+25;c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(ex*.7,ey-55,ex,ey);c.stroke();for(let j=1;j<12;j++){const u=j/12,px=ex*u,py=ey*u-45*Math.sin(u*Math.PI);poly(c,[[px,py],[px-8,py+5],[px+ex*.1-10,py+40*(1-u)+15],[px+8,py+3]],color);}}
    c.restore();}
  foliage(cam,t,foreground=false){const c=this.c,rand=rng(foreground?77:300);const count=foreground?17:35;for(let i=0;i<count;i++){const wx=i*(foreground?480:235)+rand()*160,x=wx-cam*(foreground?1.08:.9),y=foreground?697:593;if(x< -300||x>W+300)continue;
      if(i%4===0)this.palm(x,foreground?285:350,.7+rand()*.55,i%2?1:-1,t,foreground?'#071c21':'#14332e');
      const color=foreground?'#071e24':'#284a37';for(let j=0;j<8;j++){const a=-2.9+j*.38,h=30+rand()*60;const sway=Math.sin(t+i+j)*2;poly(c,[[x,y],[x+Math.cos(a)*h*.35+sway,y+Math.sin(a)*h*.55],[x+Math.cos(a)*h,y+Math.sin(a)*h],[x+Math.cos(a)*h*.6-5,y+Math.sin(a)*h*.5]],color);}
    }
    if(foreground){const vignette=c.createRadialGradient(W/2,H*.45,250,W/2,H*.45,830);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#020e17b0');c.fillStyle=vignette;c.fillRect(0,0,W,H);}
  }
  player(p,t,{ghost=false,alpha=1}={}){const c=this.c;c.save();c.globalAlpha=alpha;if(p.invuln>0&&!ghost&&Math.sin(t*32)>0)c.globalAlpha*=.55;c.translate(p.x+14,p.y+29);c.scale(p.face,1);const running=p.grounded&&Math.abs(p.vx)>25,step=running?Math.sin(p.step):0,air=!p.grounded;const squash=p.land||0;c.scale(1+squash*.07,1-squash*.09);const body=ghost?'#97ead9':'#779991',dark=ghost?'#a1eedb':'#1a373b',light=ghost?'#a1eedb':'#c7d1af';
    // The scarf and asymmetrical armor keep the silhouette readable at speed.
    poly(c,[[-6,-19],[-22,-21+Math.sin(t*14)*4],[-38,-15+Math.sin(t*12)*6],[-24,-13],[-6,-13]],ghost?'#a1eedb':'#eb714e');
    line(c,-5,7,-9-step*9,23, dark,9);line(c,-9-step*9,23,-7-step*13,29,dark,8);line(c,5,6,9+step*8,air?18:23,body,10);line(c,9+step*8,air?18:23,10+step*13,air?22:29,body,8);
    rect(c,-14-step*13,26,13,5,dark);rect(c,6+step*13,26,15,5,dark);rect(c,-11,2,22,9,dark);rect(c,-12,-17,24,22,body);poly(c,[[-12,-17],[4,-21],[13,-13],[8,4],[-10,2]],body);rect(c,-10,-14,16,15,dark);rect(c,-7,-12,3,11,light);rect(c,-1,-12,3,11,light);rect(c,-12,4,25,4,'#bcac7b');rect(c,-2,4,6,5,'#2a4644');rect(c,-17,-11,6,19,'#2b4746');
    rect(c,-8,-30,16,16,'#c8ae89');poly(c,[[-10,-26],[-9,-34],[7,-34],[11,-27],[8,-25]],dark);rect(c,-7,-28,18,5,'#e87a51');rect(c,4,-27,8,3,'#e5e6bd');rect(c,7,-20,5,3,'#87674f');
    const a=p.face===1?p.aim:Math.PI-p.aim;c.save();c.translate(2,-7);c.rotate(a);line(c,-5,0,15,5,body,9);line(c,15,5,23,0,'#c2b68f',7);rect(c,10,-7,31,10,dark);rect(c,15,-9,23,4,'#82988c');rect(c,21,2,8,9,'#2a4140');rect(c,38,-5,10,5,'#8b9e8e');rect(c,16,-6,12,2,WEAPONS[p.weapon||0].color);rect(c,22,-13,12,4,'#182f35');if(p.muzzle>0){poly(c,[[47,-4],[65,-10],[60,-3],[76,0],[59,2],[64,8],[47,2]],'#fbf7c4');glow(c,53,0,38,'#ecfbb466');}c.restore();
    if(p.dash>0){line(c,-60,0,-10,0,'#c8ffdb',2);line(c,-90,8,-30,8,'#c8ffdb60');}c.restore();}
  enemy(e,t){const c=this.c;c.save();c.translate(e.x+e.w/2,e.y);const flash=e.flash>0;const armor=flash?'#fff1cb':e.type==='heavy'?'#8f7059':'#637568';const dark=flash?'#fff1cb':'#203a3a';
    if(e.type==='drone'){c.rotate(Math.sin(t*3+e.phase)*.08);line(c,-27,8,27,8,dark,7);rect(c,-38,0,24,5,'#8d9b85');rect(c,14,0,24,5,'#8d9b85');rect(c,-36,-3,20,2,'#c3d6b060');rect(c,16,-3,20,2,'#c3d6b060');poly(c,[[-20,5],[-10,-4],[10,-4],[20,5],[14,23],[-14,23]],armor);rect(c,-12,6,24,8,dark);rect(c,-7,8,14,4,'#ff8f5b');glow(c,0,10,22,'#ff794c35');line(c,-11,21,-15,28,dark,3);line(c,11,21,15,28,dark,3);}
    else if(e.type==='turret'){poly(c,[[-25,34],[-18,20],[18,20],[25,34]],dark);rect(c,-18,24,36,7,armor);circle(c,0,14,16,armor);circle(c,0,14,10,dark);const angle=Math.atan2(this.game.player.y-e.y,this.game.player.x-e.x);c.save();c.rotate(angle);rect(c,0,5,34,9,armor);rect(c,27,5,12,10,dark);rect(c,7,6,18,2,'#abb394');c.restore();circle(c,0,14,4,'#ff8d56');}
    else{c.scale(e.face,1);const st=Math.sin(e.phase*6)*(e.vx?5:1);line(c,-8,36,-9-st,53,dark,10);line(c,8,36,9+st,53,armor,10);rect(c,-15-st,51,14,5,dark);rect(c,4+st,51,15,5,dark);poly(c,[[-16,16],[-8,12],[11,12],[18,22],[14,40],[-14,40]],armor);rect(c,-9,19,20,15,dark);rect(c,-6,21,14,3,e.type==='heavy'?'#ec9d58':'#b6ac7b');rect(c,-10,35,24,5,'#313e34');rect(c,-11,0,22,17,dark);poly(c,[[-14,4],[-9,-3],[9,-3],[14,4]],armor);rect(c,1,6,13,4,'#ff935e');line(c,-8,21,12,30,armor,9);rect(c,7,23,e.type==='heavy'?42:31,9,dark);rect(c,12,24,20,3,'#a4a68a');rect(c,32,22,10,12,armor);if(e.type==='heavy'){rect(c,-23,14,10,23,armor);rect(c,-21,17,6,4,'#dd9d5b');}}
    if(e.telegraph>0){glow(c,0,8,24+e.telegraph*22,'#ff70494d');circle(c,0,-16,3+e.telegraph*3,'#ffb976');}
    c.restore();if(e.hp<e.maxHp){rect(c,e.x,e.y-12,e.w,3,'#102728');rect(c,e.x,e.y-12,e.w*e.hp/e.maxHp,3,'#ffb17b');}}
  boss(b,t){const c=this.c,x=b.x+92,y=b.y+125;const flash=b.flash>0,armor=flash?'#fff1cd':'#637972',edge=flash?'#fff1cd':'#91a28b',dark=flash?'#fff1cd':'#1a343a';c.save();c.translate(x,y);const idle=Math.sin(t*2)*3;c.translate(0,idle);if(b.dead)c.rotate(Math.sin(t*35)*.02);
    // Rear cooling fins and exposed cablework.
    for(let i=0;i<7;i++){rect(c,-72+i*22,-125,13,50,'#203c40');rect(c,-72+i*22,-123,13,5,edge);}line(c,-70,-75,-105,-25,'#152f35',12);line(c,70,-75,105,-25,'#152f35',12);
    for(const s of [-1,1]){c.save();c.scale(s,1);circle(c,50,51,26,dark);line(c,50,58,62,98,dark,26);line(c,62,85,75,124,armor,26);poly(c,[[43,78],[69,70],[84,104],[69,115],[45,100]],armor);rect(c,51,81,20,6,edge);poly(c,[[60,110],[91,112],[108,128],[105,135],[48,135],[45,126]],dark);rect(c,54,127,44,5,edge);circle(c,59,85,8,'#2c4b4e');circle(c,59,85,3,'#b6b688');c.restore();}
    poly(c,[[-80,-84],[-46,-108],[44,-108],[80,-83],[94,-22],[74,51],[38,74],[-42,74],[-80,46],[-94,-22]],dark);
    poly(c,[[-76,-83],[-45,-99],[-8,-94],[-21,-45],[-64,-30],[-86,-38]],armor);poly(c,[[76,-83],[45,-99],[8,-94],[21,-45],[64,-30],[86,-38]],armor);
    line(c,-64,-74,-31,-84,edge,4);line(c,64,-74,31,-84,edge,4);rect(c,-36,-130,72,44,dark);rect(c,-30,-125,60,20,armor);rect(c,-27,-112,54,9,'#101f29');rect(c,-24,-110,48,4,'#ff9a62');glow(c,0,-107,65,'#ff6b4329');
    poly(c,[[-58,-23],[-25,-45],[26,-45],[60,-22],[58,27],[30,47],[-30,47],[-58,25]],armor);circle(c,0,0,39,'#102d35');circle(c,0,0,31,'#365c5b');circle(c,0,0,23,'#172e36');
    const core=b.dead?'#858b6a':b.phase===2?'#ff6a49':'#ffbe76';glow(c,0,0,80,b.phase===2?'#ff704955':'#ffc27b40');circle(c,0,0,17+Math.sin(t*5)*2,core);circle(c,0,0,8,'#fff1c4');
    for(let i=0;i<6;i++){const a=i*TAU/6+t*.4;line(c,Math.cos(a)*25,Math.sin(a)*25,Math.cos(a)*34,Math.sin(a)*34,edge,4);}
    for(const s of [-1,1]){c.save();c.scale(s,1);poly(c,[[77,-60],[111,-47],[120,-3],[97,24],[75,-7]],armor);rect(c,93,-45,12,28,dark);line(c,99,16,103,58,dark,22);poly(c,[[86,38],[119,38],[130,87],[115,102],[84,89]],armor);rect(c,91,46,29,32,dark);for(let i=0;i<3;i++)rect(c,95+i*8,50,4,37,'#789187');rect(c,91,86,32,8,'#142b32');for(let i=0;i<3;i++)circle(c,97+i*9,91,2.4,core);rect(c,81,-41,3,23,edge);c.restore();}
    rect(c,-26,54,52,9,edge);for(let i=0;i<5;i++)rect(c,-22+i*10,55,6,5,'#2f4644');c.font='9px monospace';c.textAlign='center';c.fillStyle='#c2c7a4';c.fillText('AEGIS–07',0,-66);
    if(b.telegraph>.1&&b.active&&!b.dead){c.font='bold 12px monospace';c.fillStyle='#ffd1a5';c.textAlign='center';c.fillText(this.i18n.t(['boss.volley','boss.mortar','boss.wave'][b.attack%3]),0,-154);const r=48+b.telegraph*35;c.strokeStyle='#ff8f6280';c.lineWidth=2;c.beginPath();c.arc(0,0,r,-Math.PI/2,-Math.PI/2+b.telegraph*TAU);c.stroke();glow(c,0,0,130,'#ff704920');}
    c.restore();}
  items(game,t){const c=this.c;for(const box of game.crates){if(box.dead)continue;rect(c,box.x,box.y,38,38,'#56614b');rect(c,box.x+3,box.y+3,32,32,'#293d35');line(c,box.x+6,box.y+6,box.x+31,box.y+31,'#a5a377',4);line(c,box.x+31,box.y+6,box.x+6,box.y+31,'#a5a377',4);rect(c,box.x+14,box.y+14,10,10,'#c5b67a');}
    for(const item of game.pickups){if(item.dead)continue;const x=item.x+15,y=item.y+15+Math.sin(t*3+item.x)*5;const col=item.type==='rail'?'#83dfeb':item.type==='scatter'?'#ffca83':'#d4f29d';glow(c,x,y,40,col+'26');c.save();c.translate(x,y);c.rotate(Math.PI/4);rect(c,-14,-14,28,28,'#102c30');c.strokeStyle=col;c.lineWidth=1.5;c.strokeRect(-14,-14,28,28);c.restore();c.font='bold 16px monospace';c.textAlign='center';c.fillStyle=col;c.fillText(item.type==='health'?'+':item.type==='grenade'?'◆':item.type==='rail'?'R':'S',x,y+6);}
  }
  effects(game,t){const c=this.c;
    for(const b of game.bullets){const l=b.rail?80:b.player?23:14,a=Math.atan2(b.vy,b.vx);line(c,b.x-Math.cos(a)*l,b.y-Math.sin(a)*l,b.x,b.y,b.color,b.rail?5:b.player?3:4);if(!b.player){circle(c,b.x,b.y,b.r+3,'#ff704933');circle(c,b.x,b.y,b.r,'#ff9f65');circle(c,b.x,b.y,b.r*.5,'#fff0b7');}else{circle(c,b.x,b.y,b.r+1,'#f7ffd6');}}
    for(const g of game.grenades){circle(c,g.x,g.y,6,'#bbd48b');circle(c,g.x+1,g.y-2,2,Math.sin(t*25)>0?'#ff7149':'#f2dfac');line(c,g.x-g.vx*.04,g.y-g.vy*.04,g.x,g.y,'#c2db8c55',2);}
    for(const h of game.hazards){if(h.type==='mortar'){if(!h.hit){c.save();c.globalAlpha=.45+Math.sin(t*15)*.2;c.strokeStyle='#ff774e';c.lineWidth=2;c.beginPath();c.ellipse(h.x,586,60,9,0,0,TAU);c.stroke();line(c,h.x,580,h.x,500,'#ff8d5760',1);poly(c,[[h.x-7,510],[h.x+7,510],[h.x,521]],'#ff8e5c');c.font='10px monospace';c.textAlign='center';c.fillStyle='#ffb186';c.fillText('!',h.x,498);c.restore();if(h.timer<.35){const yy=100+(1-h.timer/.35)*480;line(c,h.x,yy-100,h.x,yy,'#ffd48b',4);}}}else{glow(c,h.x+30,580,70,'#ff9a5b60');poly(c,[[h.x,590],[h.x+15,555],[h.x+28,575],[h.x+40,549],[h.x+60,590]],'#ffd18c');}}
    c.save();c.globalCompositeOperation='lighter';for(const p of game.particles){c.globalAlpha=clamp(p.life/p.max,0,1);rect(c,p.x,p.y,p.r,p.r,p.color);}c.globalAlpha=1;for(const r of game.rings){c.globalAlpha=r.life/.35;c.strokeStyle=r.color;c.lineWidth=2;c.beginPath();c.arc(r.x,r.y,r.r*(1-r.life/.35),0,TAU);c.stroke();}c.restore();
    for(const text of game.texts){c.globalAlpha=Math.min(1,text.life*2);c.font='bold 13px monospace';c.textAlign='center';c.fillStyle=text.color;c.fillText(this.i18n.text(text.text),text.x,text.y);}c.globalAlpha=1;
  }
  atmosphere(cam,t){const c=this.c;c.save();for(let i=0;i<60;i++){const x=((i*179-t*85-cam*.15)%1400+1400)%1400-50,y=(i*67+t*410)%780-30;line(c,x,y,x-5,y+17,'#b7d9c51b',1);}for(let i=0;i<20;i++){const x=((i*83+Math.sin(t*.6+i)*30-cam*.35)%1300+1300)%1300,y=280+(i*31)%280+Math.sin(t+i)*10;c.globalAlpha=.3+Math.sin(t*2+i)*.25;circle(c,x,y,1.5,'#e3eaa2');}c.restore();}
  render(game){this.game=game;const c=this.c,t=game.visualTime;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#091b20';c.fillRect(0,0,this.width,this.height);c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);c.save();c.beginPath();c.rect(0,0,W,H);c.clip();
    const menu=game.state==='menu',cam=menu?5650+Math.sin(t*.08)*18:game.camera;let shake=this.reduced?0:game.shake;c.translate(Math.sin(t*103)*shake,Math.cos(t*131)*shake*.55);
    this.background(cam,t);this.foliage(cam,t);this.ground(cam,t);
    c.save();c.translate(-cam,0);
    if(menu){this.boss({...game.boss,dead:false,active:false,x:6650,y:330},t);this.player({...game.player,x:6400,y:522,grounded:true,invuln:0,aim:-.12,vx:0,face:1},t);}
    else{this.items(game,t);for(const e of game.enemies)if(!e.dead&&e.x>cam-100&&e.x<cam+W+100)this.enemy(e,t);if(game.boss.x<cam+W+200)this.boss(game.boss,t);for(const ghost of game.ghosts)this.player({...game.player,...ghost,invuln:0,muzzle:0},t,{ghost:true,alpha:ghost.life/.22*.35});this.player(game.player,t);this.effects(game,t);
      if(game.boss.active&&!game.boss.dead){const xx=5895;rect(c,xx,280,3,310,'#ff976b80');glow(c,xx,450,70,'#ff70492b');for(let i=0;i<12;i++)rect(c,xx-3,280+i*26+(t*60)%26,9,12,'#ffad7750');}
    }
    c.restore();this.atmosphere(cam,t);this.foliage(cam,t,true);
    if(game.flash>0){c.fillStyle=`rgba(255,85,50,${game.flash})`;c.fillRect(0,0,W,H);}
    if(!menu&&game.player.hp<30){const g=c.createRadialGradient(W/2,H/2,200,W/2,H/2,700);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(170,45,30,${.15+Math.sin(t*5)*.07})`);c.fillStyle=g;c.fillRect(0,0,W,H);}
    c.restore();
  }
}
