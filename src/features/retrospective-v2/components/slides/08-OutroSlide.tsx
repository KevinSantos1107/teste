export function OutroSlide({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="flex-1 bg-[#09090b] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
      {/* Confetti Background */}
      <div className="absolute inset-0 pointer-events-none">
         {Array.from({length: 40}).map((_, i) => (
           <div 
             key={i} 
             className="retro-v2-particle absolute" 
             style={{
               width: `${Math.random() * 6 + 4}px`,
               height: `${Math.random() * 12 + 6}px`,
               backgroundColor: ['#f43f5e', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)],
               left: `${Math.random() * 100}%`,
               animation: `retro-v2-fall ${Math.random() * 3 + 2}s linear infinite`,
               animationDelay: `${Math.random() * 5}s`
             }}
           />
         ))}
      </div>

      <div className="z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
        <h2 className="text-white text-5xl font-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
          Feliz<br/>Aniversário!
        </h2>
        
        <p className="text-white/80 font-medium mb-8">
          Obrigado por cada momento incrível. Essa é só uma parte da nossa história.
        </p>

        <button 
          onClick={onReplay} 
          className="w-full py-4 bg-white text-black font-bold rounded-full uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
        >
          Assistir Novamente
        </button>
      </div>
    </div>
  );
}
