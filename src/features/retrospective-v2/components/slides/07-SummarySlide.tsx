import { useRetroV2Store } from '../../store/useRetroV2Store';
import { useEffect, useState } from 'react';

function Counter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(target / 40) || 1;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count}</>;
}

export function SummarySlide() {
  const { totalPhotos, events } = useRetroV2Store();

  return (
    <div className="flex-1 bg-gradient-to-br from-orange-500 to-rose-600 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-white font-black text-4xl mb-12 uppercase tracking-tight drop-shadow-md">
        Nossa Conta
      </h2>

      <div className="flex flex-col gap-8 w-full max-w-xs">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl flex items-center justify-between">
          <div className="text-left">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Fotos Salvas</p>
            <p className="text-white text-5xl font-black"><Counter target={totalPhotos} /></p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl shadow-inner">
            📸
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl flex items-center justify-between">
          <div className="text-left">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Momentos</p>
            <p className="text-white text-5xl font-black"><Counter target={events.length} /></p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl shadow-inner">
            🌟
          </div>
        </div>
      </div>

      <p className="mt-12 text-white/80 font-medium text-lg">
        E o melhor ainda está por vir...
      </p>
    </div>
  );
}
