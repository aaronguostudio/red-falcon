const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

export function runBossAttack(game,pattern){
  const b=game.boss,p=game.player,phase=b.phase;
  const x=b.x+b.w*.35,y=b.y+b.h*.5;
  const aimed=Math.atan2(p.y+25-y,p.x+14-x);
  const shot=(a,speed=270,r=7)=>game.enemyShot(x,y,a,speed,r);
  const mortar=(tx,delay)=>game.hazards.push({type:'mortar',x:clamp(tx,b.arena+30,game.world-140),y:590,timer:delay,hit:false,life:delay+.8});
  switch(pattern){
    case 'volley':{
      const count=phase>1?9:5;
      for(let i=0;i<count;i++)shot(aimed+(i-(count-1)/2)*.14,phase>1?300:260);
      game.emit('bossFire');break;
    }
    case 'mortar':
      for(let i=0;i<(phase>1?5:3);i++)mortar(p.x-150+i*120,1.25+i*.12);
      game.emit('alarm');break;
    case 'wave':
      for(let i=0;i<(phase>1?2:1);i++)game.hazards.push({type:'wave',x:b.x-30+i*230,y:572,w:60,h:18,vx:-(phase>1?470:380),life:4});
      game.shake=5;game.emit('stomp');break;
    case 'beam':
      game.hazards.push({type:'beam',x:b.arena,y:clamp(p.y+12,320,560),w:b.x-b.arena,h:24,timer:1,life:1.65});
      game.emit('alarm');break;
    case 'crossfire':
      for(let i=0;i<5+phase;i++){
        game.enemyShot(x,490,Math.PI+(i-3)*.065,280,6);
        game.enemyShot(x,345,Math.PI+(i-3)*.09,250,6);
      }
      game.emit('bossFire');break;
    case 'spiral':
      for(let i=0;i<9+phase*2;i++)shot(Math.PI*.5+i*Math.PI/(8+phase*2)+Math.sin(b.attack)*.18,210+phase*25,6);
      game.emit('bossFire');break;
    case 'rain':
      for(let i=0;i<5+phase;i++)mortar(b.arena+70+i*130,1.1+(i%3)*.2);
      game.emit('alarm');break;
    case 'barrage':
      for(let i=0;i<7;i++)game.enemyShot(x+i*30,520-(i%3)*45,Math.PI,340+phase*20,6);
      game.emit('bossFire');break;
    case 'brood':
      for(let i=0;i<3;i++){
        if(game.enemies.filter(e=>!e.dead&&e.summoned).length>=4)break;
        const e=game.makeEnemy([b.arena+220+i*170,270+i%2*70,'drone'],game.enemies.length);
        e.summoned=true;game.enemies.push(e);
      }
      for(let i=0;i<7;i++)shot(aimed+(i-3)*.17,240);
      game.emit('alarm');break;
  }
}

export function updateHazards(game,dt){
  const p=game.player;
  for(const h of game.hazards){
    h.life-=dt;
    if(h.type==='mortar'){
      h.timer-=dt;
      if(h.timer<=0&&!h.hit){h.hit=true;game.explode(h.x,580,70);if(Math.abs(p.x+14-h.x)<65&&p.y+p.h>485)game.damagePlayer(23);}
    }else if(h.type==='beam'){
      h.timer-=dt;
      if(h.timer<=0&&overlaps(p,h))game.damagePlayer(27);
    }else{h.x+=h.vx*dt;if(overlaps(p,h))game.damagePlayer(22);}
  }
  game.hazards=game.hazards.filter(h=>h.life>0);
}
