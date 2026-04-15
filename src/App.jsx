// App.jsx — Harmonies Multijoueur
// Remplace src/App.jsx | Requiert : npm install firebase
// Créez src/firebase.js avec votre config Firebase

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { db } from './firebase';
import { ref, set, onValue, off, get } from 'firebase/database';

// ══════════════════════════════════════════════════════════════════
//  TOUTE LA LOGIQUE DE JEU — inchangée par rapport à votre version
// ══════════════════════════════════════════════════════════════════

const TOKEN_COUNTS = { GRAY: 23, BLUE: 23, BROWN: 21, GREEN: 19, YELLOW: 19, RED: 15 };
const TOKEN_STYLES = {
  GRAY:   { bg: '#8d8d8d', border: '#555',    shadow: '#333',    label: 'Montagne' },
  BLUE:   { bg: '#1976d2', border: '#0d47a1', shadow: '#001970', label: 'Eau'      },
  BROWN:  { bg: '#7b5e3a', border: '#4e342e', shadow: '#2d1b0e', label: 'Tronc'    },
  GREEN:  { bg: '#388e3c', border: '#1b5e20', shadow: '#003300', label: 'Arbre'    },
  YELLOW: { bg: '#f9a825', border: '#c17900', shadow: '#7a4500', label: 'Champ'    },
  RED:    { bg: '#c62828', border: '#7f0000', shadow: '#3e0000', label: 'Maison'   },
};
const BOARD_LAYOUT = [
  {q:0,r:0},{q:0,r:1},{q:0,r:2},{q:0,r:3},{q:0,r:4},
  {q:1,r:0},{q:1,r:1},{q:1,r:2},{q:1,r:3},
  {q:2,r:0},{q:2,r:1},{q:2,r:2},{q:2,r:3},{q:2,r:4},
  {q:3,r:0},{q:3,r:1},{q:3,r:2},{q:3,r:3},
  {q:4,r:0},{q:4,r:1},{q:4,r:2},{q:4,r:3},{q:4,r:4},
];

const H = (token, height) => ({ token, height });

const ANIMAL_POOL_DEF = [
  { id:'babouin',    name:'Babouin',        emoji:'🦍', vps:[5,11],        cubeCount:2, patternType:4, hexTypes:[H('BLUE',1),H('BLUE',1),H('GRAY',2)],                             targetPositionIdx:2 },
  { id:'perroquet',  name:'Perroquet',      emoji:'🦜', vps:[4,9,14],      cubeCount:3, patternType:4, hexTypes:[H('BLUE',1),H('BLUE',1),H('GREEN',2)],                            targetPositionIdx:2 },
  { id:'raie',       name:'Raie',           emoji:'🐠', vps:[4,10,16],     cubeCount:3, patternType:4, hexTypes:[H('BLUE',1),H('GRAY',1),H('GRAY',1)],                             targetPositionIdx:0 },
  { id:'flamand',    name:'Flamand rose',   emoji:'🦩', vps:[4,10,16],     cubeCount:3, patternType:4, hexTypes:[H('BLUE',1),H('YELLOW',1),H('YELLOW',1)],                         targetPositionIdx:0 },
  { id:'loup',       name:'Loup',           emoji:'🐺', vps:[4,10,16],     cubeCount:3, patternType:4, hexTypes:[H('YELLOW',1),H('YELLOW',1),H('GREEN',3)],                        targetPositionIdx:2 },
  { id:'herisson',   name:'Hérisson',       emoji:'🦔', vps:[5,12],        cubeCount:2, patternType:4, hexTypes:[H('RED',2),H('GREEN',2),H('GREEN',2)],                            targetPositionIdx:0 },
  { id:'ours',       name:'Ours',           emoji:'🐻', vps:[5,11],        cubeCount:2, patternType:4, hexTypes:[H('GREEN',1),H('GRAY',2),H('GRAY',2)],                            targetPositionIdx:0 },
  { id:'loutre',     name:'Loutre',         emoji:'🦦', vps:[5,10,16],     cubeCount:3, patternType:1, hexTypes:[H('BLUE',1),H('GREEN',1),H('GREEN',1)],                           targetPositionIdx:0 },
  { id:'crocodile',  name:'Crocodile',      emoji:'🐊', vps:[4,9,15],      cubeCount:3, patternType:1, hexTypes:[H('BLUE',1),H('BLUE',1),H('GREEN',3)],                            targetPositionIdx:0 },
  { id:'panthere',   name:'Panthère noire', emoji:'🐆', vps:[5,11],        cubeCount:2, patternType:1, hexTypes:[H('YELLOW',1),H('GREEN',2),H('GREEN',2)],                         targetPositionIdx:0 },
  { id:'lesard',     name:'Lézard',         emoji:'🦎', vps:[5,10,16],     cubeCount:3, patternType:1, hexTypes:[H('RED',2),H('YELLOW',1),H('YELLOW',1)],                          targetPositionIdx:0 },
  { id:'fennec',     name:'Fennec',         emoji:'🦊', vps:[4,9,16],      cubeCount:3, patternType:1, hexTypes:[H('GRAY',1),H('GRAY',1),H('YELLOW',1)],                           targetPositionIdx:0 },
  { id:'lapin',      name:'Lapin',          emoji:'🐇', vps:[5,10,17],     cubeCount:3, patternType:1, hexTypes:[H('GREEN',1),H('GREEN',1),H('RED',2)],                            targetPositionIdx:0 },
  { id:'lama',       name:'Lama',           emoji:'🦙', vps:[5,12],        cubeCount:2, patternType:1, hexTypes:[H('YELLOW',1),H('YELLOW',1),H('GRAY',2)],                         targetPositionIdx:0 },
  { id:'chauves',    name:'Chauve-souris',  emoji:'🦇', vps:[3,6,10,15],   cubeCount:4, patternType:2, hexTypes:[H('GRAY',1),H('GREEN',3)],                                        targetPositionIdx:0 },
  { id:'grenouille', name:'Grenouille',     emoji:'🐸', vps:[2,4,6,10,15], cubeCount:5, patternType:2, hexTypes:[H('BLUE',1),H('GREEN',1)],                                        targetPositionIdx:0 },
  { id:'coccinelle', name:'Coccinelle',     emoji:'🐞', vps:[2,5,8,12,17], cubeCount:5, patternType:2, hexTypes:[H('YELLOW',1),H('GREEN',1)],                                      targetPositionIdx:0 },
  { id:'koala',      name:'Koala',          emoji:'🐨', vps:[3,6,10,15],   cubeCount:4, patternType:2, hexTypes:[H('GREEN',2),H('GREEN',1)],                                       targetPositionIdx:0 },
  { id:'sanglier',   name:'Sanglier',       emoji:'🐗', vps:[4,8,13],      cubeCount:3, patternType:2, hexTypes:[H('GREEN',2),H('RED',2)],                                         targetPositionIdx:0 },
  { id:'suricate',   name:'Suricate',       emoji:'🦡', vps:[2,5,9,14],    cubeCount:4, patternType:2, hexTypes:[H('GRAY',1),H('YELLOW',1)],                                       targetPositionIdx:0 },
  { id:'saumon',     name:'Saumon',         emoji:'🐟', vps:[3,6,10,16],   cubeCount:4, patternType:2, hexTypes:[H('BLUE',1),H('GRAY',3)],                                         targetPositionIdx:0 },
  { id:'fouine',     name:'Fouine blanche', emoji:'🦡', vps:[5,10,17],     cubeCount:3, patternType:3, hexTypes:[H('YELLOW',1),H('GREEN',2),H('GREEN',2)],                         targetPositionIdx:0 },
  { id:'corbeau',    name:'Corbeau',        emoji:'🐦', vps:[4,9],         cubeCount:2, patternType:3, hexTypes:[H('YELLOW',1),H('RED',2),H('RED',2)],                             targetPositionIdx:0 },
  { id:'pingouin',   name:'Pingouin',       emoji:'🐧', vps:[4,10,16],     cubeCount:3, patternType:3, hexTypes:[H('GRAY',1),H('BLUE',1),H('BLUE',1)],                             targetPositionIdx:0 },
  { id:'souris',     name:'Souris',         emoji:'🐭', vps:[5,10,17],     cubeCount:3, patternType:3, hexTypes:[H('RED',2),H('YELLOW',1),H('YELLOW',1)],                          targetPositionIdx:0 },
  { id:'paon',       name:'Paon',           emoji:'🦚', vps:[5,10,17],     cubeCount:3, patternType:3, hexTypes:[H('RED',2),H('BLUE',1),H('BLUE',1)],                              targetPositionIdx:0 },
  { id:'colibri',    name:'Colibri',        emoji:'🐦', vps:[5,11,18],     cubeCount:3, patternType:3, hexTypes:[H('GREEN',3),H('BLUE',1),H('BLUE',1)],                            targetPositionIdx:0 },
  { id:'raton',      name:'Raton laveur',   emoji:'🦝', vps:[6,12],        cubeCount:2, patternType:5, hexTypes:[H('YELLOW',1),H('BLUE',1),H('BLUE',1),H('BLUE',1)],              targetPositionIdx:0 },
  { id:'abeille',    name:'Abeille',        emoji:'🐝', vps:[8,18],        cubeCount:2, patternType:5, hexTypes:[H('GREEN',2),H('YELLOW',1),H('YELLOW',1),H('YELLOW',1)],         targetPositionIdx:0 },
  { id:'ecureuil',   name:'Écureuil',       emoji:'🐿️', vps:[4,9,15],      cubeCount:3, patternType:2, hexTypes:[H('RED',2),H('GREEN',3)],                                        targetPositionIdx:0 },
  { id:'gypaete',    name:'Gypaète',        emoji:'🦅', vps:[5,11],        cubeCount:2, patternType:2, hexTypes:[H('GRAY',3),H('YELLOW',1)],                                       targetPositionIdx:0 },
  { id:'canard',     name:'Canard',         emoji:'🦆', vps:[2,4,8,13],    cubeCount:4, patternType:2, hexTypes:[H('BLUE',1),H('RED',2)],                                          targetPositionIdx:0 },
];

const ANIMAL_POOL = ANIMAL_POOL_DEF.map(a => ({ ...a, image: null, cubeToken: a.hexTypes[a.targetPositionIdx].token }));

const PATTERN_GRID_POS = {
  1: [[0,0],[0,1],[0,2]],
  2: [[0,0],[1,0]],
  3: [[1,0],[0,0],[1,1]],
  4: [[0,0],[1,0],[0,1]],
  5: [[1,0],[0,0],[0,1],[1,1]],
};

const getNeighborIds = (q, r) => {
  const dirs = q % 2 === 0
    ? [{q:0,r:-1},{q:0,r:1},{q:-1,r:-1},{q:-1,r:0},{q:1,r:-1},{q:1,r:0}]
    : [{q:0,r:-1},{q:0,r:1},{q:-1,r:0},{q:-1,r:1},{q:1,r:0},{q:1,r:1}];
  return dirs.map(d => `${q+d.q}-${r+d.r}`);
};

const toCube = (q, r) => { const cx=q, cz=r-(q>>1); return [cx,-cx-cz,cz]; };
const cubeEq = (a,b) => a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2];
const cubeSub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const areCollinear = (hA, hB, hC) => {
  const a=toCube(hA.q,hA.r), b=toCube(hB.q,hB.r), c=toCube(hC.q,hC.r);
  return cubeEq(cubeSub(b,a), cubeSub(c,b));
};

const canPlaceToken = (stack, token) => {
  if (stack.length === 0) return true;
  const top = stack[stack.length - 1];
  if (token === 'GRAY')  { if (stack.length >= 3) return false; return top === 'GRAY'; }
  if (token === 'GREEN') { if (stack.length >= 3) return false; return stack.every(t => t === 'BROWN'); }
  if (token === 'RED')   { if (stack.length >= 2) return false; return ['GRAY','BROWN','RED'].includes(top); }
  if (token === 'BROWN') { return stack.length < 2 && stack.every(t => t === 'BROWN'); }
  return false;
};

const hexMatchesType = (hex, coordType, mustBeEmpty = false) => {
  if (!coordType || !hex) return false;
  if (mustBeEmpty && hex.animalCube) return false;
  const { token, height } = coordType;
  if (hex.stack.length !== height) return false;
  if (hex.stack.length === 0) return false;
  const top = hex.stack[hex.stack.length - 1];
  if (top !== token) return false;
  if (token === 'GRAY'  && !hex.stack.every(t => t === 'GRAY'))  return false;
  if (token === 'GREEN' && hex.stack.slice(0,-1).some(t => t !== 'BROWN')) return false;
  return true;
};

const findValidTargets = (card, hexMap) => {
  const hexes = Object.values(hexMap).filter(Boolean);
  const { patternType, hexTypes, targetPositionIdx } = card;
  const valid = new Set();

  if (patternType === 1) {
    const [t0,t1,t2] = hexTypes;
    hexes.forEach(hexA => {
      if (!hexMatchesType(hexA, t0, true)) return;
      getNeighborIds(hexA.q,hexA.r).forEach(idB => {
        const hexB = hexMap[idB]; if (!hexB || !hexMatchesType(hexB,t1,false)) return;
        getNeighborIds(hexB.q,hexB.r).forEach(idC => {
          const hexC = hexMap[idC];
          if (!hexC || hexC.id===hexA.id || !hexMatchesType(hexC,t2,false)) return;
          if (areCollinear(hexA,hexB,hexC)) valid.add(hexA.id);
        });
      });
    });
  } else if (patternType === 2) {
    const [t0,t1] = hexTypes;
    hexes.forEach(hexA => {
      if (!hexMatchesType(hexA, t0, true)) return;
      if (getNeighborIds(hexA.q,hexA.r).some(id => hexMatchesType(hexMap[id],t1,false)))
        valid.add(hexA.id);
    });
  } else if (patternType === 3) {
    const [t0,t1,t2] = hexTypes;
    hexes.forEach(hexC => {
      if (!hexMatchesType(hexC, t0, true)) return;
      const neigh = getNeighborIds(hexC.q,hexC.r).map(id=>hexMap[id]).filter(Boolean);
      const hasMatch = neigh.some((n1,i) =>
        hexMatchesType(n1,t1,false) && neigh.some((n2,j) => {
          if (j === i) return false;
          if (!hexMatchesType(n2,t2,false)) return false;
          // Forme en C : n1 et n2 ne doivent PAS être adjacents
          return !getNeighborIds(n1.q,n1.r).includes(n2.id);
        })
      );
      if (hasMatch) valid.add(hexC.id);
    });
  } else if (patternType === 4) {
    const targetType = hexTypes[targetPositionIdx];
    const otherIndices = [0,1,2].filter(i => i !== targetPositionIdx);
    const [oi1, oi2] = otherIndices;
    hexes.forEach(hexA => {
      if (!hexMatchesType(hexA, targetType, true)) return;
      const neighA = getNeighborIds(hexA.q,hexA.r).map(id=>hexMap[id]).filter(Boolean);
      for (let i=0; i<neighA.length; i++) {
        for (let j=i+1; j<neighA.length; j++) {
          const hexB=neighA[i], hexC=neighA[j];
          if (!getNeighborIds(hexB.q,hexB.r).includes(hexC.id)) continue;
          if ((hexMatchesType(hexB,hexTypes[oi1],false)&&hexMatchesType(hexC,hexTypes[oi2],false)) ||
              (hexMatchesType(hexC,hexTypes[oi1],false)&&hexMatchesType(hexB,hexTypes[oi2],false))) {
            valid.add(hexA.id); return;
          }
        }
      }
    });
  } else if (patternType === 5) {
    const [t0,t1,t2,t3] = hexTypes;
    hexes.forEach(hexB1 => {
      const neighB1Ids = getNeighborIds(hexB1.q,hexB1.r);
      neighB1Ids.forEach(idB2 => {
        const hexB2 = hexMap[idB2];
        if (!hexB2 || hexB2.id <= hexB1.id) return;
        const neighB2Set = new Set(getNeighborIds(hexB2.q,hexB2.r));
        const shared = neighB1Ids.filter(id => neighB2Set.has(id) && id!==hexB1.id && id!==hexB2.id)
          .map(id=>hexMap[id]).filter(Boolean);
        if (shared.length !== 2) return;
        const [hexA1, hexA2] = shared;
        [hexB1, hexB2].forEach(inner => {
          if (!hexMatchesType(inner, t0, true)) return;
          const others = [hexB1,hexB2,hexA1,hexA2].filter(h=>h.id!==inner.id);
          const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
          if (perms.some(([a,b,c]) =>
            hexMatchesType(others[a],t1,false) &&
            hexMatchesType(others[b],t2,false) &&
            hexMatchesType(others[c],t3,false)
          )) valid.add(inner.id);
        });
      });
    });
  }
  return [...valid];
};

const TREE_PTS=[0,1,3,7], MOUNT_PTS=[0,1,3,7];
const getRiverScore = n => n<=6?([0,0,2,5,11,15,15][n]??0):15+(n-6)*4;
const getCardScore  = c => c.cubesPlaced === 0 ? 0 : c.vps[c.cubesPlaced - 1];

const scoreGrid = grid => {
  const m={}; grid.forEach(h=>{m[h.id]=h;});
  let trees=0,mountains=0,fields=0,buildings=0,river=0;
  grid.forEach(h=>{if(h.stack.length===2&&h.stack[h.stack.length-1]==='RED'){const cs=new Set();getNeighborIds(h.q,h.r).forEach(n=>{const nb=m[n];if(nb&&nb.stack.length>0)cs.add(nb.stack[nb.stack.length-1]);});if(cs.size>=3)buildings+=5;}});
  const mIds=new Set(grid.filter(h=>h.stack.length>0&&h.stack.every(t=>t==='GRAY')).map(h=>h.id));
  mIds.forEach(id=>{const h=m[id];if(getNeighborIds(h.q,h.r).some(n=>mIds.has(n)))mountains+=MOUNT_PTS[h.stack.length]??0;});
  const yIds=new Set(grid.filter(h=>h.stack.length===1&&h.stack[0]==='YELLOW').map(h=>h.id));
  const vy=new Set();
  yIds.forEach(s=>{if(vy.has(s))return;const q=[s],g=[];while(q.length){const c=q.shift();if(vy.has(c)||!yIds.has(c))continue;vy.add(c);g.push(c);const h=m[c];if(h)getNeighborIds(h.q,h.r).forEach(n=>{if(!vy.has(n)&&yIds.has(n))q.push(n);});}if(g.length>=2)fields+=5;});
  grid.forEach(h=>{if(h.stack.length>0&&h.stack[h.stack.length-1]==='RED'){const cs=new Set();getNeighborIds(h.q,h.r).forEach(n=>{const nb=m[n];if(nb&&nb.stack.length>0)cs.add(nb.stack[nb.stack.length-1]);});if(cs.size>=3)buildings+=5;}});
  const bIds=new Set(grid.filter(h=>h.stack.length>0&&h.stack[h.stack.length-1]==='BLUE').map(h=>h.id));
  const vb=new Set();let mx=0;
  bIds.forEach(s=>{if(vb.has(s))return;const q=[s];let len=0;while(q.length){const c=q.shift();if(vb.has(c)||!bIds.has(c))continue;vb.add(c);len++;const h=m[c];if(h)getNeighborIds(h.q,h.r).forEach(n=>{if(!vb.has(n)&&bIds.has(n))q.push(n);});}mx=Math.max(mx,len);});
  river=getRiverScore(mx);
  return{trees,mountains,fields,buildings,river,total:trees+mountains+fields+buildings+river};
};

const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const createBoard = () => BOARD_LAYOUT.map(p=>({...p,id:`${p.q}-${p.r}`,stack:[],animalCube:null}));
const makeBag = () => { const t=[]; Object.entries(TOKEN_COUNTS).forEach(([k,n])=>{for(let i=0;i<n;i++)t.push(k);}); return shuffle(t); };
const deepPlayers = ps => ps.map(p=>({...p,grid:p.grid.map(h=>({...h,stack:[...h.stack]})),animalCards:p.animalCards.map(c=>({...c})),completedCards:p.completedCards.map(c=>({...c}))}));

const initGame = (names=['Nestor','Lili']) => {
  let bag=makeBag();
  const centralBoard=Array.from({length:5},()=>bag.splice(0,3));
  const all=shuffle(ANIMAL_POOL.map(a=>({...a,cubesPlaced:0})));
  return { bag,centralBoard,visibleCards:all.slice(0,5),cardDeck:all.slice(5),
    players:names.map(name=>({name,grid:createBoard(),animalCards:[],completedCards:[]})),
    currentPlayer:0,phase:'select_slot',selectedSlot:null,pendingTokens:[],selectedPendingIdx:null,
    turn:1,gameOver:false,lastRound:false,turnStartSnapshot:null,hasTakenCardThisTurn:false,
    log:[`Au tour de ${names[0]} — Choisissez un emplacement.`] };
};

const genRoomCode = () => Math.random().toString(36).substring(2,8).toUpperCase();

// Firebase convertit les tableaux en objets {0:...,1:...} — on reconvertit à la lecture
const fixArr = v => {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map(fixArr);
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    const isNumeric = keys.length > 0 && keys.every((k,i) => String(i) === k);
    if (isNumeric) return keys.map(k => fixArr(v[k]));
    const out = {};
    keys.forEach(k => { out[k] = fixArr(v[k]); });
    return out;
  }
  return v;
};

// Firebase supprime les [] vides et les null → on remet les valeurs par défaut
const fa = v => Array.isArray(v) ? v : [];  // force array
const normalizeGs = gs => {
  if (!gs) return gs;
  return {
    ...gs,
    bag:              fa(gs.bag),
    pendingTokens:    fa(gs.pendingTokens),
    visibleCards:     fa(gs.visibleCards),
    cardDeck:         fa(gs.cardDeck),
    log:              fa(gs.log).length ? fa(gs.log) : [''],
    centralBoard:     fa(gs.centralBoard).map(slot => fa(slot)),
    selectedSlot:     gs.selectedSlot ?? null,
    selectedPendingIdx: gs.selectedPendingIdx ?? null,
    turnStartSnapshot:  gs.turnStartSnapshot ?? null,
    hasTakenCardThisTurn: gs.hasTakenCardThisTurn ?? false,
    lastRound:        gs.lastRound ?? false,
    gameOver:         gs.gameOver ?? false,
    players: fa(gs.players).map(p => ({
      ...p,
      animalCards:    fa(p.animalCards),
      completedCards: fa(p.completedCards),
      grid: fa(p.grid).map(h => ({
        ...h,
        stack:      fa(h.stack),
        animalCube: h.animalCube ?? null,
      })),
    })),
  };
};

// Applique les deux corrections à la lecture depuis Firebase
const fromFirebase = data => normalizeGs(fixArr(data));

// ══════════════════════════════════════════════════════════════════
//  COMPOSANTS VISUELS
// ══════════════════════════════════════════════════════════════════

const HEX_W=62, HEX_H=54, GAP=3, BOARD_W=278.4, BOARD_H=331.6;
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
          strokeWidth={isHighlighted?9:5} strokeLinejoin="round" paintOrder="stroke" opacity={top?1:0.65}/>
        {/* 1. Cas : L'animal ET le chiffre sont présents (on les espace) */}
        {stack.length > 1 && animalCube && (
          <>
            <text x="50" y="35" textAnchor="middle" dominantBaseline="middle" fontSize="22" style={{userSelect:'none'}}>{animalCube}</text>
            <text x="50" y="65" textAnchor="middle" dominantBaseline="middle" fontSize="19" fontWeight="bold" fill="rgba(255,255,255,.95)" style={{userSelect:'none'}}>{stack.length}</text>
          </>
        )}

        {/* 2. Cas : Uniquement le chiffre (hauteur > 1) */}
        {stack.length > 1 && !animalCube && (
          <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="bold" fill="rgba(255,255,255,.85)" style={{userSelect:'none'}}>{stack.length}</text>
        )}

        {/* 3. Cas : Uniquement l'animal (sur une pile de 0 ou 1) */}
        {animalCube && stack.length <= 1 && (<text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fontSize="26" style={{userSelect:'none'}}>{animalCube}</text>)}
      </svg>
    </div>
  );
}

const MR=10, MC=MR*1.5, MH=MR*Math.sqrt(3), MO=MH/2;
const gridToPx = ([q,r]) => ({ cx: q*MC, cy: r*MH+(q%2!==0?MO:0) });
const miniHexPts = (cx,cy) =>
  [0,60,120,180,240,300].map(deg=>{const rad=deg*Math.PI/180;return `${(cx+MR*Math.cos(rad)).toFixed(2)},${(cy+MR*Math.sin(rad)).toFixed(2)}`;}).join(' ');

function PatternHexSVG({ card }) {
  const positions = PATTERN_GRID_POS[card.patternType] || [[0,0]];
  const pixels = positions.map(gridToPx);
  const pad = MR+2;
  const minX=Math.min(...pixels.map(p=>p.cx))-pad, minY=Math.min(...pixels.map(p=>p.cy))-pad;
  const maxX=Math.max(...pixels.map(p=>p.cx))+pad, maxY=Math.max(...pixels.map(p=>p.cy))+pad;
  const vbW=maxX-minX, vbH=maxY-minY;
  const scale=Math.min(68/vbW, 52/vbH);
  return (
    <svg viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
      style={{width:vbW*scale,height:vbH*scale,display:'block',margin:'2px auto'}}>
      {pixels.map((px,i)=>{
        const ht=card.hexTypes[i], isTarget=i===card.targetPositionIdx;
        return(
          <g key={i}>
            <polygon points={miniHexPts(px.cx,px.cy)}
              fill={ht?TOKEN_STYLES[ht.token].bg:'#d2b48c'}
              stroke={isTarget?'#FFD600':(ht?TOKEN_STYLES[ht.token].border:'#a68059')}
              strokeWidth={isTarget?2.5:1.2} strokeLinejoin="round" opacity={ht?1:0.45}/>
            {ht&&ht.height>1&&<text x={px.cx} y={px.cy} textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fontWeight="bold" fill="rgba(255,255,255,0.92)" style={{userSelect:'none'}}>{ht.height}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function AnimalCard({card,isSelected,onClick,dimmed,showTakeHint}){
  const s=TOKEN_STYLES[card.cubeToken];
  const[hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:88,minHeight:150,borderRadius:12,padding:'6px 4px 7px',
        background:isSelected?'rgba(255,214,0,.13)':'rgba(0,0,0,.45)',
        border:`2px solid ${isSelected?'#FFD600':s.bg}`,
        cursor:onClick?'pointer':'default',display:'flex',flexDirection:'column',alignItems:'center',gap:2,
        opacity:dimmed?.35:1,transition:'all .18s',position:'relative',overflow:'visible',
        transform:isSelected?'scale(1.07)':showTakeHint?'translateY(-3px)':'scale(1)',
        boxShadow:isSelected?`0 0 16px ${s.bg}99`:showTakeHint?'0 6px 18px rgba(0,0,0,.5)':'none'}}>
      {card.image
        ?<img src={card.image} alt={card.name} style={{width:60,height:44,objectFit:'cover',borderRadius:6,marginBottom:1}}/>
        :<div style={{fontSize:26,lineHeight:1,marginBottom:1}}>{card.emoji}</div>}
      <div style={{fontSize:9,fontWeight:'bold',color:'#fff',textAlign:'center',lineHeight:1.15,maxWidth:82}}>{card.name}</div>
      <div style={{display:'flex',gap:2,margin:'1px 0'}}>
        {Array.from({length:card.cubeCount}).map((_,i)=>(
          <div key={i} style={{width:9,height:9,borderRadius:2,
            background:i<card.cubesPlaced?s.bg:'rgba(255,255,255,.1)',border:`1.5px solid ${s.border}`}}/>
        ))}
      </div>
      <PatternHexSVG card={card}/>
      <div style={{fontSize:11,fontWeight:'bold',color:'#FFD600',marginTop:1}}>{getCardScore(card)} NEXT</div>
      <div style={{fontSize:11,fontWeight:'bold',color:'#FFD600',marginTop:1}}>{card.vps.join(' / ')}</div>
      {hov&&(
        <div style={{position:'absolute',bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',
          background:'#1a0e00',border:'1px solid rgba(255,200,80,.3)',borderRadius:8,
          padding:'5px 10px',fontSize:10,color:'#FFE0B2',whiteSpace:'nowrap',
          zIndex:200,pointerEvents:'none',boxShadow:'0 4px 14px rgba(0,0,0,.8)'}}>
          {card.hexTypes.map((t,i)=>{
            const s2=TOKEN_STYLES[t.token];
            return<span key={i} style={{marginRight:6}}>
              <span style={{color:s2.bg,fontWeight:'bold'}}>{s2.label}</span>
              {t.height>1&&<span style={{color:'#aaa'}}> h{t.height}</span>}
              {i===card.targetPositionIdx&&<span style={{color:'#FFD600'}}> ⭐</span>}
            </span>;
          })}
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

// ══════════════════════════════════════════════════════════════════
//  ÉCRAN LOBBY
// ══════════════════════════════════════════════════════════════════

function LobbyScreen({ onCreateRoom, onJoinRoom }) {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('Entrez votre prénom'); return; }
    setLoading(true);
    await onCreateRoom(playerName.trim());
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) { setError('Entrez votre prénom'); return; }
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setError('Le code doit faire 6 caractères'); return; }
    setLoading(true);
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { setError(`Aucune partie avec le code "${code}"`); setLoading(false); return; }
      const data = snap.val();
      if (data.players?.[1]?.joined) { setError('Cette partie est déjà complète'); setLoading(false); return; }
      await onJoinRoom(code, playerName.trim());
    } catch(e) { setError('Erreur de connexion'); setLoading(false); }
  };

  const inputStyle = {
    background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',
    borderRadius:8,padding:'10px 14px',color:'#fff',fontSize:14,
    fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif",outline:'none',width:'100%',boxSizing:'border-box',
  };

  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,padding:'40px 20px',maxWidth:420,margin:'0 auto',width:'100%'}}>
      <h1 style={{fontSize:36,fontWeight:900,letterSpacing:8,color:'#FFCC80',textShadow:'0 2px 12px rgba(0,0,0,.6)',margin:0}}>HARMONIES</h1>
      <p style={{color:'#a1887f',fontSize:13,textAlign:'center',margin:0}}>Jeu de société — 2 joueurs en ligne</p>

      <div style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:24,width:'100%',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{color:'#FFCC80',fontWeight:'bold',fontSize:13,marginBottom:2}}>Votre prénom</div>
        <input value={playerName} onChange={e=>setPlayerName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleCreate()}
          placeholder="Ex: Nestor" style={inputStyle}/>

        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:14,display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
          <button onClick={handleCreate} disabled={loading}
            style={{...btnStyle('#4a2c1a','#6d4c41','#FFCC80',true),opacity:loading?.6:1}}>
            {loading?'…':'✨ Créer une nouvelle partie'}
          </button>

          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>
            <span style={{color:'#6d4c41',fontSize:11}}>ou rejoindre</span>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.1)'}}/>
          </div>

          <div style={{display:'flex',gap:8}}>
            <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==='Enter'&&handleJoin()}
              placeholder="CODE" maxLength={6}
              style={{...inputStyle,width:'auto',flex:1,letterSpacing:4,textAlign:'center',fontWeight:'bold',fontSize:18}}/>
            <button onClick={handleJoin} disabled={loading}
              style={{...btnStyle('#1a3a4a','#1e6091','#90CAF9',true),whiteSpace:'nowrap',opacity:loading?.6:1}}>
              Rejoindre
            </button>
          </div>
        </div>

        {error&&<div style={{color:'#ef9a9a',fontSize:12,textAlign:'center',padding:'6px 12px',background:'rgba(200,0,0,.15)',borderRadius:8}}>{error}</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ÉCRAN D'ATTENTE
// ══════════════════════════════════════════════════════════════════

function WaitingScreen({ roomCode, playerName }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(roomCode); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,padding:'60px 20px',maxWidth:420,margin:'0 auto',textAlign:'center'}}>
      <h1 style={{fontSize:36,fontWeight:900,letterSpacing:8,color:'#FFCC80',margin:0}}>HARMONIES</h1>
      <div style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:28,width:'100%',display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
        <div style={{fontSize:14,color:'#bcaaa4'}}>Bonjour <b style={{color:'#FFCC80'}}>{playerName}</b> !<br/>Envoyez ce code à votre adversaire :</div>
        <div style={{fontSize:48,fontWeight:900,letterSpacing:12,color:'#FFD600',textShadow:'0 0 30px rgba(255,214,0,.4)'}}>{roomCode}</div>
        <button onClick={copy} style={btnStyle('#3a2a10','#5d4037','#FFCC80',true)}>
          {copied?'✓ Copié !':'📋 Copier le code'}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:10,color:'#6d4c41',fontSize:12}}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{width:14,height:14,border:'2px solid #6d4c41',borderTopColor:'#FFCC80',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
          En attente de l'adversaire…
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  APP PRINCIPALE
// ══════════════════════════════════════════════════════════════════

export default function App(){
  // ── État connexion ──
  const [screen, setScreen]         = useState('lobby'); // lobby | waiting | game
  const [roomCode, setRoomCode]     = useState('');
  const [myPlayerIdx, setMyPlayerIdx] = useState(null);  // 0 ou 1
  const [myName, setMyName]         = useState('');

  // ── État du jeu (source de vérité = Firebase) ──
  const [gs, setGs]                 = useState(null);
  const [cubeMode, setCubeMode]     = useState(null);
  const isWriting = useRef(false);  // évite les boucles d'écho

  // ── Abonnement Firebase : écoute les changements en temps réel ──
  useEffect(() => {
    if (!roomCode) return;
    const gameRef = ref(db, `rooms/${roomCode}/gameState`);
    const unsub = onValue(gameRef, snap => {
      if (isWriting.current) return; // ignore nos propres écritures
      const data = snap.val();
      if (data) setGs(fromFirebase(data));
    });
    return () => off(gameRef, 'value', unsub);
  }, [roomCode]);

  // ── Écriture vers Firebase (appelée après chaque action) ──
  const syncGame = useCallback(async (newGs) => {
    if (!roomCode) return;
    isWriting.current = true;
    await set(ref(db, `rooms/${roomCode}/gameState`), newGs);
    // On remet le flag à false après un court délai
    // (le temps que Firebase nous renvoie notre propre écriture)
    setTimeout(() => { isWriting.current = false; }, 300);
  }, [roomCode]);

  // ── Créer une partie ──
  const handleCreateRoom = useCallback(async (name) => {
    const code = genRoomCode();
    const initialGs = initGame([name, '?']);
    await set(ref(db, `rooms/${code}`), {
      createdAt: Date.now(),
      players: { 0: { name, joined: true } },
      gameState: initialGs,
    });
    setRoomCode(code); setMyPlayerIdx(0); setMyName(name); setGs(initialGs);
    setScreen('waiting');
  }, []);

  // ── Rejoindre une partie ──
  const handleJoinRoom = useCallback(async (code, name) => {
    const snap = await get(ref(db, `rooms/${code}/gameState`));
    const gameState = snap.val();
    const fixedGs = fromFirebase(gameState);
    const updatedGs = {
      ...fixedGs,
      players: fixedGs.players.map((p, i) => i === 1 ? { ...p, name } : p),
    };
    await set(ref(db, `rooms/${code}/players/1`), { name, joined: true });
    await set(ref(db, `rooms/${code}/gameState`), updatedGs);
    setRoomCode(code); setMyPlayerIdx(1); setMyName(name); setGs(updatedGs);
    setScreen('game');
  }, []);

  // ── Passer en mode jeu quand l'adversaire rejoint ──
  useEffect(() => {
    if (screen !== 'waiting' || !roomCode) return;
    const p1Ref = ref(db, `rooms/${roomCode}/players/1`);
    const unsub = onValue(p1Ref, snap => { if (snap.val()?.joined) setScreen('game'); });
    return () => off(p1Ref, 'value', unsub);
  }, [screen, roomCode]);

  // ── Helpers ──
  const isMyTurn = gs && gs.currentPlayer === myPlayerIdx && !gs.gameOver;
  const cp = gs?.players[gs?.currentPlayer];

  // ── Cases valides surlignées ──
  const validHexIds = useMemo(() => {
    if (!gs || !isMyTurn) return [];
    if (cubeMode) {
      const card = cp?.animalCards.find(c => c.id === cubeMode);
      if (!card) return [];
      const hexMap = {};
      cp.grid.forEach(h => { hexMap[h.id] = h; });
      return findValidTargets(card, hexMap);
    }
    if (gs.phase === 'place_tokens' && gs.selectedPendingIdx !== null) {
      const token = gs.pendingTokens[gs.selectedPendingIdx];
      if (!token) return [];
      return cp.grid.filter(h => !h.animalCube && canPlaceToken(h.stack, token)).map(h => h.id);
    }
    return [];
  }, [gs, isMyTurn, cubeMode, cp]);

  // ── Actions — chaque handler modifie l'état ET appelle syncGame ──

  const handleSlotClick = useCallback((idx) => {
    if (!isMyTurn || gs.phase !== 'select_slot') return;
    const tokens = gs.centralBoard[idx];
    if (!tokens?.length) return;
    const newGs = { ...gs,
      selectedSlot:idx, pendingTokens:[...tokens], selectedPendingIdx:null, phase:'place_tokens',
      turnStartSnapshot:{bag:[...gs.bag],centralBoard:gs.centralBoard.map(s=>[...s]),
        players:deepPlayers(gs.players),visibleCards:gs.visibleCards.map(c=>({...c})),cardDeck:gs.cardDeck.map(c=>({...c}))},
      log:[`Slot ${idx+1} sélectionné.`,...gs.log.slice(0,4)] };
    setGs(newGs); syncGame(newGs);
  }, [gs, isMyTurn, syncGame]);

  const handleSelectPending = useCallback((idx) => {
    if (!isMyTurn || gs.phase !== 'place_tokens') return;
    setCubeMode(null);
    const newGs = { ...gs, selectedPendingIdx: gs.selectedPendingIdx === idx ? null : idx };
    setGs(newGs); syncGame(newGs);
  }, [gs, isMyTurn, syncGame]);

  const handleHexClick = useCallback((hexId) => {
    if (!isMyTurn) return;

    // Mode cube animal
    if (cubeMode) {
      if (!validHexIds.includes(hexId)) return;
      const pi = gs.currentPlayer;
      const players = gs.players.map((p, i) => {
        if (i !== pi) return p;
        const card = p.animalCards.find(c => c.id === cubeMode);
        const grid = p.grid.map(h => h.id === hexId ? {...h, animalCube: card?.emoji ?? '🐾'} : h);
        let animalCards = p.animalCards.map(c => c.id !== cubeMode ? c : {...c, cubesPlaced: c.cubesPlaced+1});
        let completedCards = [...p.completedCards];
        const upd = animalCards.find(c => c.id === cubeMode);
        if (upd && upd.cubesPlaced >= upd.cubeCount) {
          completedCards = [...completedCards, upd];
          animalCards = animalCards.filter(c => c.id !== cubeMode);
        }
        return {...p, grid, animalCards, completedCards};
      });
      const newGs = {...gs, players, log:[`Cube ${cp.animalCards.find(c=>c.id===cubeMode)?.name??''} posé !`,...gs.log.slice(0,4)]};
      setCubeMode(null); setGs(newGs); syncGame(newGs); return;
    }

    // Mode placement jeton
    if (gs.phase !== 'place_tokens' || gs.selectedPendingIdx === null) return;
    if (!validHexIds.includes(hexId)) return;
    const tok = gs.pendingTokens[gs.selectedPendingIdx];
    const pi = gs.currentPlayer;
    const players = gs.players.map((p,i) => i!==pi ? p
      : {...p, grid: p.grid.map(h => h.id===hexId ? {...h, stack:[...h.stack, tok]} : h)});
    const newPending = gs.pendingTokens.filter((_,i) => i !== gs.selectedPendingIdx);

    if (newPending.length > 0) {
      const newGs = {...gs, players, pendingTokens:newPending, selectedPendingIdx:null,
        log:[`${TOKEN_STYLES[tok].label} posé — ${newPending.length} restant(s).`,...gs.log.slice(0,4)]};
      setGs(newGs); syncGame(newGs); return;
    }

    let newBag = [...gs.bag];
    const newBoard = gs.centralBoard.map((slot,i) => i!==gs.selectedSlot ? slot : newBag.splice(0,3));
    let vc=[...gs.visibleCards], cd=[...gs.cardDeck];
    while(vc.length<5&&cd.length>0) vc.push(cd.shift());
    
    const newGs = {...gs, players, bag:newBag, centralBoard:newBoard, visibleCards:vc, cardDeck:cd,
      selectedSlot:null, pendingTokens:[], selectedPendingIdx:null,
      phase:'optional', gameOver: false,
      log:['Jetons placés — actions optionnelles.',...gs.log.slice(0,4)]};
    setGs(newGs); syncGame(newGs);
  }, [gs, isMyTurn, cubeMode, validHexIds, cp, syncGame]);

  const handleTakeCard = useCallback((idx) => {
    if (!isMyTurn || gs.phase!=='optional' || cp.animalCards.length>=4 || gs.hasTakenCardThisTurn) return;
    const card = gs.visibleCards[idx]; if (!card) return;
    const pi = gs.currentPlayer;
    const players = gs.players.map((p,i) => i!==pi ? p : {...p, animalCards:[...p.animalCards,{...card}]});
    const vc=[...gs.visibleCards]; let cd=[...gs.cardDeck];
    if(cd.length>0) vc[idx]=cd.shift(); else vc.splice(idx,1);
    const newGs = {...gs, players, visibleCards:vc, cardDeck:cd, hasTakenCardThisTurn:true,
      log:[`Carte ${card.name} prise !`,...gs.log.slice(0,4)]};
    setGs(newGs); syncGame(newGs);
  }, [gs, isMyTurn, cp, syncGame]);

  const handleRestartTurn = useCallback(() => {
    if (!isMyTurn || !gs.turnStartSnapshot) return;
    const snap = gs.turnStartSnapshot;
    setCubeMode(null);
    const newGs = {...gs, bag:snap.bag, centralBoard:snap.centralBoard, players:snap.players,
      visibleCards:snap.visibleCards, cardDeck:snap.cardDeck,
      phase:'select_slot', selectedSlot:null, pendingTokens:[], selectedPendingIdx:null, turnStartSnapshot:null,
      hasTakenCardThisTurn: false,
      log:['↺ Tour annulé — rechoisissez un emplacement.',...gs.log.slice(0,4)]};
    setGs(newGs); syncGame(newGs);
  }, [gs, isMyTurn, syncGame]);

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn || gs.phase !== 'optional') return;
    setCubeMode(null);

    const pi = gs.currentPlayer;
    const empty = gs.players[pi].grid.filter(h => h.stack.length === 0 && !h.animalCube).length;
    const triggerEnd = empty <= 2 || gs.bag.length === 0;

    // Cas 1 : dernier tour en cours, joueur 1 termine -> fin de partie equitable
    if (gs.lastRound && pi === 1) {
      const newGs = {...gs, phase:'game_over', gameOver:true, lastRound:false,
        log:['FIN DE PARTIE ! Les deux joueurs ont joue le meme nombre de tours.', ...gs.log.slice(0,4)]};
      setGs(newGs); syncGame(newGs);
      return;
    }

    // Cas 2 : condition de fin declenchee ce tour
    if (triggerEnd) {
      if (pi === 0) {
        // Joueur 0 declenche la fin -> joueur 1 a droit a un dernier tour
        const next = 1;
        const newGs = {...gs, currentPlayer:next, phase:'select_slot',
          turn: gs.turn, turnStartSnapshot:null, hasTakenCardThisTurn:false,
          lastRound: true,
          log:[`Fin imminente ! Dernier tour de ${gs.players[next].name}.`,...gs.log.slice(0,4)]};
        setGs(newGs); syncGame(newGs);
      } else {
        // Joueur 1 declenche la fin -> les deux ont joue pareil, fin immediate
        const newGs = {...gs, phase:'game_over', gameOver:true,
          log:['FIN DE PARTIE !', ...gs.log.slice(0,4)]};
        setGs(newGs); syncGame(newGs);
      }
      return;
    }

    // Cas 3 : fin de tour normale
    const next = 1 - gs.currentPlayer;
    const newGs = {...gs, currentPlayer:next, phase:'select_slot',
      turn: gs.turn + (gs.currentPlayer===1?1:0), turnStartSnapshot:null, hasTakenCardThisTurn:false,
      log:[`Au tour de ${gs.players[next].name} - Choisissez un emplacement.`,...gs.log.slice(0,4)]};
    setGs(newGs); syncGame(newGs);
  }, [gs, isMyTurn, syncGame]);

  const handleNewGame = useCallback(() => {
    if (!roomCode) return;
    setCubeMode(null);
    const newGs = initGame(gs.players.map(p => p.name));
    setGs(newGs); syncGame(newGs);
  }, [gs, roomCode, syncGame]);

  const finalScores = useMemo(() => {
    if (!gs?.gameOver) return null;
    return gs.players.map(p => {
      const t = scoreGrid(p.grid);
      const av = [...p.animalCards,...p.completedCards].reduce((s,c)=>s+getCardScore(c),0);
      return {...t, animalVps:av, grand:t.total+av};
    });
  }, [gs?.gameOver, gs?.players]);

  // ════════════════════════════════════════════════════════════════
  //  RENDU
  // ════════════════════════════════════════════════════════════════

  const pageStyle = {
    minHeight:'100vh',
    background:'linear-gradient(155deg,#3e2723 0%,#5d4037 45%,#4a3728 100%)',
    display:'flex',flexDirection:'column',alignItems:'center',
    padding:'18px 12px 50px',
    fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif",
    userSelect:'none',
  };

  if (screen === 'lobby')   return <div style={pageStyle}><LobbyScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom}/></div>;
  if (screen === 'waiting') return <div style={pageStyle}><WaitingScreen roomCode={roomCode} playerName={myName}/></div>;
  if (!gs) return <div style={{...pageStyle,justifyContent:'center',fontSize:20,color:'#FFCC80'}}>Chargement…</div>;

  return(
    <div style={pageStyle}>
      <h1 style={{fontSize:34,fontWeight:900,letterSpacing:8,color:'#FFCC80',textShadow:'0 2px 12px rgba(0,0,0,.6)',margin:'0 0 2px'}}>HARMONIES</h1>

      {/* Barre de statut : tour + code de la room */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:10}}>
        <span style={{color:'#a1887f',fontSize:11,letterSpacing:2}}>Tour {gs.turn}</span>
        <span style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.08)',
          borderRadius:8,padding:'2px 10px',fontSize:11,color:'#FFD600',letterSpacing:4,fontWeight:'bold'}}>
          {roomCode}
        </span>
      </div>

      {/* Indicateur de tour — mis en évidence pour votre tour */}
      <div style={{
        background: isMyTurn ? 'rgba(255,214,0,.12)' : 'rgba(0,0,0,.28)',
        border: `1px solid ${isMyTurn ? 'rgba(255,214,0,.4)' : 'rgba(255,255,255,.1)'}`,
        borderRadius:10, padding:'7px 20px', marginBottom:14, maxWidth:640,
        textAlign:'center', fontSize:13,
        color: isMyTurn ? '#FFD600' : '#FFE0B2',
        fontWeight: isMyTurn ? 'bold' : 'normal',
      }}>
        {gs.gameOver
          ? '🏁 Fin de partie !'
          : gs.lastRound
            ? (isMyTurn ? `⚠️ Dernier tour ! ${gs.log[0]}` : `⚠️ Dernier tour de ${gs.players[gs.currentPlayer].name}…`)
            : isMyTurn
              ? `🎯 Votre tour — ${gs.log[0]}`
              : `⏳ Tour de ${gs.players[gs.currentPlayer].name}… ${gs.log[0]}`}
      </div>

      {/* PLATEAU CENTRAL */}
      {!gs.gameOver&&(
        <div style={{background:'rgba(0,0,0,.22)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:'12px 16px',marginBottom:14}}>
          <div style={{color:'#bcaaa4',fontSize:10,textAlign:'center',marginBottom:10,letterSpacing:3,textTransform:'uppercase'}}>Plateau Central</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
            {gs.centralBoard.map((tokens,i)=>{
              const canSel=isMyTurn&&gs.phase==='select_slot'&&tokens.length>0;
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
          {gs.pendingTokens.length>0&&(
            <div style={{marginTop:14,padding:'10px 14px',background:'rgba(255,255,255,.04)',borderRadius:12,border:'1px dashed rgba(255,255,255,.1)'}}>
              <div style={{color:'#bcaaa4',fontSize:10,letterSpacing:2,textAlign:'center',marginBottom:10,textTransform:'uppercase'}}>
                {isMyTurn ? 'Cliquez un jeton pour le sélectionner — ordre libre' : 'Placement en cours…'}
              </div>
              <div style={{display:'flex',gap:14,justifyContent:'center',alignItems:'flex-end'}}>
                {gs.pendingTokens.map((t,i)=>{
                  const sel=gs.selectedPendingIdx===i;
                  return(
                    <div key={i} onClick={()=>handleSelectPending(i)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,cursor:isMyTurn?'pointer':'default'}}>
                      <div style={{width:sel?36:28,height:sel?36:28,borderRadius:'50%',background:TOKEN_STYLES[t].bg,
                        border:`${sel?3:2}px solid ${sel?'#FFD600':TOKEN_STYLES[t].border}`,
                        boxShadow:sel?`0 0 12px ${TOKEN_STYLES[t].bg},0 0 0 2px #FFD600`:`0 2px 6px ${TOKEN_STYLES[t].shadow}88`,
                        transition:'all .15s'}}/>
                      <span style={{fontSize:9,color:sel?'#FFD600':'#888',fontWeight:sel?'bold':'normal'}}>
                        {sel?'▲ ACTIF':TOKEN_STYLES[t].label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {gs.selectedPendingIdx!==null&&isMyTurn&&(
                <div style={{textAlign:'center',fontSize:11,color:'#FFD600',marginTop:8}}>
                  Cliquez une case surlignée pour y poser le {TOKEN_STYLES[gs.pendingTokens[gs.selectedPendingIdx]]?.label}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOUTONS D'ACTION — uniquement pour le joueur actif */}
      {!gs.gameOver&&isMyTurn&&(
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',justifyContent:'center'}}>
          {gs.turnStartSnapshot&&(
            <button onClick={handleRestartTurn} style={btnStyle('#5a1010','#8b2020','#ff8a80')}>↺ Recommencer le tour</button>
          )}
          {cubeMode&&(
            <button onClick={()=>setCubeMode(null)} style={btnStyle('#2a1800','#4e3020','#bcaaa4')}>✕ Annuler cube</button>
          )}
          {gs.phase==='optional'&&(
            <button onClick={handleEndTurn} style={btnStyle('#5d4037','#795548','#FFCC80',true)}>Fin de tour →</button>
          )}
        </div>
      )}

      {cubeMode&&isMyTurn&&!gs.gameOver&&(
        <div style={{marginBottom:10,fontSize:12,color:'#FFD600',textAlign:'center'}}>
          {validHexIds.length>0
            ? `${validHexIds.length} emplacement(s) valide(s) — cliquez une case dorée`
            : '⚠️ Aucun motif réalisé sur votre plateau pour cette carte'}
        </div>
      )}

      {/* PLATEAUX JOUEURS */}
      <div style={{display:'flex',gap:28,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
        {gs.players.map((player,pi)=>{
          const isActive=pi===gs.currentPlayer&&!gs.gameOver;
          const isMe=pi===myPlayerIdx;
          return(
            <div key={pi} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
              <div style={{background:isActive?'#6d4c41':'#3e2723',border:`2px solid ${isActive?'#FFD600':'transparent'}`,
                borderRadius:20,padding:'4px 18px',fontWeight:'bold',letterSpacing:2,fontSize:12,textTransform:'uppercase',
                color:isActive?'#FFD600':'#a1887f',boxShadow:isActive?'0 0 18px rgba(255,214,0,.22)':'none'}}>
                {player.name}{isMe?' (vous)':''}{isActive&&' 🎯'}
              </div>

              <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center',maxWidth:380}}>
                {player.animalCards.map(card=>(
                  <AnimalCard key={card.id} card={card} isSelected={cubeMode===card.id}
                    onClick={isMe&&isActive&&gs.phase==='optional'?()=>setCubeMode(p=>p===card.id?null:card.id):undefined}/>
                ))}
                {player.completedCards.map((card,ci)=>(
                  <div key={'d'+card.id+ci} style={{width:88,minHeight:150,borderRadius:12,padding:'6px 4px 7px',
                    background:'rgba(0,50,0,.4)',border:'2px solid #388e3c',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:2,opacity:.7}}>
                    <div style={{fontSize:26,lineHeight:1}}>{card.emoji}</div>
                    <div style={{fontSize:9,color:'#fff',fontWeight:'bold',textAlign:'center'}}>{card.name}</div>
                    <div style={{fontSize:9,color:'#81c784'}}>✓ Complète</div>
                    <PatternHexSVG card={card}/>
                    <div style={{fontSize:11,color:'#FFD600',fontWeight:'bold'}}>{getCardScore(card)} PV</div>
                  </div>
                ))}
                {Array.from({length:Math.max(0,4-player.animalCards.length-player.completedCards.length)}).map((_,i)=>(
                  <div key={'e'+i} style={{width:88,height:150,borderRadius:12,background:'rgba(255,255,255,.02)',border:'2px dashed rgba(255,255,255,.06)'}}/>
                ))}
              </div>

              <div style={{position:'relative',width:BOARD_W,height:BOARD_H,
                background:'radial-gradient(circle at 45% 45%,#d2b48c 0%,#bc9d7a 100%)',
                borderRadius:45,border:`4px solid ${isActive?'#a68059':'#6d4a2a'}`,
                boxShadow:isActive?'0 0 0 3px rgba(255,214,0,.28),0 12px 40px rgba(0,0,0,.55)':'0 8px 28px rgba(0,0,0,.45)',
                opacity:gs.gameOver||!isActive?.8:1,transition:'all .28s'}}>
                {player.grid.map(hex=>(
                  <Hexagon key={hex.id} hex={hex}
                    isHighlighted={isMe&&isActive&&validHexIds.includes(hex.id)}
                    onClick={isMe&&isActive?()=>handleHexClick(hex.id):undefined}/>
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
          <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center'}}>
            {gs.visibleCards.map((card,i)=>{
              const canTake=isMyTurn&&gs.phase==='optional'&&cp.animalCards.length<4&&!gs.hasTakenCardThisTurn;
              return(
                <AnimalCard key={card.id+i} card={card}
                  showTakeHint={canTake}
                  dimmed={!canTake}
                  onClick={canTake?()=>handleTakeCard(i):undefined}/>
              );
            })}
          </div>
          {isMyTurn&&gs.phase==='optional'&&gs.hasTakenCardThisTurn&&(
            <div style={{textAlign:'center',fontSize:11,color:'#a1887f',marginTop:8}}>
              ✓ Vous avez déjà pris une carte ce tour
            </div>
          )}
        </div>
      )}

      {/* LÉGENDE */}
      <div style={{marginTop:18,display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
        {Object.entries(TOKEN_STYLES).filter(([t])=>t!=='BROWN').map(([t,s])=>(
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
                  <span>🏠 Maisons: <b style={{color:'#fff'}}>{s.buildings}</b></span>
                  <span>💧 Rivière: <b style={{color:'#fff'}}>{s.river}</b></span>
                  <span>🐾 Animaux: <b style={{color:'#fff'}}>{s.animalVps}</b></span>
                </div>
              </div>
            );
          })}
          {(()=>{
            const mx=Math.max(...finalScores.map(s=>s.grand));
            const ws=gs.players.filter((_,i)=>finalScores[i].grand===mx);
            return<div style={{textAlign:'center',color:'#FFCC80',fontWeight:'bold',fontSize:17,margin:'8px 0'}}>
              {ws.length>1?'🤝 Égalité !':'🏆 '+ws[0].name+' remporte la partie !'}</div>;
          })()}
          <button onClick={handleNewGame}
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
