import { useState, useRef } from 'react';
import { useRetroV2Store } from '../../store/useRetroV2Store';

export function RouletteSlide() {
  const { config } = useRetroV2Store();
  const options = config.rouletteOptions || ['Jantar', 'Cinema', 'Viagem', 'Surpresa'];
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Generate colors for alternating slices (light blue and medium blue like the screenshot)
  const colors = ['#8b5cf6', '#a78bfa']; // Soft violets

  const spinWheel = () => {
    if (isSpinning) return;
    
    setWinner(null);
    setIsSpinning(true);
    
    // Calculate random extra rotation (between 3 and 6 full circles + random slice)
    const spins = Math.floor(Math.random() * 4) + 4; 
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (spins * 360) + randomDegree;
    
    setRotation(totalRotation);

    // Calculate winner
    setTimeout(() => {
      setIsSpinning(false);
      // Actual rotation modulo 360
      const finalDeg = totalRotation % 360;
      // We need to account for the pointer being at the top (270 degrees in CSS conic-gradient coordinates usually, or 0 depending on offset)
      // A conic gradient starts at top (0deg). 
      // Pointer is at the top. So the winning slice is 360 - finalDeg.
      const sliceSize = 360 / options.length;
      const normalizedDeg = (360 - finalDeg) % 360;
      const winningIndex = Math.floor(normalizedDeg / sliceSize);
      
      setWinner(options[winningIndex]);
    }, 5000); // 5 seconds match the CSS transition duration
  };

  return (
    <div className="flex-1 bg-[#09090b] flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
      {/* Falling Hearts Background Simulation */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         {Array.from({length: 15}).map((_, i) => (
           <div 
             key={i} 
             className="retro-v2-particle absolute bg-white" 
             style={{
               width: `${Math.random() * 8 + 4}px`,
               height: `${Math.random() * 8 + 4}px`,
               left: `${Math.random() * 100}%`,
               animation: `retro-v2-fall ${Math.random() * 3 + 2}s linear infinite`,
               animationDelay: `${Math.random() * 5}s`
             }}
           />
         ))}
      </div>

      <div className="z-10 text-center mb-10">
        <h2 className="text-white text-3xl font-bold mb-2">Onde Sair</h2>
        <p className="text-white/50 text-sm">Toque na roda para sortear o próximo date</p>
      </div>

      <div className="relative z-10 flex items-center justify-center w-full max-w-[300px] aspect-square">
        {/* Pointer */}
        <div className="absolute -top-4 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md" />

        {/* Wheel */}
        <div 
          ref={wheelRef}
          onClick={spinWheel}
          className="retro-v2-wheel w-full h-full cursor-pointer relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            // Create alternating conic gradient segments
            background: `conic-gradient(${options.map((_, i) => {
              const start = (i * 360) / options.length;
              const end = ((i + 1) * 360) / options.length;
              const color = colors[i % colors.length];
              return `${color} ${start}deg ${end}deg`;
            }).join(', ')})`
          }}
        >
          {/* Labels */}
          {options.map((opt, i) => {
            const angle = (i * 360) / options.length + (360 / options.length / 2);
            return (
              <div 
                key={i}
                className="absolute w-full h-full flex justify-center items-start pt-6 select-none"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span className="text-white font-bold text-sm tracking-widest uppercase drop-shadow-md" style={{ writingMode: 'vertical-rl' }}>
                  {opt}
                </span>
              </div>
            );
          })}
        </div>

        {/* Center dot */}
        <div className="absolute z-20 w-8 h-8 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none">
           <div className="w-3 h-3 bg-slate-900 rounded-full" />
        </div>
      </div>

      {/* Winner Popup */}
      <div className={`absolute z-30 transition-all duration-500 transform ${winner ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
        <div className="bg-[#1e1b4b] border border-indigo-500/30 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center">
          <h3 className="text-white text-3xl font-black mb-1">{winner}</h3>
          <p className="text-indigo-200 text-xs uppercase tracking-widest">Venceu! 🎉</p>
        </div>
      </div>

      <button 
        onClick={spinWheel}
        disabled={isSpinning}
        className="mt-12 px-8 py-4 bg-white text-black font-bold rounded-full text-sm uppercase tracking-wider transition-transform active:scale-95 disabled:opacity-50 z-10"
      >
        {isSpinning ? 'Sorteando...' : 'Girar Roleta'}
      </button>
    </div>
  );
}
