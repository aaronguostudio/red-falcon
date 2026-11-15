// Shared actors stay resident. Only the selected chapter's scenery is retained.
// Superseded chapter requests are cancelled and decoded bitmaps are released.
export const ART_THEMES=['jungle','base','waterfall','foundry','snow','rail','reactor','hive'];
export const ART_COLORS=['#b5d6bd','#97dce4','#b9e8de','#f9b97b','#d8f1fa','#e4bd9e','#d9c5ff','#eeafca'];
const url=path=>new URL(`../assets/${path}`,import.meta.url).href;
async function fetchAsset(path,signal,type='blob'){
  const controller=new AbortController(),cancel=()=>controller.abort(signal.reason);
  if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(()=>controller.abort(new Error(`Texture download timed out: ${path}`)),30000);
  try{
    const response=await fetch(url(path),{signal:controller.signal});
    if(!response.ok)throw new Error(`Texture request failed (${response.status}): ${path}`);
    return await response[type]();
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
async function bitmap(path,signal){
  const blob=await fetchAsset(path,signal),image=await createImageBitmap(blob);
  if(signal?.aborted){image.close();throw new DOMException('Chapter changed','AbortError');}
  return image;
}
export function closeImages(images){for(const image of Object.values(images||{}).flat())image?.close?.();}
export function imageBytes(images){return Object.values(images||{}).flat().reduce((sum,i)=>sum+(i?.width||0)*(i?.height||0)*4,0);}
export class CampaignArt {
  constructor(){this.shared=null;this.sharedPromise=null;this.sequence=0;this.controller=null;}
  loadShared(){
    if(!this.sharedPromise)this.sharedPromise=(async()=>{
      const images={},names=['falcon','combat','terrain','aim'];
      const results=await Promise.allSettled(names.map(async name=>images[name]=await bitmap(`slice/${name}.webp`)));
      const failed=results.find(r=>r.status==='rejected');
      if(failed){closeImages(images);throw failed.reason;}
      return this.shared=images;
    })().catch(error=>{this.sharedPromise=null;throw error;});
    return this.sharedPromise;
  }
  async load(index){
    const theme=ART_THEMES[index];if(!theme)throw new RangeError('Unknown chapter art');
    const sequence=++this.sequence;this.controller?.abort();
    const controller=this.controller=new AbortController(),signal=controller.signal,stage={};
    try{
      const work=[this.loadShared(),(async()=>{stage.backdrop=await bitmap(index?`campaign/${theme}-backdrop.webp`:'slice/backdrop.webp',signal);})()];
      if(index)work.push((async()=>{
        const bounds=await fetchAsset('campaign/atlas-bounds.json',signal,'json');
        const pack=index<5?'boss-a':'boss-b',first=index<5?(index-1)*2:(index-5)*2;
        stage.bossRegistration=bounds[pack].cells.slice(first,first+(index===7?4:2));
        const tile=bounds.terrain.cells[index-1],lip=tile.lipY-tile.y;
        const crop=async(path,cells)=>{
          const source=await bitmap(path,signal),out=[];
          try{for(const cell of cells){const image=await createImageBitmap(source,cell.x,cell.y,cell.w,cell.h);out.push(image);}if(signal.aborted)throw new DOMException('Chapter changed','AbortError');return out;}
          catch(error){closeImages({out});throw error;}finally{source.close();}
        };
        // Keep only the chapter's tile and two poses (four for the final Queen).
        const cropped=await Promise.allSettled([
          crop('campaign/terrain.webp',[{...tile,y:tile.lipY,h:tile.h-lip}]).then(images=>stage.tile=images[0]),
          crop(`campaign/${pack}.webp`,stage.bossRegistration).then(images=>stage.bosses=images)
        ]);
        const failed=cropped.find(r=>r.status==='rejected');if(failed)throw failed.reason;
      })());
      const results=await Promise.allSettled(work),failed=results.find(r=>r.status==='rejected');
      if(failed)throw failed.reason;
      if(sequence!==this.sequence)throw new DOMException('Chapter changed','AbortError');
      return{shared:this.shared,stage,index,theme};
    }catch(error){closeImages(stage);throw error;}
  }
}
