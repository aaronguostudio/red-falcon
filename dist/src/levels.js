const SECTORS = [
  {x:0,nameKey:'sector.jungle',objectiveKey:'objective.jungle'},
  {x:2300,nameKey:'sector.bridge',objectiveKey:'objective.bridge'},
  {x:4480,nameKey:'sector.outpost',objectiveKey:'objective.outpost'},
];
const PLATFORMS = [
  [0,590,1740,150,'earth'],[1980,590,720,150,'earth'],[2990,590,610,150,'bridge'],
  [3890,590,1190,150,'earth'],[5310,590,1730,150,'metal'],
  [520,470,230,24,'ruin'],[970,395,210,24,'ruin'],[1410,470,220,24,'ruin'],
  [1780,488,130,20,'bridge'],[2160,440,250,24,'ruin'],[2730,490,185,20,'bridge'],
  [3070,405,230,20,'bridge'],[3430,460,220,20,'bridge'],[3680,480,145,20,'bridge'],
  [4140,455,200,24,'ruin'],[4610,410,190,24,'metal'],[5110,470,125,20,'metal'],
  [5490,445,200,24,'metal'],[5970,450,160,22,'metal'],[6550,450,180,22,'metal']
].map(([x,y,w,h,type])=>({x,y,w,h,type}));
const ENEMIES = [
  [660,590,'soldier'],[1090,590,'soldier'],[1070,395,'turret'],[1460,590,'soldier'],[1640,325,'drone'],
  [2170,590,'soldier'],[2310,440,'turret'],[2520,590,'heavy'],[2860,290,'drone'],
  [3140,590,'soldier'],[3200,405,'turret'],[3470,590,'heavy'],[3700,310,'drone'],
  [4110,590,'soldier'],[4270,455,'turret'],[4510,590,'heavy'],[4750,280,'drone'],
  [4840,590,'soldier'],[5550,445,'turret'],[5660,590,'heavy'],[5820,310,'drone']
];
const PICKUPS = [[755,548,'scatter'],[1490,428,'health'],[2220,398,'health'],[3310,550,'rail'],[4200,413,'health'],[4780,368,'health'],[5480,548,'grenade']];
const CRATES = [[870,552],[1270,552],[2040,552],[3325,552],[4460,552],[5710,552]];

// Each chapter has an authored route. Coordinates are world units; platforms are one-way.
const platform=(x,y,w,h=24,type='metal',extra={})=>({x,y,w,h,type,...extra});
const ground=(x,w,type='metal',extra={})=>platform(x,590,w,150,type,extra);
const hazard=(x,type='vent',offset=0)=>({x,y:535,w:65,h:55,type,period:4.4,offset});
const stage=(id,theme,world,platforms,enemies,checkpoints,boss,hazards=[])=>({
  id,theme,world,platforms,enemies,checkpoints,boss,hazards,
  sectors:[0,checkpoints[0]-80,checkpoints[1]-80].map((x,i)=>({x,nameKey:`level.${id}.sector${i}`,objectiveKey:`level.${id}.goal${i}`})),
  pickups:[[620,548,'scatter'],[checkpoints[0]+160,548,'rail'],[checkpoints[1]+160,548,'health'],[boss.arena-160,548,'grenade']],
  crates:[850,checkpoints[0]+380,checkpoints[1]+350].map(x=>[x,552]),
});
export const LEVELS=[
  {id:'verdant',theme:'jungle',world:7040,platforms:PLATFORMS,enemies:ENEMIES,pickups:PICKUPS,crates:CRATES,sectors:SECTORS,checkpoints:[2380,4480,5900],hazards:[],boss:{kind:'guardian',x:6650,y:330,w:182,h:260,hp:3600,arena:5900,patterns:['volley','mortar','wave'],color:'#ffbe76'}},
  stage('relay','base',6200,[ground(0,1500),ground(1700,1550),ground(3450,2750),platform(710,440,230),platform(1250,380,180),platform(1515,485,150),platform(2190,450,260),platform(2730,390,210),platform(3260,480,160),platform(3740,430,240),platform(4400,460,220),platform(5210,440,180)],
    [[740,440,'turret'],[1120,590,'soldier'],[1380,590,'heavy'],[1940,590,'soldier'],[2320,450,'turret'],[2710,590,'heavy'],[3060,300,'drone'],[3650,590,'heavy'],[3880,430,'turret'],[4290,320,'drone'],[4650,590,'soldier'],[4890,590,'heavy']],
    [1900,3650,5060],{kind:'gate',x:5800,y:310,w:185,h:280,hp:3400,arena:5060,patterns:['beam','volley','crossfire'],color:'#8de6ed'},[hazard(1020,'laser'),hazard(2500,'laser',1.4),hazard(4100,'laser',2)]),
  stage('cataract','waterfall',6500,[ground(0,1050,'earth'),ground(1290,700,'earth'),ground(2250,780,'earth'),ground(3300,850,'earth'),ground(4400,2100,'earth'),platform(1060,470,180,20,'bridge'),platform(1530,405,250,24,'ruin'),platform(1990,460,190,20,'bridge'),platform(2500,370,230,24,'ruin'),platform(3050,455,200,20,'bridge'),platform(3510,405,260,24,'ruin'),platform(4170,465,180,20,'bridge'),platform(4630,440,230,24,'ruin'),platform(5550,450,160)],
    [[720,590,'soldier'],[1450,300,'drone'],[1630,405,'turret'],[1880,590,'soldier'],[2370,590,'heavy'],[2610,370,'turret'],[2900,280,'drone'],[3440,590,'soldier'],[3650,405,'turret'],[3970,300,'drone'],[4520,590,'heavy'],[4770,440,'turret'],[5060,300,'drone']],
    [1410,3440,5380],{kind:'ray',x:6090,y:300,w:210,h:200,hp:3600,arena:5380,patterns:['spiral','rain','volley'],color:'#8debd8'}),
  stage('foundry','foundry',6640,[ground(0,1800,'metal',{conveyor:65}),ground(2010,1430,'metal',{conveyor:-60}),ground(3660,2980,'metal'),platform(620,450,230),platform(1270,400,240),platform(1820,485,155),platform(2450,450,260),platform(3060,390,220),platform(3450,480,175),platform(3930,440,260),platform(4650,420,220),platform(5550,445,180)],
    [[760,450,'turret'],[1120,590,'heavy'],[1550,590,'soldier'],[2290,590,'heavy'],[2560,450,'turret'],[2980,310,'drone'],[3220,590,'heavy'],[3830,590,'soldier'],[4050,440,'turret'],[4540,590,'heavy'],[4890,280,'drone'],[5120,590,'heavy']],
    [2180,3820,5490],{kind:'crawler',x:6180,y:400,w:260,h:190,hp:4100,arena:5490,patterns:['wave','mortar','barrage'],color:'#ffae60'},[hazard(980),hazard(2770,'vent',1),hazard(4350,'vent',2.3),hazard(4960,'vent',.6)]),
  stage('whiteout','snow',6760,[ground(0,1400,'ice'),ground(1610,1540,'ice'),ground(3370,1370,'ice'),ground(4950,1810,'ice'),platform(790,440,240,24,'ice'),platform(1415,480,160,20,'ice'),platform(2080,405,240,24,'ice'),platform(2760,460,230,24,'ice'),platform(3160,480,170,20,'ice'),platform(3630,430,250,24,'ice'),platform(4210,385,220,24,'ice'),platform(4740,485,175,20,'ice'),platform(5650,450,180,24,'ice')],
    [[820,440,'turret'],[1210,590,'soldier'],[1870,590,'heavy'],[2200,405,'turret'],[2570,310,'drone'],[2900,460,'turret'],[3540,590,'heavy'],[3770,430,'turret'],[4100,300,'drone'],[4510,590,'heavy'],[5140,590,'soldier'],[5380,280,'drone']],
    [1760,3520,5570],{kind:'spire',x:6340,y:300,w:170,h:290,hp:4100,arena:5570,patterns:['crossfire','rain','wave'],color:'#a2e9ff'},[hazard(2420,'frost'),hazard(3950,'frost',1.6),hazard(5240,'frost',2.8)]),
  stage('railgrave','rail',7040,[ground(0,1200),ground(1430,1480),ground(3150,1640),ground(5000,2040),platform(620,460,280),platform(1220,485,160,20,'bridge'),platform(1900,420,260),platform(2560,450,220),platform(2920,480,180,20,'bridge'),platform(3430,450,240),platform(4100,400,260),platform(4800,480,160,20,'bridge'),platform(5340,430,220),platform(5900,445,160)],
    [[700,460,'turret'],[1040,590,'heavy'],[1640,590,'soldier'],[2000,420,'turret'],[2430,300,'drone'],[2740,590,'heavy'],[3320,590,'heavy'],[3550,450,'turret'],[3890,310,'drone'],[4230,400,'turret'],[4590,590,'soldier'],[5210,590,'heavy'],[5500,300,'drone']],
    [1580,3300,5840],{kind:'train',x:6570,y:400,w:280,h:190,hp:4300,arena:5840,patterns:['barrage','wave','mortar','crossfire'],color:'#ffc77d'},[hazard(2250,'shell',1),hazard(3780,'shell',2),hazard(4480,'shell',.5)]),
  stage('ion','reactor',6880,[ground(0,1630),ground(1850,1450),ground(3520,1420),ground(5160,1720),platform(700,410,240),platform(1270,470,220),platform(1650,485,155),platform(2230,430,260),platform(2880,390,220),platform(3320,485,160),platform(3810,440,260),platform(4490,380,230),platform(4960,485,160),platform(5580,445,200)],
    [[820,410,'turret'],[1190,590,'heavy'],[1500,300,'drone'],[2070,590,'heavy'],[2360,430,'turret'],[2730,300,'drone'],[3080,590,'heavy'],[3700,590,'soldier'],[3930,440,'turret'],[4360,300,'drone'],[4660,590,'heavy'],[5370,590,'heavy']],
    [2010,3690,5670],{kind:'prism',x:6430,y:300,w:200,h:230,hp:4500,arena:5670,patterns:['spiral','beam','rain','crossfire'],color:'#d8b8ff'},[hazard(1060,'laser'),hazard(2620,'laser',1.5),hazard(4220,'laser',2.7),hazard(5420,'laser',.8)]),
  stage('hollow','hive',7340,[ground(0,1420,'hive'),ground(1640,1610,'hive'),ground(3480,1620,'hive'),ground(5320,2020,'hive'),platform(710,430,230,24,'hive'),platform(1440,485,160,20,'hive'),platform(2090,400,240,24,'hive'),platform(2770,450,250,24,'hive'),platform(3270,485,165,20,'hive'),platform(3780,430,260,24,'hive'),platform(4460,390,240,24,'hive'),platform(5120,485,160,20,'hive'),platform(5650,440,220,24,'hive'),platform(6150,450,180,22,'hive')],
    [[810,430,'turret'],[1220,590,'heavy'],[1870,590,'heavy'],[2210,400,'turret'],[2570,280,'drone'],[2940,590,'heavy'],[3650,590,'heavy'],[3900,430,'turret'],[4300,300,'drone'],[4720,590,'heavy'],[5520,590,'heavy'],[5790,280,'drone']],
    [1790,3650,6060],{kind:'queen',x:6860,y:280,w:255,h:310,hp:5400,arena:6060,patterns:['spiral','rain','wave','brood'],color:'#f29cbb'},[hazard(1060,'spore'),hazard(2490,'spore',1.6),hazard(4220,'spore',2.4),hazard(5470,'spore',.5)]),
];

// Copy lives beside the chapter it describes; i18n merges these paired messages.
const COPY=[
  ['Verdant Outpost','翠雨前哨','Follow the lost signal through the jungle.','沿着失联信号，穿过雨林。','Iron Guardian','钢铁守卫','The outpost is online. The signal leads to a fortified relay.','前哨恢复通讯。信号指向一座戒备森严的中继堡垒。','AEGIS–07',null],
  ['Relay Bastion','通讯堡垒','Watch the laser vents. Dash through the sealed relay.','留意激光喷口，冲过封锁的中继站。','Bulwark Iris','壁垒之眼','Relay coordinates recovered. The mountain spillway is your only way in.','已取得中继坐标。山间泄洪道是唯一的入口。','IRIS–12',[
    ['Outer Perimeter','外围防线','Cross the laser perimeter.','穿过激光防线。'],['Relay Hall','中继大厅','Watch the floor lights before they ignite.','观察地面亮灯，避开喷射。'],['Sealed Gate','封锁闸门','Breach the gate. Evade the charged beam.','突破闸门，躲避蓄能光束。']]],
  ['Cataract Run','瀑布峡谷','Link double jumps across the suspended spillway.','连续二段跳，穿越悬空的泄洪道。','Tempest Ray','风暴鳐','Beyond the falls, the foundry is building an army. Shut it down.','瀑布之后，熔炉正在制造大军。切断它的生产线。','TEMPEST–03',[
    ['River Approach','河谷入口','Find your footing above the rapids.','在急流上方寻找落脚点。'],['Hanging Spillway','悬空栈道','Double jump between the high ledges.','用二段跳跨越高处平台。'],['Storm Basin','风暴水潭','Bring down the airborne sentinel.','击落空中的守卫。']]],
  ['Cinder Foundry','熔炉工厂','Conveyor belts carry you toward timed furnace vents.','传送带将你带向定时喷发的炉口。','Forge Crawler','熔炉履带兽','The production line is cold. Pursue the convoy into the whiteout.','生产线已经熄火。追踪车队，进入暴雪之中。','FORGE–09',[
    ['Intake Line','进料生产线','Move with the belts. Jump over flame vents.','顺着传送带前进，跳过火焰喷口。'],['Smelting Floor','冶炼车间','Time your dash between furnace cycles.','看准炉口周期，抓住时机冲刺。'],['Assembly Pit','装配深坑','Break the crawler before the next shipment.','在下一批出货前摧毁履带兽。']]],
  ['Whiteout Frontier','冰封边境','Ice keeps your momentum. Leave room to brake.','冰面保留惯性，提前留出刹车距离。','Frost Spire','霜冻尖塔','The frozen relay points to a ghost train carrying the power core.','冰封中继指向一辆运送能源核心的幽灵列车。','BOREAL–05',[
    ['Frozen Approach','冰原入口','Control your slide across the ice.','控制冰面滑行的距离。'],['Glacial Divide','冰川裂谷','Cross the cracks. Avoid freezing vents.','跨越裂缝，避开冰雾喷口。'],['Polar Array','极地阵列','Silence the frost transmitter.','关闭霜冻发射器。']]],
  ['Railgrave Express','废弃铁路','Cross broken freight decks under marked artillery fire.','在标记炮火之下，穿过断裂的货运平台。','Siege Engine','攻城机车','The convoy is stopped. Its core reveals the underground reactor.','车队已经停下。核心揭示了地下反应堆的位置。','LOCOMOTIVE–06',[
    ['Freight Yard','货运车场','Push through the abandoned freight yard.','突破废弃货运车场。'],['Artillery Crossing','炮火走廊','Keep moving when the impact markers appear.','炮击标记出现时，立刻移动。'],['Last Carriage','末节车厢','Stop the armored siege engine.','截停装甲攻城机车。']]],
  ['Ion Heart','离子核心','Read the energy cycles. The reactor is still alive.','观察能量循环。反应堆依然在运转。','Prism Warden','棱镜监守者','The reactor is dark, but the signal persists. Something below is calling.','反应堆已经熄灭，信号却仍在持续。地下深处有什么在呼唤。','PRISM–00',[
    ['Power Conduit','输能管道','Thread through the charged floor vents.','穿过蓄能的地面喷口。'],['Containment Ring','遏制环','Cross the gaps between reactor cells.','跨越反应单元之间的断层。'],['Core Chamber','核心舱室','Shatter the prism. Cut the power.','击碎棱镜，切断能源。']]],
  ['The Hollow Signal','最终巢穴','Follow the pulse to its source. End the broken signal.','追随脉冲抵达源头，终结断线行动。','Signal Sovereign','信号之主','The source is silent. All eight sectors are free. Come home, Falcon.','源头终于沉寂。八大战区已解放。回家吧，隼。','SOURCE–01',[
    ['Living Threshold','活体入口','Avoid the spore vents. Enter the nest.','避开孢子喷口，进入巢穴。'],['Pulse Artery','脉冲动脉','Follow the signal through the living walls.','沿着活体墙壁，追踪信号。'],['Origin Chamber','源头之室','Defeat all three phases of the Sovereign.','击破信号之主的三个阶段。']]],
];
export const LEVEL_MESSAGES={};
LEVELS.forEach((level,i)=>{
  const [en,zh,briefEn,briefZh,bossEn,bossZh,endEn,endZh,code,sectors]=COPY[i];
  level.nameKey=`level.${level.id}.name`;level.briefKey=`level.${level.id}.brief`;level.endingKey=`level.${level.id}.ending`;
  level.boss.nameKey=`level.${level.id}.boss`;level.boss.code=code;
  LEVEL_MESSAGES[level.nameKey]=[en,zh];LEVEL_MESSAGES[level.briefKey]=[briefEn,briefZh];LEVEL_MESSAGES[level.endingKey]=[endEn,endZh];LEVEL_MESSAGES[level.boss.nameKey]=[bossEn,bossZh];
  sectors?.forEach(([se,sz,ge,gz],n)=>{LEVEL_MESSAGES[level.sectors[n].nameKey]=[se,sz];LEVEL_MESSAGES[level.sectors[n].objectiveKey]=[ge,gz];});
});
