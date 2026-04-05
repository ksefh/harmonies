import React, { useState, useMemo, useCallback } from 'react';

// ============================================================
// 📸 COMMENT AJOUTER DES PHOTOS DE CARTES SCANNÉES
// ─────────────────────────────────────────────────────────────
// 1. Photographiez chaque carte à plat, bonne lumière, de face.
// 2. Recadrez sur l'illustration. Format conseillé : 400×600px.
// 3. Copiez vos fichiers .jpg/.png dans /public/cards/ (Vite).
// 4. Dans ANIMAL_POOL ci-dessous, changez `image: null` par :
//       image: '/cards/fennec.jpg'
// 5. Si image est null → l'emoji s'affiche automatiquement.
// ============================================================

const TOKEN_COUNTS = { GRAY: 23, BLUE: 23, BROWN: 21, GREEN: 19, YELLOW: 19, RED: 15 };
const TOKEN_STYLES = {
  GRAY:   { bg: '#8d8d8d', border: '#555',    shadow: '#333',    label: 'Montagne' },
  BLUE:   { bg: '#1976d2', border: '#0d47a1', shadow: '#001970', label: 'Eau'      },
  BROWN:  { bg: '#7b5e3a', border: '#4e342e', shadow: '#2d1b0e', label: 'Tronc'    },
  GREEN:  { bg: '#388e3c', border: '#1b5e20', shadow: '#003300', label: 'Forêt'    },
  YELLOW: { bg: '#f9a825', border: '#c17900', shadow: '#7a4500', label: 'Champ'    },
  RED:    { bg: '#c62828', border: '#7f0000', shadow: '#3e0000', label: 'Bâtiment' },
};

const BOARD_LAYOUT = [
  { q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 }, { q: 0, r: 4 },
  { q: 1, r: 0 }, { q: 1, r: 1 }, { q: 1, r: 2 }, { q: 1, r: 3 },
  { q: 2, r: 0 }, { q: 2, r: 1 }, { q: 2, r: 2 }, { q: 2, r: 3 }, { q: 2, r: 4 },
  { q: 3, r: 0 }, { q: 3, r: 1 }, { q: 3, r: 2 }, { q: 3, r: 3 },
  { q: 4, r: 0 }, { q: 4, r: 1 }, { q: 4, r: 2 }, { q: 4, r: 3 }, { q: 4, r: 4 },
];

// ============================================================
// 🎴 ANIMAL_POOL
// `image`       → chemin image (null = emoji)
// `patternDesc` → description textuelle du motif à réaliser
// `pattern`     → grille 2D du motif :
//   null = case vide
//   { type: 'GRAY'|..., role: 'target'|'context' }
//   target  = case où poser le cube (bordure or)
//   context = case requise par le motif
// ============================================================

const ANIMAL_POOL = [
  { id:'fennec',     name:'Fennec',     emoji:'🦊', image:null, vps:[0,4,9,16],    cubeToken:'GRAY',   cubeCount:3,
    patternDesc:'Montagne taille 2 : 2 jetons gris empilés',
    pattern:[[null,{type:'GRAY',role:'target'}],[null,{type:'GRAY',role:'context'}]] },
  { id:'ibis',       name:'Ibis',       emoji:'🦢', image:null, vps:[0,3,7],       cubeToken:'BLUE',   cubeCount:2,
    patternDesc:'2 jetons bleus adjacents',
    pattern:[[{type:'BLUE',role:'target'},{type:'BLUE',role:'context'}]] },
  { id:'baleine',    name:'Baleine',    emoji:'🐋', image:null, vps:[0,4,9,15],    cubeToken:'BLUE',   cubeCount:3,
    patternDesc:'3 jetons bleus connectés',
    pattern:[[{type:'BLUE',role:'context'},{type:'BLUE',role:'target'},{type:'BLUE',role:'context'}]] },
  { id:'ours',       name:'Ours',       emoji:'🐻', image:null, vps:[0,5,12],      cubeToken:'BROWN',  cubeCount:2,
    patternDesc:'2 jetons marron adjacents',
    pattern:[[{type:'BROWN',role:'target'},{type:'BROWN',role:'context'}]] },
  { id:'mouton',     name:'Mouton',     emoji:'🐑', image:null, vps:[0,3,8,14],    cubeToken:'BROWN',  cubeCount:3,
    patternDesc:'1 marron flanqué de 2 autres marron',
    pattern:[[{type:'BROWN',role:'context'},{type:'BROWN',role:'target'},{type:'BROWN',role:'context'}]] },
  { id:'aigle',      name:'Aigle',      emoji:'🦅', image:null, vps:[0,4,9,15],    cubeToken:'GREEN',  cubeCount:3,
    patternDesc:'Arbre taille 3 : vert sur 2 marron empilés',
    pattern:[[null,{type:'GREEN',role:'target'}],[null,{type:'BROWN',role:'context'}],[null,{type:'BROWN',role:'context'}]] },
  { id:'cerf',       name:'Cerf',       emoji:'🦌', image:null, vps:[0,6,13],      cubeToken:'GREEN',  cubeCount:2,
    patternDesc:'2 arbres adjacents (2× vert sur marron)',
    pattern:[[{type:'GREEN',role:'target'},{type:'GREEN',role:'context'}],[{type:'BROWN',role:'context'},{type:'BROWN',role:'context'}]] },
  { id:'lapin',      name:'Lapin',      emoji:'🐇', image:null, vps:[0,3,7,12],    cubeToken:'YELLOW', cubeCount:3,
    patternDesc:'3 jetons jaunes connectés',
    pattern:[[{type:'YELLOW',role:'context'},{type:'YELLOW',role:'target'},{type:'YELLOW',role:'context'}]] },
  { id:'cheval',     name:'Cheval',     emoji:'🐎', image:null, vps:[0,5,11],      cubeToken:'YELLOW', cubeCount:2,
    patternDesc:'2 jetons jaunes adjacents',
    pattern:[[{type:'YELLOW',role:'target'},{type:'YELLOW',role:'context'}]] },
  { id:'renard',     name:'Renard',     emoji:'🦝', image:null, vps:[0,4,9],       cubeToken:'RED',    cubeCount:2,
    patternDesc:'2 bâtiments adjacents (rouge sur marron)',
    pattern:[[{type:'RED',role:'target'},{type:'RED',role:'context'}],[{type:'BROWN',role:'context'},{type:'BROWN',role:'context'}]] },
  { id:'lion',       name:'Lion',       emoji:'🦁', image:null, vps:[0,6,14,22],   cubeToken:'GRAY',   cubeCount:3,
    patternDesc:'Montagne taille 3 : 3 jetons gris empilés',
    pattern:[[null,{type:'GRAY',role:'target'}],[null,{type:'GRAY',role:'context'}],[null,{type:'GRAY',role:'context'}]] },
  { id:'grenouille', name:'Grenouille', emoji:'🐸', image:null, vps:[0,3,7,12,18], cubeToken:'BLUE',   cubeCount:4,
    patternDesc:'4 jetons bleus en croix',
    pattern:[[null,{type:'BLUE',role:'context'},null],[{type:'BLUE',role:'context'},{type:'BLUE',role:'target'},{type:'BLUE',role:'context'}]] },
  { id:'sanglier',   name:'Sanglier',   emoji:'🐗', image:null, vps:[0,5,11,18],   cubeToken:'BROWN',  cubeCount:3,
    patternDesc:'1 marron entouré de 3 autres marron',
    pattern:[[{type:'BROWN',role:'context'},{type:'BROWN',role:'target'},{type:'BROWN',role:'context'}]] },
  { id:'flamant',    name:'Flamant',    emoji:'🦩', image:null, vps:[0,4,9],       cubeToken:'RED',    cubeCount:2,
    patternDesc:'Bâtiment haut : rouge sur rouge sur marron',
    pattern:[[null,{type:'RED',role:'target'}],[null,{type:'RED',role:'context'}],[null,{type:'BROWN',role:'context'}]] },
];

// ──────────────────────────────────────────────────────────────
// UTILITAIRES
// ──────────────────────────────────────────────────────────────

const getNeighborIds = (q, r) => {
  const dirs = q % 2 === 0
    ? [{q:0,r:-1},{q:0,r:1},{q:-1,r:-1},{q:-1,r:0},{q:1,r:-1},{q:1,r:0}]
    : [{q:0,r:-1},{q:0,r:1},{q:-1,r:0},{q:-1,r:1},{q:1,r:0},{q:1,r:1}];
  return dirs.map(d => `${q+d.q}-${r+d.r}`);
};

const canPlaceToken = (stack, token) => {
  if (stack.length === 0) return true;
  if (stack.length >= 3) return false;
  const top = stack[stack.length - 1];
  if (token === 'GRAY')  return top === 'GRAY';
  if (token === 'GREEN') return stack.every(t => t === 'BROWN');
  if (token === 'RED')   return ['GRAY','BROWN','RED'].includes(top);
  if (token === 'BROWN') return stack.length < 2 && stack.every(t => t === 'BROWN');
  return false;
};

const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
};

// ──────────────────────────────────────────────────────────────
// COMPTAGE DES POINTS
// ──────────────────────────────────────────────────────────────

const TREE_PTS=[0,1,3,7], MOUNT_PTS=[0,1,3,7];
const getRiverScore = n => n<=6?([0,0,2,5,11,15,15][n]??0):15+(n-6)*4;
const getCardScore  = c => c.vps[Math.min(c.cubesPlaced,c.vps.length-1)]??0;

const scoreGrid = grid => {
  const m = {}; grid.forEach(h=>{m[h.id]=h;});
  let trees=0,mountains=0,fields=0,buildings=0,river=0;
  grid.forEach(h=>{
    if(h.stack.length>0&&h.stack[h.stack.length-1]==='GREEN') trees+=TREE_PTS[h.stack.length]??0;
  });
  const mIds=new Set(grid.filter(h=>h.stack.length>0&&h.stack.every(t=>t==='GRAY')).map(h=>h.id));
  mIds.forEach(id=>{const h=m[id];if(getNeighborIds(h.q,h.r).some(n=>mIds.has(n)))mountains+=MOUNT_PTS[h.stack.length]??0;});
  const yIds=new Set(grid.filter(h=>h.stack.length===1&&h.stack[0]==='YELLOW').map(h=>h.id));
  const vy=new Set();
  yIds.forEach(s=>{if(vy.has(s))return;const q=[s],g=[];while(q.length){const c=q.shift();if(vy.has(c)||!yIds.has(c))continue;vy.add(c);g.push(c);const h=m[c];if(h)getNeighborIds(h.q,h.r).forEach(n=>{if(!vy.has(n)&&yIds.has(n))q.push(n);});}if(g.length>=2)fields+=5;});
  grid.forEach(h=>{if(h.stack.length>0&&h.stack[h.stack.length-1]==='RED'){const cs=new Set();getNeighborIds(h.q,h.r).forEach(n=>{const nb=m[n];if(nb&&nb.stack.length>0)cs.add(nb.stack[nb.stack.length-1]);});if(cs.size>=3)buildings+=5;}});
  const bIds=new Set(grid.filter(h=>h.stack.length>0&&h.stack[h.stack.length-1]==='BLUE').map(h=>h.id));
  const vb=new Set();let max=0;
  bIds.forEach(s=>{if(vb.has(s))return;const q=[s];let len=0;while(q.length){const c=q.shift();if(vb.has(c)||!bIds.has(c))continue;vb.add(c);len++;const h=m[c];if(h)getNeighborIds(h.q,h.r).forEach(n=>{if(!vb.has(n)&&bIds.has(n))q.push(n);});}max=Math.max(max,len);});
  river=getRiverScore(max);
  return{trees,mountains,fields,buildings,river,total:trees+mountains+fields+buildings+river};
};

// ──────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────

const createBoard = () => BOARD_LAYOUT.map(p=>({...p,id:`${p.q}-${p.r}`,stack:[],animalCube:null}));
const makeBag = () => { const t=[]; Object.entries(TOKEN_COUNTS).forEach(([k,n])=>{for(let i=0;i<n;i++)t.push(k);}); return shuffle(t); };
const deepPlayers = ps => ps.map(p=>({...p,grid:p.grid.map(h=>({...h,stack:[...h.stack]})),animalCards:p.animalCards.map(c=>({...c})),completedCards:p.completedCards.map(c=>({...c}))}));

const initGame = (names=['Nestor','Adversaire']) => {
  let bag=makeBag();
  const centralBoard=Array.from({length:5},()=>bag.splice(0,3));
  const all=shuffle(ANIMAL_POOL.map(a=>({...a,cubesPlaced:0})));
  return {
    bag,centralBoard,
    visibleCards:all.slice(0,5),cardDeck:all.slice(5),
    players:names.map(name=>({name,grid:createBoard(),animalCards:[],completedCards:[]})),
    currentPlayer:0,
    phase:'select_slot',        // select_slot | place_tokens | optional | game_over
    selectedSlot:null,
    pendingTokens:[],
    selectedPendingIdx:null,    // ← index du jeton choisi parmi pendingTokens
    turn:1,gameOver:false,
    turnStartSnapshot:null,     // ← snapshot pour "recommencer le tour"
    log:[`Au tour de ${names[0]} — Choisissez un emplacement.`],
  };
};

// ──────────────────────────────────────────────────────────────
// COMPOSANTS
// ──────────────────────────────────────────────────────────────

const HEX_W=62,HEX_H=54,GAP=3,BOARD_W=278.4,BOARD_H=331.6;
const OL=(BOARD_W-HEX_W*4)/2, OT=(BOARD_H-HEX_H*5.2)/2;

function Hexagon({hex,isHighlighted,onClick}){
  const{q,r,stack,animalCube}=hex;
  const x=q*(HEX_W*0.75)+OL+GAP/2, y=r*HEX_H+(q%2!==0?HEX_H/2:0)+OT+GAP/2;
  const top=stack.length>0?stack[stack.length-1]:null;
  return(
    <div onClick={onClick} style={{position:'absolute',width:HEX_W-GAP,height:HEX_H-GAP,left:x,top:y,
      cursor:onClick?'pointer':'default',filter:'drop-shadow(rgba(0,0,0,.35) 1px 3px 2px)',
      transition:'transform .13s',transform:isHighlighted?'scale(1.1)':'scale(1)',zIndex:isHighlighted?5:1}}>
      <svg viewBox="0 0 100 86.6" style={{width:'100%',height:'100%',overflow:'visible'}}>
        <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3"
          fill={top?TOKEN_STYLES[top].bg:'#e9dcc9'}
          stroke={isHighlighted?'#FFD600':(top?TOKEN_STYLES[top].border:'#c5a97a')}
          strokeWidth={isHighlighted?9:5} strokeLinejoin="round" paintOrder="stroke"
          opacity={top?1:0.65}/>
        {stack.length>1&&!animalCube&&<text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="bold" fill="rgba(255,255,255,.8)" style={{userSelect:'none'}}>{stack.length}</text>}
        {animalCube&&<text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fontSize="26" style={{userSelect:'none'}}>{animalCube}</text>}
      </svg>
    </div>
  );
}

function PatternPreview({pattern}){
  if(!pattern)return null;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:2,alignItems:'center'}}>
      {pattern.map((row,ri)=>(
        <div key={ri} style={{display:'flex',gap:2,justifyContent:'center'}}>
          {row.map((cell,ci)=>(
            <div key={ci} style={{width:10,height:10,borderRadius:2,
              background:cell?TOKEN_STYLES[cell.type].bg:'transparent',
              border:cell?`1.5px solid ${TOKEN_STYLES[cell.type].border}`:'none',
              outline:cell?.role==='target'?'2px solid #FFD600':'none',outlineOffset:'1px'}}/>
          ))}
        </div>
      ))}
    </div>
  );
}

function AnimalCard({card,isSelected,onClick,dimmed,showTakeHint,showPattern}){
  const s=TOKEN_STYLES[card.cubeToken];
  const[hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:82,minHeight:134,borderRadius:12,padding:'7px 5px 8px',
        background:isSelected?'rgba(255,214,0,.13)':'rgba(0,0,0,.45)',
        border:`2px solid ${isSelected?'#FFD600':s.bg}`,
        cursor:onClick?'pointer':'default',display:'flex',flexDirection:'column',alignItems:'center',gap:3,
        opacity:dimmed?.35:1,transition:'all .18s',position:'relative',overflow:'visible',
        transform:isSelected?'scale(1.07)':showTakeHint?'translateY(-3px)':'scale(1)',
        boxShadow:isSelected?`0 0 16px ${s.bg}99`:showTakeHint?'0 6px 18px rgba(0,0,0,.5)':'none'}}>
      {card.image?<img src={card.image} alt={card.name} style={{width:64,height:64,objectFit:'cover',borderRadius:8}}/>
        :<div style={{fontSize:28,lineHeight:1}}>{card.emoji}</div>}
      <div style={{fontSize:10,fontWeight:'bold',color:'#fff',textAlign:'center',lineHeight:1.2}}>{card.name}</div>
      <div style={{display:'flex',gap:3}}>
        {Array.from({length:card.cubeCount}).map((_,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:2,
            background:i<card.cubesPlaced?s.bg:'rgba(255,255,255,.1)',border:`1.5px solid ${s.border}`}}/>
        ))}
      </div>
      {showPattern&&<PatternPreview pattern={card.pattern}/>}
      <div style={{display:'flex',alignItems:'center',gap:3}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:s.bg,border:`1.5px solid ${s.border}`}}/>
        <span style={{fontSize:9,color:'#bbb'}}>{s.label}</span>
      </div>
      <div style={{fontSize:12,fontWeight:'bold',color:'#FFD600'}}>{getCardScore(card)} PV</div>
      {hov&&card.patternDesc&&(
        <div style={{position:'absolute',bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',
          background:'#1a0e00',border:'1px solid rgba(255,200,80,.3)',borderRadius:8,
          padding:'5px 10px',fontSize:10,color:'#FFE0B2',whiteSpace:'nowrap',
          zIndex:200,pointerEvents:'none',boxShadow:'0 4px 14px rgba(0,0,0,.8)'}}>
          📋 {card.patternDesc}
        </div>
      )}
    </div>
  );
}

const btnStyle=(bg1,bg2,color,primary=false)=>({
  background:`linear-gradient(135deg,${bg1},${bg2})`,
  border:`2px solid ${primary?'#a1887f':'rgba(255,255,255,.08)'}`,
  borderRadius:10,color,padding:'9px 20px',cursor:'pointer',
  fontSize:primary?14:12,fontWeight:primary?'bold':'normal',
  letterSpacing:1,fontFamily:'inherit',
  boxShadow:primary?'0 4px 12px rgba(0,0,0,.35)':'none',transition:'all .15s',
});

// ──────────────────────────────────────────────────────────────
// APP
// ──────────────────────────────────────────────────────────────

export default function App(){
  const[gs,setGs]=useState(()=>initGame());
  const[cubeMode,setCubeMode]=useState(null);
  const[showPatterns,setShowPatterns]=useState(true);
  const cp=gs.players[gs.currentPlayer];

  const validHexIds=useMemo(()=>{
    if(cubeMode){
      const card=cp.animalCards.find(c=>c.id===cubeMode);
      if(!card)return[];
      return cp.grid.filter(h=>!h.animalCube&&h.stack.length>0&&h.stack[h.stack.length-1]===card.cubeToken).map(h=>h.id);
    }
    if(gs.phase==='place_tokens'&&gs.selectedPendingIdx!==null){
      const token=gs.pendingTokens[gs.selectedPendingIdx];
      if(!token)return[];
      return cp.grid.filter(h=>!h.animalCube&&canPlaceToken(h.stack,token)).map(h=>h.id);
    }
    return[];
  },[gs.phase,gs.pendingTokens,gs.selectedPendingIdx,cp.grid,cubeMode,cp.animalCards]);

  // Choisir un slot
  const handleSlotClick=useCallback((idx)=>{
    if(gs.phase!=='select_slot')return;
    const tokens=gs.centralBoard[idx];
    if(!tokens?.length)return;
    setGs(prev=>({
      ...prev,selectedSlot:idx,pendingTokens:[...tokens],selectedPendingIdx:null,phase:'place_tokens',
      turnStartSnapshot:{bag:[...prev.bag],centralBoard:prev.centralBoard.map(s=>[...s]),
        players:deepPlayers(prev.players),visibleCards:prev.visibleCards.map(c=>({...c})),cardDeck:prev.cardDeck.map(c=>({...c}))},
      log:[`Slot ${idx+1} pris — cliquez un jeton ci-dessous pour le sélectionner, puis une case.`,...prev.log.slice(0,4)],
    }));
  },[gs.phase,gs.centralBoard]);

  // Sélectionner un jeton parmi les 3 (ordre libre)
  const handleSelectPending=useCallback((idx)=>{
    if(gs.phase!=='place_tokens')return;
    setCubeMode(null);
    setGs(prev=>({...prev,selectedPendingIdx:prev.selectedPendingIdx===idx?null:idx}));
  },[gs.phase]);

  // Clic sur une case
  const handleHexClick=useCallback((hexId)=>{
    if(cubeMode){
      if(!validHexIds.includes(hexId))return;
      setGs(prev=>{
        const pi=prev.currentPlayer;
        const players=prev.players.map((p,i)=>{
          if(i!==pi)return p;
          const card=p.animalCards.find(c=>c.id===cubeMode);
          const grid=p.grid.map(h=>h.id===hexId?{...h,animalCube:card?.emoji??'🐾'}:h);
          let animalCards=p.animalCards.map(c=>c.id!==cubeMode?c:{...c,cubesPlaced:c.cubesPlaced+1});
          let completedCards=[...p.completedCards];
          const upd=animalCards.find(c=>c.id===cubeMode);
          if(upd&&upd.cubesPlaced>=upd.cubeCount){completedCards=[...completedCards,upd];animalCards=animalCards.filter(c=>c.id!==cubeMode);}
          return{...p,grid,animalCards,completedCards};
        });
        return{...prev,players,log:[`Cube ${cp.animalCards.find(c=>c.id===cubeMode)?.name??''} posé !`,...prev.log.slice(0,4)]};
      });
      setCubeMode(null);return;
    }
    if(gs.phase!=='place_tokens'||gs.selectedPendingIdx===null)return;
    if(!validHexIds.includes(hexId))return;
    const tok=gs.pendingTokens[gs.selectedPendingIdx];
    setGs(prev=>{
      const pi=prev.currentPlayer;
      const players=prev.players.map((p,i)=>i!==pi?p:{...p,grid:p.grid.map(h=>h.id===hexId?{...h,stack:[...h.stack,tok]}:h)});
      const newPending=prev.pendingTokens.filter((_,i)=>i!==prev.selectedPendingIdx);
      if(newPending.length>0)return{...prev,players,pendingTokens:newPending,selectedPendingIdx:null,
        log:[`${TOKEN_STYLES[tok].label} posé — ${newPending.length} jeton(s) restant(s).`,...prev.log.slice(0,4)]};
      let newBag=[...prev.bag];
      const newBoard=prev.centralBoard.map((slot,i)=>i!==prev.selectedSlot?slot:newBag.splice(0,3));
      let vc=[...prev.visibleCards],cd=[...prev.cardDeck];
      while(vc.length<5&&cd.length>0)vc.push(cd.shift());
      const empty=players[pi].grid.filter(h=>h.stack.length===0&&!h.animalCube).length;
      const gameOver=empty<=2||newBag.length===0;
      return{...prev,players,bag:newBag,centralBoard:newBoard,visibleCards:vc,cardDeck:cd,
        selectedSlot:null,pendingTokens:[],selectedPendingIdx:null,
        phase:gameOver?'game_over':'optional',gameOver,
        log:gameOver?['🏁 Fin de partie !']:['Jetons placés — actions optionnelles ou fin de tour.',...prev.log.slice(0,4)]};
    });
  },[gs.phase,gs.pendingTokens,gs.selectedPendingIdx,validHexIds,cubeMode,cp.animalCards]);

  // Prendre une carte
  const handleTakeCard=useCallback((idx)=>{
    if(gs.phase!=='optional'||cp.animalCards.length>=4)return;
    setGs(prev=>{
      const pi=prev.currentPlayer,card=prev.visibleCards[idx];if(!card)return prev;
      const players=prev.players.map((p,i)=>i!==pi?p:{...p,animalCards:[...p.animalCards,{...card}]});
      const vc=[...prev.visibleCards];let cd=[...prev.cardDeck];
      if(cd.length>0)vc[idx]=cd.shift();else vc.splice(idx,1);
      return{...prev,players,visibleCards:vc,cardDeck:cd,log:[`Carte ${card.name} prise !`,...prev.log.slice(0,4)]};
    });
  },[gs.phase,cp.animalCards.length]);

  // 🔄 Recommencer le tour
  const handleRestartTurn=useCallback(()=>{
    const snap=gs.turnStartSnapshot;if(!snap)return;
    setCubeMode(null);
    setGs(prev=>({...prev,bag:snap.bag,centralBoard:snap.centralBoard,players:snap.players,
      visibleCards:snap.visibleCards,cardDeck:snap.cardDeck,
      phase:'select_slot',selectedSlot:null,pendingTokens:[],selectedPendingIdx:null,turnStartSnapshot:null,
      log:['↺ Tour annulé — rechoisissez un emplacement.',...prev.log.slice(0,4)]}));
  },[gs.turnStartSnapshot]);

  // Fin de tour
  const handleEndTurn=useCallback(()=>{
    if(gs.phase!=='optional')return;setCubeMode(null);
    setGs(prev=>{const next=1-prev.currentPlayer;return{...prev,currentPlayer:next,phase:'select_slot',
      turn:prev.turn+(prev.currentPlayer===1?1:0),turnStartSnapshot:null,
      log:[`Au tour de ${prev.players[next].name} — Choisissez un emplacement.`,...prev.log.slice(0,4)]};});
  },[gs.phase]);

  const finalScores=useMemo(()=>{
    if(!gs.gameOver)return null;
    return gs.players.map(p=>{const t=scoreGrid(p.grid);const av=[...p.animalCards,...p.completedCards].reduce((s,c)=>s+getCardScore(c),0);return{...t,animalVps:av,grand:t.total+av};});
  },[gs.gameOver,gs.players]);

  // ─────────────────────────────── RENDER ──────────────────────

  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(155deg,#3e2723 0%,#5d4037 45%,#4a3728 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',padding:'18px 12px 50px',
      fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif",userSelect:'none'}}>

      <h1 style={{fontSize:34,fontWeight:900,letterSpacing:8,color:'#FFCC80',textShadow:'0 2px 12px rgba(0,0,0,.6)',margin:'0 0 2px'}}>HARMONIES</h1>
      <div style={{color:'#a1887f',fontSize:11,letterSpacing:3,marginBottom:14}}>
        Tour {gs.turn} · {gs.gameOver?'🏁 Fin de partie':`Au tour de ${cp.name}`}
      </div>

      {/* LOG */}
      <div style={{background:'rgba(0,0,0,.28)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,
        padding:'6px 18px',marginBottom:14,maxWidth:640,textAlign:'center',fontSize:13,color:'#FFE0B2'}}>
        {gs.log[0]}
      </div>

      {/* PLATEAU CENTRAL */}
      {!gs.gameOver&&(
        <div style={{background:'rgba(0,0,0,.22)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:'12px 16px',marginBottom:14}}>
          <div style={{color:'#bcaaa4',fontSize:10,textAlign:'center',marginBottom:10,letterSpacing:3,textTransform:'uppercase'}}>Plateau Central</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
            {gs.centralBoard.map((tokens,i)=>{
              const canSel=gs.phase==='select_slot'&&tokens.length>0;
              return(
                <div key={i} onClick={()=>handleSlotClick(i)} style={{background:'rgba(255,255,255,.05)',
                  border:'2px solid rgba(255,255,255,.1)',borderRadius:12,padding:'8px 12px',minWidth:68,
                  cursor:canSel?'pointer':'default',opacity:tokens.length===0?.2:1,
                  transition:'all .18s',transform:canSel?'translateY(-2px)':'none',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <span style={{color:'#a1887f',fontSize:9,letterSpacing:1}}>Slot {i+1}</span>
                  <div style={{display:'flex',gap:5}}>
                    {tokens.map((t,j)=><div key={j} style={{width:22,height:22,borderRadius:'50%',background:TOKEN_STYLES[t].bg,border:`2px solid ${TOKEN_STYLES[t].border}`}}/>)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🎯 JETONS À PLACER — ORDRE LIBRE */}
          {gs.pendingTokens.length>0&&(
            <div style={{marginTop:14,padding:'10px 14px',background:'rgba(255,255,255,.04)',borderRadius:12,border:'1px dashed rgba(255,255,255,.1)'}}>
              <div style={{color:'#bcaaa4',fontSize:10,letterSpacing:2,textAlign:'center',marginBottom:10,textTransform:'uppercase'}}>
                Cliquez un jeton pour le sélectionner — posez-les dans l'ordre de votre choix
              </div>
              <div style={{display:'flex',gap:14,justifyContent:'center',alignItems:'flex-end'}}>
                {gs.pendingTokens.map((t,i)=>{
                  const sel=gs.selectedPendingIdx===i;
                  return(
                    <div key={i} onClick={()=>handleSelectPending(i)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,cursor:'pointer'}}>
                      <div style={{width:sel?36:28,height:sel?36:28,borderRadius:'50%',
                        background:TOKEN_STYLES[t].bg,
                        border:`${sel?3:2}px solid ${sel?'#FFD600':TOKEN_STYLES[t].border}`,
                        boxShadow:sel?`0 0 12px ${TOKEN_STYLES[t].bg},0 0 0 2px #FFD600`:`0 2px 6px ${TOKEN_STYLES[t].shadow}88`,
                        transition:'all .15s'}}/>
                      <span style={{fontSize:9,color:sel?'#FFD600':'#888',letterSpacing:.5,fontWeight:sel?'bold':'normal'}}>
                        {sel?'▲ SÉLECT.':TOKEN_STYLES[t].label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {gs.selectedPendingIdx!==null&&(
                <div style={{textAlign:'center',fontSize:11,color:'#FFD600',marginTop:8}}>
                  Cliquez une case surlignée sur votre plateau pour y poser le {TOKEN_STYLES[gs.pendingTokens[gs.selectedPendingIdx]]?.label}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOUTONS */}
      {!gs.gameOver&&(
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',justifyContent:'center'}}>
          {gs.turnStartSnapshot&&(
            <button onClick={handleRestartTurn} style={btnStyle('#5a1010','#8b2020','#ff8a80')}>
              ↺ Recommencer le tour
            </button>
          )}
          {cubeMode&&<button onClick={()=>setCubeMode(null)} style={btnStyle('#2a1800','#4e3020','#bcaaa4')}>✕ Annuler cube</button>}
          {gs.phase==='optional'&&<button onClick={handleEndTurn} style={btnStyle('#5d4037','#795548','#FFCC80',true)}>Fin de tour →</button>}
          <button onClick={()=>setShowPatterns(p=>!p)} style={btnStyle('#1a2a1a','#2e4a2e','#a5d6a7')}>
            {showPatterns?'🙈 Cacher motifs':'📋 Voir motifs'}
          </button>
        </div>
      )}

      {/* PLATEAUX JOUEURS */}
      <div style={{display:'flex',gap:28,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
        {gs.players.map((player,pi)=>{
          const isActive=pi===gs.currentPlayer&&!gs.gameOver;
          return(
            <div key={pi} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
              <div style={{background:isActive?'#6d4c41':'#3e2723',border:`2px solid ${isActive?'#FFD600':'transparent'}`,
                borderRadius:20,padding:'4px 18px',fontWeight:'bold',letterSpacing:2,fontSize:12,textTransform:'uppercase',
                color:isActive?'#FFD600':'#a1887f',boxShadow:isActive?'0 0 18px rgba(255,214,0,.22)':'none'}}>
                {player.name}{isActive&&' 🎯'}
              </div>

              <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center',maxWidth:360}}>
                {player.animalCards.map(card=>(
                  <AnimalCard key={card.id} card={card} isSelected={cubeMode===card.id} showPattern={showPatterns}
                    onClick={isActive&&gs.phase==='optional'?()=>setCubeMode(p=>p===card.id?null:card.id):undefined}/>
                ))}
                {player.completedCards.map((card,ci)=>(
                  <div key={'d'+card.id+ci} style={{width:82,minHeight:134,borderRadius:12,padding:'7px 5px 8px',
                    background:'rgba(0,50,0,.4)',border:'2px solid #388e3c',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:3,opacity:.7}}>
                    {card.image?<img src={card.image} alt={card.name} style={{width:64,height:64,objectFit:'cover',borderRadius:8}}/>
                      :<div style={{fontSize:28}}>{card.emoji}</div>}
                    <div style={{fontSize:10,color:'#fff',fontWeight:'bold',textAlign:'center'}}>{card.name}</div>
                    <div style={{fontSize:10,color:'#81c784'}}>✓ Complète</div>
                    <div style={{fontSize:12,color:'#FFD600',fontWeight:'bold'}}>{getCardScore(card)} PV</div>
                  </div>
                ))}
                {Array.from({length:Math.max(0,4-player.animalCards.length-player.completedCards.length)}).map((_,i)=>(
                  <div key={'e'+i} style={{width:82,height:134,borderRadius:12,background:'rgba(255,255,255,.02)',border:'2px dashed rgba(255,255,255,.06)'}}/>
                ))}
              </div>

              <div style={{position:'relative',width:BOARD_W,height:BOARD_H,
                background:'radial-gradient(circle at 45% 45%,#d2b48c 0%,#bc9d7a 100%)',
                borderRadius:45,border:`4px solid ${isActive?'#a68059':'#6d4a2a'}`,
                boxShadow:isActive?'0 0 0 3px rgba(255,214,0,.28),0 12px 40px rgba(0,0,0,.55)':'0 8px 28px rgba(0,0,0,.45)',
                opacity:gs.gameOver||!isActive?.8:1,transition:'all .28s'}}>
                {player.grid.map(hex=>(
                  <Hexagon key={hex.id} hex={hex}
                    isHighlighted={isActive&&validHexIds.includes(hex.id)}
                    onClick={isActive?()=>handleHexClick(hex.id):undefined}/>
                ))}
              </div>
              {gs.gameOver&&finalScores&&<ScorePanel score={finalScores[pi]}/>}
            </div>
          );
        })}
      </div>

      {/* CARTES DISPONIBLES */}
      {!gs.gameOver&&(
        <div style={{marginTop:22,background:'rgba(0,0,0,.22)',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,padding:'12px 14px'}}>
          <div style={{color:'#bcaaa4',fontSize:10,textAlign:'center',marginBottom:10,letterSpacing:3,textTransform:'uppercase'}}>Cartes Disponibles</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
            {gs.visibleCards.map((card,i)=>(
              <AnimalCard key={card.id+i} card={card} showPattern={showPatterns}
                showTakeHint={gs.phase==='optional'&&cp.animalCards.length<4}
                dimmed={gs.phase!=='optional'||cp.animalCards.length>=4}
                onClick={gs.phase==='optional'&&cp.animalCards.length<4?()=>handleTakeCard(i):undefined}/>
            ))}
          </div>
        </div>
      )}

      {/* LÉGENDE */}
      <div style={{marginTop:18,display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
        {Object.entries(TOKEN_STYLES).map(([t,s])=>(
          <div key={t} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:s.bg,border:`1.5px solid ${s.border}`}}/>
            <span style={{fontSize:10,color:'#8d6e63'}}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* FIN DE PARTIE */}
      {gs.gameOver&&finalScores&&(
        <div style={{marginTop:28,background:'rgba(0,0,0,.55)',border:'1px solid rgba(255,214,0,.18)',borderRadius:20,padding:'24px 28px',maxWidth:520,width:'100%'}}>
          <h2 style={{textAlign:'center',color:'#FFCC80',margin:'0 0 20px',letterSpacing:4,fontSize:22}}>🏆 FIN DE PARTIE</h2>
          {finalScores.map((s,pi)=>{
            const isW=finalScores.every((_,i)=>i===pi||s.grand>=finalScores[i].grand);
            return(
              <div key={pi} style={{background:isW?'rgba(255,214,0,.07)':'rgba(255,255,255,.04)',
                border:`1px solid ${isW?'rgba(255,214,0,.3)':'rgba(255,255,255,.06)'}`,borderRadius:12,padding:'14px 16px',marginBottom:10}}>
                <div style={{fontWeight:'bold',fontSize:16,marginBottom:8,color:isW?'#FFD600':'#fff'}}>
                  {isW&&'🏆 '}{gs.players[pi].name} — {s.grand} PV
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'5px 12px',fontSize:12,color:'#bcaaa4'}}>
                  <span>🌲 Arbres: <b style={{color:'#fff'}}>{s.trees}</b></span>
                  <span>⛰️ Montagnes: <b style={{color:'#fff'}}>{s.mountains}</b></span>
                  <span>🌾 Champs: <b style={{color:'#fff'}}>{s.fields}</b></span>
                  <span>🏠 Bâtiments: <b style={{color:'#fff'}}>{s.buildings}</b></span>
                  <span>💧 Rivière: <b style={{color:'#fff'}}>{s.river}</b></span>
                  <span>🐾 Animaux: <b style={{color:'#fff'}}>{s.animalVps}</b></span>
                </div>
              </div>
            );
          })}
          {(()=>{const mx=Math.max(...finalScores.map(s=>s.grand));const ws=gs.players.filter((_,i)=>finalScores[i].grand===mx);
            return<div style={{textAlign:'center',color:'#FFCC80',fontWeight:'bold',fontSize:17,margin:'8px 0'}}>
              {ws.length>1?'🤝 Égalité !':'🏆 '+ws[0].name+' remporte la partie !'}</div>;}
          )()}
          <button onClick={()=>{setCubeMode(null);setGs(initGame(gs.players.map(p=>p.name)));}}
            style={{...btnStyle('#5d4037','#795548','#FFCC80',true),width:'100%',marginTop:12}}>
            ↺ Nouvelle Partie
          </button>
        </div>
      )}
    </div>
  );
}

function ScorePanel({score}){
  return(
    <div style={{background:'rgba(0,0,0,.35)',borderRadius:12,padding:'8px 14px',
      border:'1px solid rgba(255,255,255,.08)',fontSize:11,color:'#bcaaa4',width:BOARD_W,textAlign:'center'}}>
      <div style={{color:'#FFCC80',fontWeight:'bold',fontSize:14,marginBottom:4}}>
        {score.grand} PV (terrain: {score.total} + animaux: {score.animalVps})
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
        <span>🌲{score.trees}</span><span>⛰️{score.mountains}</span>
        <span>🌾{score.fields}</span><span>🏠{score.buildings}</span><span>💧{score.river}</span>
      </div>
    </div>
  );
}
