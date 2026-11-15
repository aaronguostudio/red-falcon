// Shared registration keeps projectiles attached to the animated rifle barrel.
export const SLICE_ZOOM=1.2;
export const SLICE_END=3370;
export const FALCON_SCALE=78/265;
const RUN=[0,4,1,5,2,6,3,7];
export function falconPose(p){
  if(!p.grounded)return p.vy<40?9:10;
  if(p.crouching||p.land>.2)return 11;
  return Math.abs(p.vx)>28?RUN[Math.floor(p.step*1.2)%8]:8;
}
export function falconRegistration(p){
  const pose=falconPose(p),gunY=pose===9?110:pose===10?105:pose===11?211:145;
  return{pose,gunY,footY:pose<8?320:326};
}
export function falconOrigin(p){if(falconAimRig(p))return{x:p.x+p.w/2,y:p.y+p.h+(211-455)*AIM_SCALE+(p.crouching?22:0)};const r=falconRegistration(p);return{x:p.x+p.w/2,y:p.y+p.h+(r.gunY-r.footY)*FALCON_SCALE};}
export const AIM_SCALE=78/340;
const AIM_TIPS={1:[334,104],2:[240,28],3:[307,303],4:[220,417],5:[338,104],7:[313,303]};
export function falconAimRig(p){
  const raw=p.face===1?p.aim:Math.PI-p.aim,angle=Math.atan2(Math.sin(raw),Math.cos(raw));
  const index=angle< -1.12?2:angle< -.28?(p.grounded?1:5):angle>1.12?4:angle>.28?(p.grounded?3:7):null;
  if(index===null)return null;
  const [x,y]=AIM_TIPS[index],dx=x-200,dy=y-211;
  return{index,angle,baseAngle:Math.atan2(dy,dx),barrel:Math.hypot(dx,dy)*AIM_SCALE};
}
export function falconBarrel(p){return falconAimRig(p)?.barrel||45;}
