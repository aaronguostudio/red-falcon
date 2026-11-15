export class AudioEngine {
  constructor(){this.enabled=true;this.ctx=null;this.beat=0;this.musicClock=0;this.mode='menu';}
  async init(){try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.35;this.master.connect(this.ctx.destination);const len=this.ctx.sampleRate;this.noise=this.ctx.createBuffer(1,len,this.ctx.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<len;i++)a[i]=Math.random()*2-1;}if(this.ctx.state==='suspended')await this.ctx.resume();}catch{this.enabled=false;}}
  toggle(){this.enabled=!this.enabled;if(this.master)this.master.gain.setTargetAtTime(this.enabled?.35:0,this.ctx.currentTime,.04);return this.enabled;}
  tone(freq,duration,type='sine',volume=.2,slide=0,delay=0){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
  hiss(duration=.1,volume=.15,freq=1500){if(!this.ctx||!this.enabled)return;const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain(),t=this.ctx.currentTime;s.buffer=this.noise;f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f);f.connect(g);g.connect(this.master);s.start();s.stop(t+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
  play(event){if(!this.enabled)return;switch(event.type){
    case'shoot':if(event.weapon===2){this.tone(1200,.22,'sawtooth',.12,120);this.hiss(.14,.12,4000);}else{this.tone(event.weapon===1?130:210,.07,'square',.055,55);this.hiss(.05,.07,2400);}break;
    case'jump':this.tone(event.double?440:200,.16,'sine',.13,event.double?850:420);break;
    case'dash':this.hiss(.2,.22,5000);this.tone(220,.16,'sawtooth',.05,70);break;
    case'hit':this.tone(190,.035,'triangle',.08,80);break;
    case'kill':case'break':this.hiss(.16,.2,1800);this.tone(75,.15,'triangle',.2,30);break;
    case'explosion':case'bossDeath':this.hiss(.6,.5,950);this.tone(70,.5,'sine',.5,20);break;
    case'hurt':this.hiss(.22,.3,750);this.tone(110,.2,'sawtooth',.16,35);break;
    case'pickup':case'checkpoint':[440,660,880].forEach((f,i)=>this.tone(f,.18,'sine',.16,0,i*.08));break;
    case'weapon':this.tone(640,.08,'triangle',.14);break;
    case'alarm':case'boss':this.tone(180,.5,'sawtooth',.13,230);break;
    case'bossFire':this.hiss(.25,.2,1900);this.tone(100,.25,'square',.1,40);break;
    case'stomp':this.tone(55,.4,'sine',.5,20);this.hiss(.25,.25,400);break;
    case'throw':this.hiss(.12,.1,3200);break;
    case'victory':[261.63,329.63,392,523.25,659.25].forEach((f,i)=>this.tone(f,.7,'triangle',.2,0,i*.16));break;
    case'death':this.tone(240,.7,'triangle',.18,35);break;
  }}
  update(dt,state,boss){if(!this.ctx||!this.enabled||state!=='playing')return;this.musicClock-=dt;if(this.musicClock>0)return;this.musicClock=boss?.19:.25;const notes=[55,55,82.4,55,65.4,55,73.4,82.4];this.tone(notes[this.beat%8],.2,'triangle',.075);if(this.beat%4===0){this.tone(90,.13,'sine',.12,30);this.hiss(.04,.03,900);}if(this.beat%2)this.hiss(.025,.02,6000);if(this.beat%16===0)[220,261.6,329.6].forEach(f=>this.tone(f,2.5,'sine',.018));this.beat++;}
}
