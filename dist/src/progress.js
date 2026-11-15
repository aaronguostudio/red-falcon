import {LEVELS} from './levels.js';

export const PROGRESS_KEY='red-falcon-campaign-v1';
export function createProgress(storage=null){
  let completed=[],best={},persistent=!!storage;
  try{
    const raw=storage?.getItem(PROGRESS_KEY),saved=JSON.parse(raw||'null');
    if(Array.isArray(saved?.completed))completed=[...new Set(saved.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<LEVELS.length))];
    if(saved?.best&&typeof saved.best==='object')for(const [key,value] of Object.entries(saved.best)){
      if(/^\d+-(normal|veteran)$/.test(key)&&Number.isFinite(value)&&value>=0)best[key]=value;
    }
    // The original game wrote these scores only after a first-chapter victory.
    if(!raw)for(const difficulty of ['normal','veteran']){
      const score=Number(storage?.getItem('red-falcon-best-'+difficulty));
      if(Number.isFinite(score)&&score>0){completed=[0];best[`0-${difficulty}`]=score;}
    }
  }catch{persistent=false;/* Progress remains available in memory when storage is blocked. */}
  function unlocked(){let n=0;while(n<LEVELS.length-1&&completed.includes(n))n++;return n;}
  return {
    get unlocked(){return unlocked();},
    get persistent(){return persistent;},
    get completed(){return [...completed];},
    isOpen(index){return Number.isInteger(index)&&index>=0&&index<=unlocked();},
    best(index,difficulty){return best[`${index}-${difficulty}`]||0;},
    complete(index,difficulty,score){
      if(!this.isOpen(index)||!['normal','veteran'].includes(difficulty)||!Number.isFinite(score)||score<0)return false;
      if(!completed.includes(index))completed.push(index);
      const key=`${index}-${difficulty}`;best[key]=Math.max(best[key]||0,score);
      try{storage?.setItem(PROGRESS_KEY,JSON.stringify({completed,best}));}catch{persistent=false;}
      return true;
    },
  };
}
