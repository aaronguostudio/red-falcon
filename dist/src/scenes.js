// Procedural chapter scenery and boss silhouettes. No network assets are needed.
const TAU=Math.PI*2;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
const line=(c,x,y,xx,yy,color,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();};
const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');rect(c,x-r,y-r,r*2,r*2,g);}
export const PALETTES={base:['#081721','#23454d','#8de6ed'],waterfall:['#102e3d','#528c97','#b8f3e3'],foundry:['#251b23','#65443c','#ffac65'],snow:['#21394f','#92aeb8','#d5f5ff'],rail:['#251e2d','#997366','#ffd49c'],reactor:['#11192e','#35426b','#d8b8ff'],hive:['#241627','#573747','#f29cbb']};
export function drawBackdrop(c,theme,cam,t){
  const [top,bottom,accent]=PALETTES[theme];
  const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,top);sky.addColorStop(1,bottom);rect(c,0,0,1280,720,sky);
  glow(c,920-cam*.02,190,340,accent+'20');
  if(theme==='waterfall'||theme==='snow'||theme==='rail'){
    circle(c,1010-cam*.025,135,theme==='rail'?65:39,accent+'48');
    for(let layer=0;layer<3;layer++)for(let i=0;i<12;i++){
      const x=i*230-(cam*(.08+layer*.07))%230-230,y=220+layer*90+Math.sin(i*7)*65;
      poly(c,[[x-70,650],[x+70,y],[x+120,y-65],[x+220,650]],['#294353','#24404a','#172e39'][layer]);
      if(theme==='snow')poly(c,[[x+29,y+98],[x+70,y],[x+120,y-65],[x+143,y+101],[x+100,y+64],[x+66,y+105]],['#8cabb4','#9dbdc3','#aac9ce'][layer]);
    }
    if(theme==='waterfall')for(let i=0;i<9;i++){
      const x=i*310-(cam*.55)%310-200;
      rect(c,x,170,62,550,'#b7efde30');rect(c,x+8,170,8,550,'#d8fff11c');
      for(let n=0;n<16;n++){const y=190+(n*41+t*180)%500;line(c,x+10+n%4*12,y,x+6+n%4*12,y+36,'#dbfff149',2);}
      glow(c,x+30,620,100,'#c4ffec24');
    }
    if(theme==='rail')for(let i=0;i<8;i++){
      const x=i*240-(cam*.4)%240;
      line(c,x,230,x,640,'#252931',9);line(c,x-40,250,x+45,250,'#252931',7);
      line(c,x-40,250,x+200,280,'#262934',2);rect(c,x+50,440,150,110,'#32343b');
      for(let n=0;n<4;n++)rect(c,x+60+n*32,460,20,24,'#cba98035');
    }
  }else if(theme==='hive'){
    for(let i=0;i<11;i++){
      const x=i*170-(cam*.2)%170-50;
      c.strokeStyle='#261d2c';c.lineWidth=38;c.beginPath();c.moveTo(x,730);c.bezierCurveTo(x-100,380,x+150,270,x-30,-80);c.stroke();
      for(let j=0;j<5;j++){const y=100+j*115+Math.sin(i+j)*20;circle(c,x+Math.sin(j+i)*65,y,28,'#7f4c5b30');circle(c,x+Math.sin(j+i)*65,y,8+Math.sin(t+j)*2,accent+'48');}
      line(c,x,0,x+160,600,'#a65d6e12',3);
    }
    glow(c,880,340,250,'#e66e9740');
  }else{
    for(let i=0;i<10;i++){
      const x=i*220-(cam*.2)%220-100;
      rect(c,x,70,170,520,'#0b18278a');rect(c,x+8,80,154,6,accent+'30');
      for(let n=0;n<7;n++){rect(c,x+22,118+n*60,126,37,'#111e2b');rect(c,x+29,126+n*60,5,20,accent+'55');}
      line(c,x+185,0,x+185,650,accent+'18',8);
      if(theme==='foundry'){rect(c,x+40,260,75,280,'#f3894530');glow(c,x+80,520,100,'#ff963e24');}
      if(theme==='reactor'){
        c.strokeStyle=accent+'48';c.lineWidth=3;c.beginPath();c.ellipse(x+85,310,55,120,0,0,TAU);c.stroke();
        line(c,x+85,190,x+85,430,accent+'60',5);glow(c,x+85,310,110,accent+'18');
      }
    }
    rect(c,0,75,1280,14,'#091721');rect(c,0,570,1280,20,'#091721');
    for(let x=0;x<1280;x+=90)line(c,x,78,x+70,78,accent+'45',2);
  }
  const pit=theme==='foundry'?'#b5522d':theme==='hive'?'#4f253f':theme==='waterfall'?'#367986':'#0a1d2c';
  rect(c,0,590,1280,130,pit);
  for(let i=0;i<40;i++){const x=(i*79+t*23-cam*.6)%1400;line(c,x,612+i%5*22,x+42,612+i%5*22,accent+'22',2);}
}
export function drawAtmosphere(c,theme,cam,t){
  const accent=PALETTES[theme][2];c.save();
  for(let i=0;i<65;i++){
    const x=((i*173+t*(theme==='snow'?-36:12)-cam*.2)%1380+1380)%1380-50;
    const y=(i*83+t*(theme==='snow'?36:theme==='foundry'?-25:12)+10000)%760-20;
    if(theme==='snow')circle(c,x,y,1+i%3*.5,'#efffff88');
    else if(theme==='waterfall')line(c,x,y,x-3,y+12,'#c9ffff35');
    else circle(c,x,y,1+i%2,accent+'45');
  }
  const v=c.createRadialGradient(640,320,260,640,320,800);v.addColorStop(0,'transparent');v.addColorStop(1,'#030c1d99');rect(c,0,0,1280,720,v);c.restore();
}
export function drawTerrainDetails(c,game,cam,t){
  for(const p of game.platforms){
    const x=p.x-cam;if(x>1330||x+p.w< -50)continue;
    if(p.type==='ice'){
      rect(c,x,p.y,p.w,7,'#d6f5f4');rect(c,x,p.y+7,p.w,12,'#82bdc5');
      for(let n=0;n<p.w/65;n++)poly(c,[[x+n*65,p.y+19],[x+n*65+9,p.y+43],[x+n*65+17,p.y+19]],'#a5e0e077');
    }
    if(p.type==='hive'){
      rect(c,x,p.y,p.w,7,'#b68c9a');
      for(let n=0;n<p.w/90;n++){circle(c,x+n*90+30,p.y+22,14,'#88465a');circle(c,x+n*90+30,p.y+22,6,'#e59b8640');}
    }
    if(p.conveyor)for(let n=0;n<p.w/45;n++){
      const xx=x+((n*45+t*p.conveyor)%p.w+p.w)%p.w;
      if(xx<x+p.w-14)poly(c,p.conveyor>0?[[xx,p.y+10],[xx+12,p.y+17],[xx,p.y+24]]:[[xx+12,p.y+10],[xx,p.y+17],[xx+12,p.y+24]],'#f2b578');
    }
  }
  for(const h of game.environment){
    const x=h.x-cam;if(x>1300||x+h.w<0)continue;
    const color=h.type==='frost'?'#bcf5ff':h.type==='spore'?'#efa2b5':h.type==='laser'?'#f5bbff':'#ffb078';
    rect(c,x,586,h.w,7,'#142733');
    for(let n=0;n<5;n++)rect(c,x+5+n*12,583,7,4,h.active||h.warning?color:'#65777a');
    if(h.warning){line(c,x,590,x,535,color+'77',1);line(c,x+h.w,590,x+h.w,535,color+'77',1);}
    if(h.active&&h.type!=='shell'){
      glow(c,x+h.w/2,560,70,color+'44');
      for(let n=0;n<6;n++)line(c,x+6+n*10,586,x+6+n*10+Math.sin(t*19+n)*4,535,color,n%2?3:1);
    }
  }
}
export function drawChapterBoss(c,b,t,i18n){
  c.save();c.translate(b.x+b.w/2,b.y+b.h/2);
  const a=b.flash>0?'#fff4df':b.color,dark='#10232f',steel=b.flash>0?'#fff4df':'#536d79';
  const w=b.w,h=b.h,core=b.dead?'#9b9b8c':a;
  if(b.dead)c.rotate(Math.sin(t*30)*.025);
  if(b.kind==='gate'){
    rect(c,-w/2,-h/2,w,h,dark);rect(c,-w/2-15,-h/2,28,h,steel);rect(c,w/2-13,-h/2,28,h,steel);
    for(let i=0;i<7;i++){rect(c,-w/2+24,-h/2+14+i*38,w-48,26,'#304b58');line(c,-w/2+28,-h/2+16+i*38,w/2-28,-h/2+16+i*38,a+'66',2);}
    circle(c,0,-12,65,dark);for(let i=0;i<8;i++){const angle=i*TAU/8+t*.15;poly(c,[[Math.cos(angle)*30,Math.sin(angle)*30-12],[Math.cos(angle+.3)*62,Math.sin(angle+.3)*62-12],[Math.cos(angle+.7)*42,Math.sin(angle+.7)*42-12]],steel);}
  }else if(b.kind==='ray'){
    const flap=Math.sin(t*2)*14;
    for(const sign of [-1,1]){c.save();c.scale(sign,1);poly(c,[[0,-30],[65,-75+flap],[125,-20],[85,25],[35,35]],steel);poly(c,[[20,-20],[72,-49+flap],[107,-18],[65,0]],dark);line(c,38,10,105,-13,a,3);circle(c,69,12,14,dark);circle(c,69,12,7,a);c.restore();}
    poly(c,[[-35,-58],[0,-85],[35,-58],[28,65],[0,90],[-28,65]],dark);line(c,0,80,Math.sin(t*2)*30,120,steel,8);
  }else if(b.kind==='crawler'||b.kind==='train'){
    rect(c,-w/2,-h/2+34,w,h-49,steel);rect(c,-w/2-10,h/2-43,w+20,48,dark);
    for(let i=0;i<6;i++){const xx=-w/2+20+i*(w-40)/5;circle(c,xx,h/2-18,19,steel);line(c,xx-Math.cos(t*4)*13,h/2-18-Math.sin(t*4)*13,xx+Math.cos(t*4)*13,h/2-18+Math.sin(t*4)*13,a+'88',3);}
    if(b.kind==='train'){poly(c,[[-w/2-36,h/2],[-w/2+8,-20],[-w/2+40,h/2]],steel);rect(c,24,-h/2-32,75,82,dark);rect(c,36,-h/2-23,50,30,a+'55');rect(c,55,-h/2-60,22,30,steel);}
    else{rect(c,-65,-h/2,125,52,dark);rect(c,-100,-h/2+12,75,20,steel);}
    for(let n=0;n<5;n++)rect(c,-w/2+20+n*38,-5,22,27,dark);
  }else if(b.kind==='spire'){
    poly(c,[[-80,h/2],[80,h/2],[55,-80],[0,-h/2-15],[-55,-80]],steel);
    for(let n=0;n<5;n++){rect(c,-63+n*5,80-n*39,126-n*10,13,dark);line(c,-48+n*5,83-n*39,48-n*5,83-n*39,a,2);}
    for(const sign of [-1,1])poly(c,[[sign*42,-70],[sign*99,-115],[sign*76,16],[sign*46,40]],a+'80');
  }else if(b.kind==='prism'){
    for(let ring=0;ring<3;ring++){c.save();c.rotate(t*(ring%2?-.35:.25)+ring);c.strokeStyle=a+(ring===0?'cc':'66');c.lineWidth=4;c.strokeRect(-57-ring*13,-57-ring*13,114+ring*26,114+ring*26);c.restore();}
    poly(c,[[0,-88],[65,0],[0,95],[-65,0]],steel);poly(c,[[0,-66],[42,0],[0,69],[-42,0]],dark);
  }else if(b.kind==='queen'){
    for(const sign of [-1,1]){c.save();c.scale(sign,1);for(let i=0;i<4;i++){const yy=-90+i*54;c.strokeStyle=steel;c.lineWidth=13;c.beginPath();c.moveTo(30,yy);c.quadraticCurveTo(140+Math.sin(t+i)*12,yy-45,110,yy+60);c.stroke();circle(c,112,yy+56,6,a);}
      poly(c,[[25,-70],[75,-h/2],[105,-h/2-15],[65,-40]],a+'77');c.restore();}
    c.fillStyle='#573b52';c.beginPath();c.ellipse(0,0,70,135,0,0,TAU);c.fill();
    for(let i=0;i<6;i++){c.strokeStyle=steel;c.lineWidth=7;c.beginPath();c.ellipse(0,-83+i*34,59,20,0,0,Math.PI);c.stroke();}
    circle(c,-22,-87,9,a);circle(c,22,-87,9,a);
  }
  glow(c,0,0,85,core+'50');circle(c,0,0,29,dark);circle(c,0,0,19+Math.sin(t*4)*2,core);circle(c,-4,-5,7,'#fff5d8');
  c.textAlign='center';c.font='10px monospace';c.fillStyle=a;c.fillText(b.code,0,h/2+22);
  if(b.telegraph>.1&&b.active&&!b.dead){c.font='bold 12px monospace';c.fillStyle='#ffdbb4';c.fillText(i18n.t(`boss.${b.patterns[b.attack%b.patterns.length]}`),0,-h/2-36);}
  c.restore();
}
