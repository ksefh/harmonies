import React, { useState } from 'react';

// --- CONFIGURATION PERSONNALISABLE ---
const BOARD_COLOR = "bg-[#d2b48c]"; 
const BOARD_BORDER = "border-[#a68059]"; 
const GRADIENT_START = "#d2b48c"; 
const GRADIENT_END = "#bc9d7a";   
const GAP = 3; // MODIFIE CECI pour ajuster l'espace entre les cases (en pixels)

const HARMONIES_LAYOUT = [
  { q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 }, { q: 0, r: 4 },
  { q: 1, r: 0 }, { q: 1, r: 1 }, { q: 1, r: 2 }, { q: 1, r: 3 },
  { q: 2, r: 0 }, { q: 2, r: 1 }, { q: 2, r: 2 }, { q: 2, r: 3 }, { q: 2, r: 4 },
  { q: 3, r: 0 }, { q: 3, r: 1 }, { q: 3, r: 2 }, { q: 3, r: 3 },
  { q: 4, r: 0 }, { q: 4, r: 1 }, { q: 4, r: 2 }, { q: 4, r: 3 }, { q: 4, r: 4 },
];

const TERRAINS = {
  EMPTY: { color: 'fill-[#e9dcc9]', stroke: '#dcc7a1', opacity: 0.6 },
  FOREST: { color: 'fill-[#2d5a27]', stroke: '#1a3a16', opacity: 1 },
  WATER: { color: 'fill-[#1e6091]', stroke: '#184e77', opacity: 1 },
  MOUNTAIN: { color: 'fill-[#5c5149]', stroke: '#3d3630', opacity: 1 },
};

const Hexagon = ({ q, r, type, onClick }) => {
  // Dimensions de base pour le ratio BGA
  const width = 62; 
  const height = 54; 
  
  // Placement mathématique (Flat-Topped)
  const x = q * (width * 0.75);
  const y = r * height + (q % 2 !== 0 ? height / 2 : 0);

  // Centrage dans le rectangle de 278x331
  const offsetLeft = (278.4 - (width * 4)) / 2;
  const offsetTop = (331.6 - (height * 5.2)) / 2;

  return (
    <div 
      onClick={onClick}
      className="absolute transition-transform cursor-pointer hover:scale-105 active:scale-95"
      style={{
        // On réduit la taille affichée par le GAP pour créer l'espace
        width: `${width - GAP}px`,
        height: `${height - GAP}px`,
        // On ajoute GAP/2 à la position pour que l'hexagone reste centré dans sa cellule
        left: `${x + offsetLeft + (GAP / 2)}px`, 
        top: `${y + offsetTop + (GAP / 2)}px`,
        filter: "drop-shadow(rgba(0, 0, 0, 0.4) 1px 3px 2px)", 
      }}
    >
      <svg viewBox="0 0 100 86.6" className="w-full h-full">
        <polygon
          points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3"
          className={`${TERRAINS[type].color} transition-colors duration-200`}
          style={{
            stroke: TERRAINS[type].stroke,
            strokeWidth: "6", // Augmenter l'épaisseur aide à l'arrondi
            strokeLinejoin: "round",
            paintOrder: "stroke",
            opacity: TERRAINS[type].opacity
          }}
        />
      </svg>
    </div>
  );
};

const PlayerBoard = ({ playerName, grid, onHexClick }) => (
  <div className="flex flex-col items-center">
    <div className="bg-[#5d4037] text-white px-6 py-1 rounded-full mb-4 font-bold shadow-md uppercase tracking-wider text-sm">
      {playerName}
    </div>
    
    <div className="flex gap-2 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-20 h-32 bg-black/5 border-2 border-dashed border-[#5d4037]/20 rounded-xl" />
      ))}
    </div>

    <div 
      className={`relative ${BOARD_COLOR} rounded-[45px] border-4 ${BOARD_BORDER} shadow-2xl`}
      style={{
        width: "278.4px",  //
        height: "331.6px", //
        backgroundImage: `radial-gradient(circle, ${GRADIENT_START} 0%, ${GRADIENT_END} 100%)`,
      }}
    >
      {grid.map((hex) => (
        <Hexagon key={hex.id} {...hex} onClick={() => onHexClick(hex.id)} />
      ))}
    </div>
  </div>
);

export default function App() {
  const createBoard = () => HARMONIES_LAYOUT.map(c => ({ ...c, id: `${c.q}-${c.r}`, type: 'EMPTY' }));
  const [p1, setP1] = useState(createBoard);
  const [p2, setP2] = useState(createBoard);

  const toggle = (id, setGrid) => {
    const types = Object.keys(TERRAINS);
    setGrid(prev => prev.map(h => h.id === id ? { ...h, type: types[(types.indexOf(h.type) + 1) % types.length] } : h));
  };

  return (
    <div className="min-h-screen bg-[#f3e5ab] flex flex-col items-center p-4 font-sans text-black">
      <h1 className="text-4xl font-serif font-black mb-10 text-[#5d4037] tracking-tight">HARMONIES</h1>
      <div className="flex flex-col xl:flex-row gap-16 justify-center w-full max-w-7xl">
        <PlayerBoard playerName="Nestor" grid={p1} onHexClick={(id) => toggle(id, setP1)} />
        <PlayerBoard playerName="Adversaire" grid={p2} onHexClick={(id) => toggle(id, setP2)} />
      </div>
    </div>
  );
}