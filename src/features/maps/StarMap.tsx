import { useEffect, useRef } from 'react';
import { Card, CardContent } from '../../shared/ui/Card';
import { useSiteConfigStore } from '../../store/siteConfigStore';

export function StarMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config } = useSiteConfigStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: any[] = [];

    const resize = () => {
      // Usa o tamanho do container pai (CardContent tem um aspect ratio, vamos pegar clientWidth)
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 400; // Fixed height for visual consistency
      }
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = window.innerWidth < 768 ? 150 : 300;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          alpha: Math.random(),
          velocity: (Math.random() * 0.02) + 0.005,
          color: Math.random() > 0.8 ? '#fbd38d' : Math.random() > 0.5 ? '#90cdf4' : '#ffffff'
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background gradient (Night sky)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a2a');
      gradient.addColorStop(1, '#1a1a3a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.floor(star.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Twinkle effect
        star.alpha += star.velocity;
        if (star.alpha <= 0 || star.alpha >= 1) {
          star.velocity = -star.velocity;
        }
      });

      // Draw Constellation lines (fake for visual appeal)
      if (stars.length > 50) {
        ctx.beginPath();
        ctx.moveTo(stars[0].x, stars[0].y);
        for(let i = 1; i < 7; i++) {
           ctx.lineTo(stars[i].x, stars[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden bg-theme-bg shadow-xl border-theme-primary/20">
      <CardContent className="p-0 relative">
        <canvas ref={canvasRef} className="w-full h-[400px] block" />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
          <h3 className="text-white text-xl font-serif font-bold mb-1">Como estava o céu</h3>
          <p className="text-white/80 text-sm">Em {config?.relationship.startDate}</p>
        </div>
      </CardContent>
    </Card>
  );
}
