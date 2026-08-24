import { useSiteConfigStore } from '../../../../store/siteConfigStore';
import { useEffect, useState } from 'react';

export function TimeSlide() {
  const { config: siteConfig } = useSiteConfigStore();
  const [hours, setHours] = useState(0);

  // Colors for the repeating echo effect based on the screenshot
  const echoColors = [
    { bg: '#FF4281', text: '#111' }, // Pink
    { bg: '#FF7A00', text: '#111' }, // Orange
    { bg: '#7000FF', text: '#E5D813' }, // Purple with yellow text
    { bg: '#FF7A00', text: '#111' }, // Orange
    { bg: '#FF4281', text: '#111' }, // Pink
  ];

  useEffect(() => {
    // Calculate hours together
    const startStr = siteConfig?.relationship?.startDate;
    const startMs = startStr
      ? new Date(startStr).getTime()
      : new Date('2025-10-27T00:00:00').getTime();
    const diffHours = Math.floor((Date.now() - startMs) / (1000 * 60 * 60));
    const targetHours = isNaN(diffHours) || diffHours < 0 ? 0 : diffHours;

    if (targetHours === 0) {
      setHours(0);
      return;
    }

    // Simple number animation
    let current = 0;
    const step = Math.max(Math.ceil(targetHours / 50), 1);
    const interval = setInterval(() => {
      current += step;
      if (current >= targetHours) {
        setHours(targetHours);
        clearInterval(interval);
      } else {
        setHours(current);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [siteConfig?.relationship?.startDate]);

  const formattedNumber = new Intl.NumberFormat('en-US').format(hours);

  return (
    <div className="flex-1 bg-[#121212] flex flex-col items-stretch justify-center relative overflow-hidden">
      {/* Background Echoes */}
      <div className="absolute inset-0 flex flex-col">
        {echoColors.map((color, i) => (
          <div
            key={i}
            className="flex-1 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: color.bg }}
          >
            <span
              className="font-black text-center whitespace-nowrap opacity-90"
              style={{
                fontSize: 'clamp(4rem, 25vw, 12rem)',
                lineHeight: 1,
                color: color.text,
                letterSpacing: '-0.05em',
                transform: 'scaleY(1.2)', // Stretch effect like in the screenshot
              }}
            >
              {formattedNumber}
            </span>
          </div>
        ))}
      </div>

      {/* Main Overlay (similar to the second screenshot of the hours) */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none bg-black/60">
        <span className="text-white/80 text-sm md:text-lg font-medium mb-2 tracking-widest uppercase">
          Horas Juntos
        </span>
        <span
          className="text-white font-black drop-shadow-2xl"
          style={{ fontSize: 'clamp(4rem, 18vw, 10rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
        >
          {formattedNumber}
        </span>
        <span className="text-white/60 text-xs md:text-sm mt-6 flex items-center gap-2">
          14% dos casais no mundo <span>✨</span>
        </span>
      </div>
    </div>
  );
}
