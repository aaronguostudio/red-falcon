import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/src/game.js';
import {falconOrigin,falconBarrel} from '../dist/src/slice-spec.js';
const input=(held=[],pressed=[],aim=null)=>({held:new Set(held),pressed:new Set(pressed),aim});
const tick=(g,n=1,keys=input())=>{for(let i=0;i<n;i++)g.update(1/60,i===0?keys:{...keys,pressed:new Set()});};
function ready(sample=false){const g=new Game();sample?g.startSample():g.start();g.enemies=[];tick(g,40);return g;}

test('hold Down or S to crouch in place, turn and shoot; release preserves the feet',()=>{
 for(const key of ['ArrowDown','KeyS']){
  const g=ready(),p=g.player,feet=p.y+p.h,x=p.x;
  tick(g,12,input([key,'KeyA','KeyJ']));assert.equal(p.crouching,true);assert.equal(p.face,-1);assert.equal(p.x,x);assert.equal(p.h,36);assert.equal(p.y+p.h,feet);assert.ok(g.bullets.some(b=>b.player&&b.vx<0&&Math.abs(b.vy)<1));
  tick(g);assert.equal(p.crouching,false);assert.equal(p.h,58);assert.equal(p.y+p.h,feet);
 }
});
test('K jumps and double-jumps out of a crouch without spending a grenade; L throws',()=>{
 const g=ready(),p=g.player;tick(g,1,input(['ArrowDown']));const feet=p.y+p.h;
 tick(g,1,input(['ArrowDown'],['KeyK']));assert.equal(p.crouching,false);assert.equal(p.h,58);assert.equal(p.jumps,1);assert.ok(p.vy<0&&p.y+p.h<feet);assert.equal(p.grenades,4);assert.equal(g.grenades.length,0);
 tick(g,12);tick(g,1,input([],['KeyK']));assert.equal(p.jumps,2);assert.equal(p.grenades,4);
 tick(g,1,input([],['KeyL']));assert.equal(p.grenades,3);assert.equal(g.grenades.length,1);assert.equal(p.jumps,2);
});
test('crouching avoids an overhead projectile but does not make the player invulnerable',()=>{
 for(const crouch of [false,true]){
  const g=ready(),p=g.player;p.invuln=0;const keys=input(crouch?['ArrowDown']:[]);tick(g,1,keys);
  g.enemyShot(p.x-60,540,0,600,3);tick(g,14,keys);assert.equal(p.hp,crouch?100:88);
  if(crouch){g.enemyShot(p.x-60,575,0,600,3);tick(g,14,keys);assert.equal(p.hp,88);}
 }
});
test('Down in midair keeps the standing collider, landing crouches, and dash releases it',()=>{
 const g=ready(),p=g.player;tick(g,1,input([],['KeyK']));tick(g,6,input(['ArrowDown']));assert.equal(p.crouching,false);assert.equal(p.h,58);assert.ok(Math.abs(p.aim-Math.PI/2)<.001);
 for(let i=0;i<120&&!p.grounded;i++)tick(g,1,input(['ArrowDown']));assert.equal(p.crouching,true);assert.equal(p.y+p.h,590);
 tick(g,1,input(['ArrowDown'],['ShiftLeft']));assert.equal(p.crouching,false);assert.equal(p.h,58);assert.ok(p.dash>0);
});
test('sample crouch lowers rifle registration and retains directional aiming',()=>{
 const g=ready(true),p=g.player,standing=falconOrigin(p).y;tick(g,1,input(['ArrowDown']));assert.ok(falconOrigin(p).y>standing+15);
 for(const aim of [0,-Math.PI/4,-Math.PI/2,Math.PI]){
  p.aim=aim;p.face=Math.cos(aim)>=0?1:-1;g.bullets=[];g.firePlayer();const o=falconOrigin(p),b=g.bullets[0];assert.ok(Math.abs(b.y-o.y-Math.sin(aim)*falconBarrel(p))<.001);assert.ok(Math.abs(b.x-o.x-Math.cos(aim)*falconBarrel(p))<.001);
 }
});
