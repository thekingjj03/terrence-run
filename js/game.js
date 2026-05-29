(() => {
'use strict';
const $ = id => document.getElementById(id);
const screens = ['menuScreen','playSetup','collectionScreen','shopScreen','tutorialScreen','gameScreen','resultsScreen'];
const STORAGE_KEY = 'terranceMerchDashV2'; // Keeps V2 progress compatible.
const CARDS = [
  {id:'normal',name:'Normal Terrance',style:'Basic',rarity:'Common',weight:34,ability:'Balanced Start: begin every run with 25 bonus score.',effect:'normal'},
  {id:'happy',name:'Happy Terrance',style:'Pixel',rarity:'Common',weight:30,ability:'Good Mood Bonus: earn 25% more coins at the end of a run.',effect:'happy'},
  {id:'sad',name:'Sad Terrance',style:'Watercolor',rarity:'Common',weight:28,ability:'Second Chance: survive one unshielded crash per run.',effect:'sad'},
  {id:'tired',name:'Tired Terrance',style:'Realistic',rarity:'Common',weight:25,ability:'Slow Day: hazards move 16% slower.',effect:'tired'},
  {id:'confused',name:'Confused Terrance',style:'Graffiti',rarity:'Uncommon',weight:18,ability:'Mystery Mood: receive a random card ability each run.',effect:'confused'},
  {id:'nervous',name:'Nervous Terrance',style:'Anime',rarity:'Uncommon',weight:17,ability:'Heads Up: dangerous hazards give a warning before entering.',effect:'nervous'},
  {id:'chill',name:'Chill Terrance',style:'Animated',rarity:'Rare',weight:10,ability:'Vacation Shield: Mini Terrance shields last much longer.',effect:'chill'},
  {id:'mad',name:'Mad Terrance',style:'Comic Book',rarity:'Rare',weight:9,ability:'Rage Burst: your burst destroys nearby hazards.',effect:'mad'},
  {id:'excited',name:'Excited Terrance',style:'Neon 3D',rarity:'Epic',weight:5,ability:'Hype Mode: move faster and score 25% more points.',effect:'excited'},
  {id:'lovesick',name:'Lovesick Terrance',style:'Clay',rarity:'Legendary',weight:2,ability:'Coin Attraction: coins are pulled toward Terrance.',effect:'lovesick'}
];
const SKINS = [
  {id:'classic',name:'Classic Terrance',desc:'Original Terrance art',price:0,src:'assets/terrance-player.png',classic:true},
  {id:'pixel',name:'Pixel Happy',desc:'Pixel-world card skin',price:160,src:'assets/skins/happy.webp'},
  {id:'neon',name:'Neon Excited',desc:'Party-light card skin',price:280,src:'assets/skins/excited.webp'},
  {id:'comic',name:'Comic Mad',desc:'Comic-impact card skin',price:400,src:'assets/skins/mad.webp'},
  {id:'master',name:'Prototype Master',desc:'Complete the 10-card set',price:null,src:'assets/skins/normal.webp',reward:true}
];
const ACCESSORIES = [
  {id:'shades',name:'Sunglasses',icon:'🕶️',price:80,desc:'Chill mode shades'},
  {id:'director',name:'Director Cap',icon:'🎬',price:115,desc:'Kings Cuts style'},
  {id:'crown',name:'Mini Crown',icon:'👑',price:180,desc:'Merch royalty'},
  {id:'chain',name:'Gold Chain',icon:'📿',price:140,desc:'Drop-day drip'}
];
const LEVELS = {
  table:{name:'PROTOTYPE TABLE'},
  studio:{name:'KINGS CUTS STUDIO'},
  hallway:{name:'SCHOOL POP-UP SHOP'}
};
const defaults = {coins:120,best:0,packs:0,cards:['normal'],skins:['classic'],equipped:'classic',equippedCard:'normal',accessories:[],equippedAccessories:[],freePack:true,completeReward:false,bossWins:0};
let save = loadSave();
let selectedLevel = 'table';
let chosenCard = null;
let toastTimer = null;
let pendingRewardModal = false;
const images = {};
function getImage(src){ if(!images[src]){images[src] = new Image(); images[src].src = src;} return images[src]; }
function loadSave(){
  try {
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const merged = {...defaults,...old};
    merged.cards = Array.from(new Set(merged.cards || ['normal']));
    merged.skins = Array.from(new Set(merged.skins || ['classic']));
    merged.accessories = Array.from(new Set(merged.accessories || []));
    merged.equippedAccessories = (merged.equippedAccessories || []).filter(a => merged.accessories.includes(a)).slice(0,2);
    if(!merged.cards.includes(merged.equippedCard)) merged.equippedCard = 'normal';
    if(!merged.skins.includes(merged.equipped)) merged.equipped = 'classic';
    return merged;
  } catch(e){ return {...defaults}; }
}
function store(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(save)); renderHeader(); }
function card(id){ return CARDS.find(c => c.id === id) || CARDS[0]; }
function skin(id){ return SKINS.find(s => s.id === id) || SKINS[0]; }
function accessory(id){ return ACCESSORIES.find(a => a.id === id); }
function hasCard(id){ return save.cards.includes(id); }
function cardSrc(id){ return `assets/cards/${id}.webp`; }
function rarityClass(r){ return r.toLowerCase(); }
function toast(text){ const el=$('toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2450); }
function showScreen(id){
  screens.forEach(s => $(s).classList.toggle('hidden',s !== id));
  if(id === 'gameScreen') requestAnimationFrame(() => game.resize(true));
}
function renderHeader(){
  $('coinCount').textContent = save.coins;
  $('topCards').textContent = `${save.cards.length}/10`;
  $('collectionCount').textContent = `${save.cards.length}/10`;
  $('bestRun').textContent = save.best;
  $('packsOpened').textContent = save.packs;
  $('equippedPower').textContent = card(save.equippedCard).name.replace(' Terrance','');
}
function checkCompletion(){
  if(save.cards.length === CARDS.length && !save.completeReward){
    save.completeReward = true;
    save.coins += 500;
    if(!save.skins.includes('master')) save.skins.push('master');
    pendingRewardModal = true;
    store();
  }
}
function maybeShowReward(){ if(pendingRewardModal){ pendingRewardModal=false; $('rewardModal').classList.remove('hidden'); } }
function renderAll(){ renderHeader();renderCollection();renderShop();renderSetup();checkCompletion(); }
function renderSetup(){
  const c = card(save.equippedCard);
  $('setupAbility').innerHTML = `<img src="${cardSrc(c.id)}" alt="${c.name}"><div><small>EQUIPPED CARD POWER</small><strong>${c.name}</strong><p>${c.ability}</p></div>`;
  document.querySelectorAll('.level-card').forEach(el => el.classList.toggle('selected',el.dataset.level===selectedLevel));
}
function renderCollection(){
  $('openPackBtn').innerHTML = save.freePack ? 'OPEN FREE STARTER PACK' : 'OPEN PACK · 100 <span class="coin tiny">T</span>';
  $('binderBar').style.width = `${save.cards.length*10}%`;
  $('binderText').textContent = `${save.cards.length} / 10 FOUND${save.cards.length===10?' · SERIES COMPLETE':''}`;
  $('cardGrid').innerHTML = CARDS.map(c => {
    const owned = hasCard(c.id); const equipped = save.equippedCard === c.id;
    return `<article class="collection-card ${owned?'':'locked'} ${equipped?'equipped':''}" data-view-card="${c.id}"><img src="${cardSrc(c.id)}" alt="${owned?c.name:'Locked card'}"><h3>${owned?c.name:'UNDISCOVERED'}</h3><p class="${owned?rarityClass(c.rarity):''}">${owned?(equipped?'EQUIPPED · '+c.rarity:c.rarity):'???'}</p></article>`;
  }).join('');
  document.querySelectorAll('[data-view-card]').forEach(el => el.onclick=()=>{ if(hasCard(el.dataset.viewCard)) openCard(el.dataset.viewCard); else toast('Discover this card in a run or card pack first.'); });
}
function openCard(id){
  chosenCard = card(id); $('cardLarge').src = cardSrc(id); $('cardName').textContent = chosenCard.name; $('cardRarity').textContent = `${chosenCard.style} · ${chosenCard.rarity}`; $('cardRarity').className=`rarity ${rarityClass(chosenCard.rarity)}`; $('cardAbility').textContent=chosenCard.ability;
  $('equipCardBtn').textContent = save.equippedCard===id ? 'CURRENTLY EQUIPPED' : 'EQUIP ABILITY';
  $('equipCardBtn').disabled = save.equippedCard===id;
  $('cardModal').classList.remove('hidden');
}
function renderShop(){
  $('skinGrid').innerHTML = SKINS.map(s => {
    const owned=save.skins.includes(s.id), equipped=save.equipped===s.id;
    let action=equipped?'EQUIPPED':owned?'EQUIP':s.reward?'COMPLETE SET TO UNLOCK':`${s.price} COINS`;
    return `<article class="skin-item ${equipped?'equipped':''} ${s.reward&&!owned?'locked-reward':''}"><img src="${s.src}" alt="${s.name}"><h3>${s.name}</h3><p>${s.desc}</p><button class="shop-action ${!owned&&!s.reward?'buy':''}" data-skin="${s.id}" ${equipped||s.reward&&!owned?'disabled':''}>${action}</button></article>`;
  }).join('');
  document.querySelectorAll('[data-skin]').forEach(btn=>btn.onclick=()=>chooseSkin(btn.dataset.skin));
  $('accessoryGrid').innerHTML = ACCESSORIES.map(a => {
    const owned=save.accessories.includes(a.id), equipped=save.equippedAccessories.includes(a.id);
    const action=equipped?'REMOVE':owned?'EQUIP':`${a.price} COINS`;
    return `<article class="accessory ${equipped?'equipped':''}"><div class="accessory-icon">${a.icon}</div><div><h3>${a.name}</h3><p>${a.desc}</p><button data-accessory="${a.id}">${action}</button></div></article>`;
  }).join('');
  document.querySelectorAll('[data-accessory]').forEach(btn=>btn.onclick=()=>chooseAccessory(btn.dataset.accessory));
}
function chooseSkin(id){
  const s=skin(id); if(s.reward && !save.skins.includes(id)) return;
  if(save.skins.includes(id)){save.equipped=id;store();renderShop();toast(`${s.name} equipped!`);return;}
  if(save.coins<s.price){toast(`You need ${s.price-save.coins} more coins.`);return;}
  save.coins-=s.price;save.skins.push(id);save.equipped=id;store();renderShop();toast(`${s.name} unlocked and equipped!`);
}
function chooseAccessory(id){
  const a=accessory(id);const owned=save.accessories.includes(id);const equipped=save.equippedAccessories.includes(id);
  if(equipped){save.equippedAccessories=save.equippedAccessories.filter(x=>x!==id);store();renderShop();toast(`${a.name} removed.`);return;}
  if(!owned){if(save.coins<a.price){toast(`You need ${a.price-save.coins} more coins.`);return;} save.coins-=a.price;save.accessories.push(id);}
  if(save.equippedAccessories.length>=2){toast('Only two accessories can be equipped at once.');store();renderShop();return;}
  save.equippedAccessories.push(id);store();renderShop();toast(`${a.name} equipped!`);
}
function weightedCard(){
  const total=CARDS.reduce((sum,c)=>sum+c.weight,0);let n=Math.random()*total;
  for(const c of CARDS){n-=c.weight;if(n<=0)return c;}return CARDS[0];
}
function awardCard(c){
  if(!hasCard(c.id)){save.cards.push(c.id);checkCompletion();return {fresh:true,bonus:0,text:`NEW CARD: ${c.name}`};}
  const bonus={Common:15,Uncommon:24,Rare:35,Epic:55,Legendary:90}[c.rarity];save.coins+=bonus;return {fresh:false,bonus,text:`DUPLICATE +${bonus} COINS`};
}
function openPack(){
  const price=save.freePack?0:100;
  if(save.coins<price){toast(`You need ${price-save.coins} more coins for a pack.`);return;}
  save.coins-=price;save.freePack=false;save.packs++;
  const draws=[weightedCard(),weightedCard(),weightedCard()]; const outcomes=draws.map(c=>({c,result:awardCard(c)}));
  store();renderAll();
  $('packReveal').innerHTML = outcomes.map(o=>`<img src="${cardSrc(o.c.id)}" alt="${o.c.name}">`).join('');
  $('packSummary').innerHTML = outcomes.map(o=>o.result.fresh?`<b>${o.c.name}</b> · NEW`:`${o.c.name} · +${o.result.bonus} coins`).join('<br>');
  $('packModal').classList.remove('hidden');
}

$('playMenuBtn').onclick=()=>{renderSetup();showScreen('playSetup');};
$('collectionBtn').onclick=()=>{renderCollection();showScreen('collectionScreen');maybeShowReward();};
$('shopBtn').onclick=()=>{renderShop();showScreen('shopScreen');maybeShowReward();};
$('tutorialBtn').onclick=()=>showScreen('tutorialScreen');
document.querySelectorAll('[data-back="menu"]').forEach(b=>b.onclick=()=>{renderAll();showScreen('menuScreen');maybeShowReward();});
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{selectedLevel=b.dataset.level;renderSetup();});
$('startRunBtn').onclick=()=>game.start(selectedLevel);
$('openPackBtn').onclick=openPack;
$('closePackBtn').onclick=()=>{$('packModal').classList.add('hidden');renderCollection();maybeShowReward();};
$('closeCardBtn').onclick=()=> $('cardModal').classList.add('hidden');
$('equipCardBtn').onclick=()=>{if(!chosenCard)return;save.equippedCard=chosenCard.id;store();renderCollection();renderSetup();$('cardModal').classList.add('hidden');toast(`${chosenCard.name} ability equipped!`);};
$('closeRewardBtn').onclick=()=>{$('rewardModal').classList.add('hidden');renderAll();};
$('resetBtn').onclick=()=>{if(confirm('Reset all Terrance Merch Dash progress?')){localStorage.removeItem(STORAGE_KEY);save=loadSave();renderAll();toast('Save reset.');}};
$('againBtn').onclick=()=>{renderSetup();showScreen('playSetup');};
$('resultsMenuBtn').onclick=()=>{renderAll();showScreen('menuScreen');maybeShowReward();};

const canvas=$('gameCanvas'); const ctx=canvas.getContext('2d');
const game={
  running:false,W:0,H:0,dpr:1,t:0,last:0,level:'table',score:0,runReward:null,keys:{},pointer:false,spawn:0,effects:[],texts:[],objects:[],player:null,boss:null,ability:null,resolvedAbility:null,finishTimer:0,
  resize(){
    const r=canvas.getBoundingClientRect(); if(!r.width||!r.height)return;
    this.W=r.width;this.H=r.height;this.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(this.W*this.dpr);canvas.height=Math.round(this.H*this.dpr);ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  },
  start(level){
    this.level=level;this.running=true;this.t=0;this.score=0;this.spawn=.35;this.effects=[];this.texts=[];this.objects=[];this.runReward=null;this.finishTimer=0;
    this.ability=card(save.equippedCard);this.resolvedAbility=this.ability.effect==='confused'?CARDS.filter(c=>c.effect!=='confused')[Math.floor(Math.random()*9)]:this.ability;
    this.player={x:100,y:250,r:43,vx:0,vy:0,burst:0,shield:0,inv:0,revive:this.resolvedAbility.effect==='sad'};
    this.boss={active:false,hp:5,max:5,shoot:0,sponge:0,y:270,defeated:false};
    showScreen('gameScreen');this.resize();this.player.x=this.W*.16;this.player.y=this.H*.56;
    $('liveLevelName').textContent=LEVELS[level].name;$('liveAbility').textContent=this.ability.effect==='confused'?`Mystery: ${this.resolvedAbility.name}`:this.ability.name;$('liveScore').textContent='0';$('shieldMeter').classList.add('hidden');$('bossHud').classList.add('hidden');$('reviveFlag').classList.toggle('hidden',!this.player.revive);
    if(this.resolvedAbility.effect==='normal')this.points(25,this.player.x,this.player.y-45,'BALANCED START');
    this.last=performance.now();requestAnimationFrame(this.loop.bind(this));
  },
  burst(){
    if(!this.running||this.player.burst>0)return;this.player.burst=.34;this.player.vx+=390;this.poof(this.player.x-32,this.player.y,10,'#ffdb67');
    if(this.resolvedAbility.effect==='mad'){
      this.objects.forEach(o=>{if(this.isHazard(o.type)&&Math.hypot(o.x-this.player.x,o.y-this.player.y)<155){o.dead=true;this.points(12,o.x,o.y,'SMASH!');this.poof(o.x,o.y,14,'#f14c38');}});
    }
  },
  isHazard(type){return ['glue','scissors','coffee','cable','spill','backpack','glueorb'].includes(type);},
  points(value,x,y,label){
    const v=this.resolvedAbility.effect==='excited'?Math.ceil(value*1.25):value;this.score+=v;$('liveScore').textContent=this.score;this.text(x,y-18,`+${v}`,'#ffd557');if(label)this.text(x,y+8,label,'#fff');
  },
  text(x,y,text,color){this.texts.push({x,y,text,color,life:1});},
  poof(x,y,n,color){for(let i=0;i<n;i++)this.effects.push({x,y,vx:(Math.random()-.5)*230,vy:(Math.random()-.65)*240,r:3+Math.random()*6,life:.35+Math.random()*.42,color});},
  spawnOne(){
    const r=Math.random();let type;
    if(r<.34)type='coin';else if(r<.49)type='plush';else if(r<.63)type='card';else if(r<.75)type=this.level==='studio'?'camera':this.level==='hallway'?'flyer':'clapper';else if(this.level==='studio')type=Math.random()<.5?'coffee':'cable';else if(this.level==='hallway')type=Math.random()<.5?'spill':'backpack';else type=Math.random()<.5?'glue':'scissors';
    const hazard=this.isHazard(type);const slow=this.resolvedAbility.effect==='tired'?.84:1;const obj={type,x:this.W+78,y:92+Math.random()*(this.H-158),s:type==='card'?31:type==='coin'?22:type==='plush'?31:38,vx:-(235+Math.random()*105+Math.min(this.t*3,175))*slow,rot:(Math.random()-.5)*.4,vr:(Math.random()-.5)*3,bob:Math.random()*6,warn:hazard&&this.resolvedAbility.effect==='nervous'?.65:0};
    if(type==='card') obj.card=CARDS[Math.floor(Math.random()*CARDS.length)];this.objects.push(obj);
  },
  startBoss(){
    this.boss.active=true;this.boss.shoot=.6;this.boss.sponge=1;this.objects=[];$('bossHud').classList.remove('hidden');$('bossFill').style.width='100%';this.text(this.W*.52,this.H*.3,'BOSS: GIANT GLUE BOTTLE!','#ffdd54');
  },
  bossSpawn(dt){
    const b=this.boss;b.y=this.H*.5+Math.sin(this.t*2.1)*Math.min(130,this.H*.2);b.shoot-=dt;b.sponge-=dt;
    if(b.shoot<=0){this.objects.push({type:'glueorb',x:this.W-125,y:b.y+Math.random()*110-55,s:27,vx:-285-(this.t*1.2),rot:0,vr:0,bob:0,warn:this.resolvedAbility.effect==='nervous'?.5:0});b.shoot=.62+Math.random()*.5;}
    if(b.sponge<=0){this.objects.push({type:'sponge',x:this.W+45,y:105+Math.random()*(this.H-180),s:30,vx:-230,rot:0,vr:1,bob:0,warn:0});b.sponge=1.35+Math.random()*.65;}
  },
  collect(o){
    if(o.type==='coin'){this.points(9,o.x,o.y,'COIN');this.poof(o.x,o.y,8,'#ffc839');}
    if(o.type==='plush'){this.points(18,o.x,o.y,'MINI SHIELD');this.player.shield=this.resolvedAbility.effect==='chill'?11:6;$('shieldMeter').classList.remove('hidden');this.poof(o.x,o.y,14,'#ffd64c');}
    if(['clapper','camera','flyer'].includes(o.type)){this.points(30,o.x,o.y,o.type==='camera'?'CAMERA BONUS':o.type==='flyer'?'POP-UP FLYER':'KCP BONUS');this.poof(o.x,o.y,15,'#f5e4bf');}
    if(o.type==='card'){
      this.points(28,o.x,o.y,'CARD DROP');const outcome=awardCard(o.card);this.runReward={card:o.card,outcome};store();this.text(o.x,o.y+34,outcome.fresh?'NEW CARD!':`DUPLICATE +${outcome.bonus}T`,outcome.fresh?'#55e3be':'#ffc938');this.poof(o.x,o.y,18,'#42cdff');
    }
    if(o.type==='sponge'){
      this.points(35,o.x,o.y,'CLEAN-UP HIT!');this.boss.hp--;this.poof(o.x,o.y,20,'#f7dd63');$('bossFill').style.width=`${this.boss.hp/this.boss.max*100}%`;
      if(this.boss.hp<=0){this.boss.defeated=true;this.points(200,this.W*.72,this.H*.35,'BOSS DEFEATED!');this.objects=[];save.bossWins=(save.bossWins||0)+1;store();this.finishTimer=1.15;}
    }
  },
  crash(){
    const p=this.player;if(p.inv>0)return;
    if(p.shield>0){p.shield=0;$('shieldMeter').classList.add('hidden');this.poof(p.x,p.y,18,'#ffd33d');this.text(p.x,p.y-38,'SHIELD SAVE!','#ffdc4f');p.inv=.7;return;}
    if(p.revive){p.revive=false;p.inv=2;this.poof(p.x,p.y,22,'#65bef0');this.text(p.x,p.y-38,'SAD SAVE!','#62c7ff');$('reviveFlag').classList.add('hidden');return;}
    this.end();
  },
  end(){
    if(!this.running)return;this.running=false;
    let earnings=Math.max(12,Math.floor(this.score/8));if(this.resolvedAbility.effect==='happy') earnings=Math.ceil(earnings*1.25);if(this.boss.defeated) earnings+=100;
    save.coins+=earnings;save.best=Math.max(save.best,this.score);store();
    $('resultScore').textContent=this.score;$('resultCoins').textContent=earnings;$('bossResult').classList.toggle('hidden',!this.boss.defeated);
    $('resultsTitle').textContent=this.boss.defeated?'GLUE BOTTLE DOWN!':this.score>=450?'LEGENDARY DROP!':this.score>=250?'MERCH MASTER!':this.score>=100?'PROTOTYPE APPROVED!':'FIRST DRAFT!';
    if(this.runReward){const c=this.runReward.card;const o=this.runReward.outcome;$('runCardReward').classList.remove('hidden');$('runCardReward').innerHTML=`<img src="${cardSrc(c.id)}" alt="${c.name}"><span>${o.fresh?'<strong>NEW CARD DISCOVERED</strong>':'DUPLICATE CARD'}<br>${c.name} · ${c.rarity}</span>`;} else $('runCardReward').classList.add('hidden');
    setTimeout(()=>{renderAll();showScreen('resultsScreen');},260);
  },
  update(dt){
    this.t+=dt;const p=this.player;p.burst=Math.max(0,p.burst-dt);p.shield=Math.max(0,p.shield-dt);p.inv=Math.max(0,p.inv-dt);
    if(p.shield>0){$('shieldFill').style.width=`${Math.min(100,p.shield/(this.resolvedAbility.effect==='chill'?11:6)*100)}%`;} else $('shieldMeter').classList.add('hidden');
    const speed=this.resolvedAbility.effect==='excited'?945:820;const ax=((this.keys.arrowright||this.keys.d)?1:0)-((this.keys.arrowleft||this.keys.a)?1:0),ay=((this.keys.arrowdown||this.keys.s)?1:0)-((this.keys.arrowup||this.keys.w)?1:0);
    p.vx+=(ax*speed-p.vx*5.6)*dt;p.vy+=(ay*speed-p.vy*5.6)*dt;if(p.burst>0)p.vx+=700*dt;p.x=Math.max(p.r+10,Math.min(this.W-p.r-10,p.x+p.vx*dt));p.y=Math.max(p.r+72,Math.min(this.H-p.r-14,p.y+p.vy*dt));
    if(!this.boss.active && this.score>=250)this.startBoss();
    if(this.boss.active&&!this.boss.defeated)this.bossSpawn(dt);
    if(!this.boss.active){this.spawn-=dt;if(this.spawn<=0){this.spawnOne();this.spawn=Math.max(.34,.91-this.t*.006)*(.76+Math.random()*.5);}}
    if(this.finishTimer>0){this.finishTimer-=dt;if(this.finishTimer<=0){this.end();return;}}
    for(const o of this.objects){
      if(o.warn>0){o.warn-=dt;continue;}
      if(this.resolvedAbility.effect==='lovesick'&&o.type==='coin'){
        const d=Math.hypot(p.x-o.x,p.y-o.y);if(d<190){o.vx+=(p.x-o.x)*dt*16;o.y+=(p.y-o.y)*dt*6;}
      }
      o.x+=o.vx*dt;o.rot+=o.vr*dt;o.bob+=dt*5;
      if(this.resolvedAbility.effect==='mad'&&p.burst>0&&this.isHazard(o.type)&&Math.hypot(o.x-p.x,o.y-p.y)<125){o.dead=true;this.points(12,o.x,o.y,'SMASH!');this.poof(o.x,o.y,12,'#ef4435');continue;}
      if(!o.dead&&Math.hypot(o.x-p.x,o.y-p.y)<p.r+o.s*.68){o.dead=true;if(this.isHazard(o.type))this.crash();else this.collect(o);}
    }
    this.objects=this.objects.filter(o=>!o.dead&&o.x>-110);
    this.effects.forEach(e=>{e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=265*dt;});this.effects=this.effects.filter(e=>e.life>0);
    this.texts.forEach(t=>{t.life-=dt;t.y-=43*dt;});this.texts=this.texts.filter(t=>t.life>0);
  },
  drawBackground(){
    const w=this.W,h=this.H;let g;
    if(this.level==='table'){
      g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#f4d69a');g.addColorStop(.23,'#f9e9c4');g.addColorStop(.231,'#d3975f');g.addColorStop(1,'#af6b40');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(88,39,18,.13)';for(let y=h*.32;y<h;y+=70)ctx.fillRect(0,y,w,2);
    } else if(this.level==='studio'){
      g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#10192b');g.addColorStop(.5,'#272438');g.addColorStop(.501,'#171316');g.addColorStop(1,'#100d10');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(255,211,77,.15)';ctx.beginPath();ctx.moveTo(w*.08,0);ctx.lineTo(w*.39,h*.58);ctx.lineTo(w*.5,h*.58);ctx.closePath();ctx.fill();ctx.font='bold 26px Impact';ctx.fillText('KINGS CUTS STUDIO',w*.6,h*.18);
    } else {
      g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#e7d5ae');g.addColorStop(.32,'#d8c39c');g.addColorStop(.33,'#506c80');g.addColorStop(.47,'#7290a4');g.addColorStop(.48,'#dfcca5');g.addColorStop(1,'#e9d6ae');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#c59862';ctx.fillRect(0,h*.78,w,h*.22);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(0,h*.77,w,4);ctx.fillStyle='#32485c';for(let y=120;y<h*.69;y+=64){ctx.fillRect(w*.34,y,w*.12,3);}
    }
  },
  drawPlayer(){
    const p=this.player,s=skin(save.equipped),im=getImage(s.src);ctx.save();ctx.translate(p.x,p.y);if(p.inv>0&&Math.floor(p.inv*10)%2===0)ctx.globalAlpha=.45;
    if(s.id==='master'){ctx.shadowColor='#ffd043';ctx.shadowBlur=26;ctx.strokeStyle='#ffd043';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,55+Math.sin(this.t*7)*2,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
    if(p.shield>0){ctx.strokeStyle='rgba(255,203,45,.9)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,59+Math.sin(this.t*9)*3,0,Math.PI*2);ctx.stroke();}
    if(p.burst>0){ctx.fillStyle='#ffd146';ctx.beginPath();ctx.moveTo(-42,10);ctx.lineTo(-85,-8);ctx.lineTo(-55,12);ctx.lineTo(-87,30);ctx.closePath();ctx.fill();}
    ctx.fillStyle='rgba(0,0,0,.27)';ctx.beginPath();ctx.ellipse(0,50,44,10,0,0,Math.PI*2);ctx.fill();
    if(s.classic){if(im.complete)ctx.drawImage(im,-54,-54,108,108);}else{ctx.save();ctx.beginPath();ctx.arc(0,0,49,0,Math.PI*2);ctx.clip();if(im.complete)ctx.drawImage(im,-54,-54,108,108);ctx.restore();ctx.strokeStyle=s.id==='neon'?'#ff53e6':s.id==='pixel'?'#47d4ff':s.id==='comic'?'#ff693d':'#ffd043';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,50,0,Math.PI*2);ctx.stroke();}
    this.drawAccessories();ctx.restore();
  },
  drawAccessories(){
    if(save.equippedAccessories.includes('shades')){ctx.fillStyle='#0e1115';ctx.strokeStyle='#09090a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-33,-16,27,15,5);ctx.roundRect(6,-16,27,15,5);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-6,-9);ctx.lineTo(6,-9);ctx.stroke();}
    if(save.equippedAccessories.includes('director')){ctx.fillStyle='#151419';ctx.beginPath();ctx.ellipse(0,-46,38,12,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-31,-50,61,9);ctx.fillStyle='#fff';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText('KCP',0,-43);}
    if(save.equippedAccessories.includes('crown')){ctx.fillStyle='#ffd03b';ctx.beginPath();ctx.moveTo(-27,-48);ctx.lineTo(-22,-72);ctx.lineTo(-8,-58);ctx.lineTo(0,-77);ctx.lineTo(9,-58);ctx.lineTo(23,-72);ctx.lineTo(27,-48);ctx.closePath();ctx.fill();ctx.strokeStyle='#d98914';ctx.stroke();}
    if(save.equippedAccessories.includes('chain')){ctx.strokeStyle='#f4bc29';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,25,23,0,Math.PI);ctx.stroke();ctx.fillStyle='#f4bc29';ctx.beginPath();ctx.arc(0,48,7,0,Math.PI*2);ctx.fill();}
  },
  drawBoss(){
    if(!this.boss.active||this.boss.defeated)return;const x=this.W-105,y=this.boss.y;ctx.save();ctx.translate(x,y);ctx.rotate(-.12);ctx.fillStyle='#42add5';ctx.beginPath();ctx.roundRect(-39,-78,78,136,16);ctx.fill();ctx.fillStyle='#eff8ff';ctx.fillRect(-29,-38,58,47);ctx.fillStyle='#276a8f';ctx.font='bold 17px Arial';ctx.textAlign='center';ctx.fillText('GLUE',0,-10);ctx.fillStyle='#22333c';ctx.fillRect(-24,-93,48,18);ctx.rotate(.12);ctx.fillStyle='#55c5e2';ctx.beginPath();ctx.ellipse(-44,62,42,20,0,0,6.3);ctx.fill();ctx.restore();
  },
  drawObj(o){
    if(o.warn>0){ctx.save();ctx.fillStyle='#ff453c';ctx.font='bold 30px Impact';ctx.textAlign='center';ctx.fillText('!',this.W-38,o.y+10);ctx.restore();return;}
    ctx.save();ctx.translate(o.x,o.y+Math.sin(o.bob)*4);ctx.rotate(o.rot);
    if(o.type==='coin'){ctx.fillStyle='#ffca32';ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e18410';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#a8560e';ctx.font='bold 20px Impact';ctx.textAlign='center';ctx.fillText('T',0,8);}
    if(o.type==='plush'){let im=getImage('assets/terrance-player.png');if(im.complete)ctx.drawImage(im,-35,-35,70,70);}
    if(o.type==='card'){let im=getImage(cardSrc(o.card.id));if(im.complete)ctx.drawImage(im,-22,-33,44,66);}
    if(['clapper','camera','flyer'].includes(o.type)){ctx.fillStyle=o.type==='flyer'?'#fff7d8':'#15141a';ctx.fillRect(-30,-18,60,38);ctx.fillStyle=o.type==='flyer'?'#be2630':'#fff';ctx.textAlign='center';ctx.font='bold 11px Arial';ctx.fillText(o.type==='camera'?'REC':o.type==='flyer'?'MERCH!':'KCP',0,6);}
    if(['glue','coffee','spill','glueorb'].includes(o.type)){ctx.fillStyle=o.type==='coffee'?'#6e3d23':o.type==='spill'?'#db6270':'#55c8df';ctx.beginPath();ctx.ellipse(0,5,o.type==='glueorb'?24:34,o.type==='glueorb'?24:21,0,0,6.3);ctx.fill();if(o.type!=='glueorb'){ctx.fillStyle='#fff';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(o.type.toUpperCase(),0,8);}}
    if(o.type==='scissors'){ctx.strokeStyle='#dedfe3';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-22,-25);ctx.lineTo(24,25);ctx.moveTo(22,-25);ctx.lineTo(-24,25);ctx.stroke();ctx.strokeStyle='#9e263a';ctx.beginPath();ctx.arc(-18,28,9,0,6.3);ctx.arc(18,28,9,0,6.3);ctx.stroke();}
    if(o.type==='cable'){ctx.strokeStyle='#e5b833';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-42,10);ctx.bezierCurveTo(-15,-30,14,35,43,-7);ctx.stroke();}
    if(o.type==='backpack'){ctx.fillStyle='#303d7c';ctx.beginPath();ctx.roundRect(-27,-30,54,63,13);ctx.fill();ctx.strokeStyle='#15204d';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ffc83d';ctx.fillRect(-15,2,30,13);}
    if(o.type==='sponge'){ctx.fillStyle='#ffe050';ctx.beginPath();ctx.roundRect(-27,-20,54,40,10);ctx.fill();ctx.fillStyle='#d89f1e';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-18+i*9,(i%2?5:-5),3,0,6.3);ctx.fill();}ctx.fillStyle='#47300e';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText('CLEAN',0,4);}
    ctx.restore();
  },
  draw(){
    this.drawBackground();this.drawBoss();this.objects.forEach(o=>this.drawObj(o));this.drawPlayer();this.effects.forEach(e=>{ctx.globalAlpha=Math.max(0,e.life*2);ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,6.3);ctx.fill();});ctx.globalAlpha=1;this.texts.forEach(t=>{ctx.globalAlpha=Math.max(0,t.life);ctx.font='bold 19px Impact';ctx.strokeStyle='rgba(0,0,0,.52)';ctx.lineWidth=4;ctx.textAlign='center';ctx.strokeText(t.text,t.x,t.y);ctx.fillStyle=t.color;ctx.fillText(t.text,t.x,t.y);});ctx.globalAlpha=1;
  },
  loop(now){if(!this.running)return;const dt=Math.min((now-this.last)/1000,.036);this.last=now;this.update(dt);this.draw();if(this.running)requestAnimationFrame(this.loop.bind(this));}
};
addEventListener('resize',()=>{if(!$('gameScreen').classList.contains('hidden'))game.resize();});
addEventListener('keydown',e=>{game.keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();if(e.key===' ')game.burst();});
addEventListener('keyup',e=>game.keys[e.key.toLowerCase()]=false);
canvas.addEventListener('pointerdown',e=>{game.pointer=true;movePointer(e);const now=performance.now();if(now-(game.tap||0)<280)game.burst();game.tap=now;});
canvas.addEventListener('pointermove',e=>{if(game.pointer)movePointer(e);});addEventListener('pointerup',()=>game.pointer=false);
function movePointer(e){if(!game.running)return;const r=canvas.getBoundingClientRect();game.player.x=Math.max(52,Math.min(game.W-52,e.clientX-r.left));game.player.y=Math.max(94,Math.min(game.H-54,e.clientY-r.top));}
$('quitRun').onclick=()=>{game.running=false;renderAll();showScreen('menuScreen');};
renderAll();showScreen('menuScreen');maybeShowReward();
})();
