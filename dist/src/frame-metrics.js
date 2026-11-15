// Bounded buffers; sampling allocates only when diagnostics are requested.
export class FrameMetrics {
  constructor(){this.cpu=new Float32Array(600);this.intervals=new Float32Array(600);this.count=0;this.index=0;}
  add(cpu,interval){if(interval<=0||interval>250)return;this.cpu[this.index]=cpu;this.intervals[this.index]=interval;this.index=(this.index+1)%600;this.count=Math.min(this.count+1,600);}
  reset(){this.count=0;this.index=0;}
  snapshot(){const n=this.count;if(!n)return{samples:0};const cpu=Array.from(this.cpu.subarray(0,n)).sort((a,b)=>a-b),frames=Array.from(this.intervals.subarray(0,n)).sort((a,b)=>a-b);return{samples:n,cpuMedianMs:cpu[Math.floor(n*.5)],cpuP95Ms:cpu[Math.floor(n*.95)],frameMedianMs:frames[Math.floor(n*.5)],frameP95Ms:frames[Math.floor(n*.95)],framesOver25ms:frames.filter(v=>v>25).length};}
}
