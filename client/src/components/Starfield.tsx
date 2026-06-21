import { useEffect, useRef } from "react";

interface StarfieldProps {
  animated?: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
}

export default function Starfield({ animated = true }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars: Star[] = [];
    let animationId = 0;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initStars = () => {
      stars.length = 0;
      const density = animated ? 8000 : 12000;
      const count = Math.max(40, Math.floor((canvas.width * canvas.height) / density));

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.4,
          opacity: Math.random() * 0.35 + 0.15,
          twinkleSpeed: Math.random() * 0.015 + 0.004,
          twinkleOffset: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * 0.08,
          driftY: (Math.random() - 0.5) * 0.04,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      for (const star of stars) {
        if (animated) {
          star.x += star.driftX;
          star.y += star.driftY;
          if (star.x < 0) star.x = canvas.width;
          if (star.x > canvas.width) star.x = 0;
          if (star.y < 0) star.y = canvas.height;
          if (star.y > canvas.height) star.y = 0;
        }

        const twinkle = animated
          ? star.opacity * (0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset))
          : star.opacity;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 232, 255, ${twinkle})`;
        ctx.fill();
      }

      if (animated) {
        animationId = requestAnimationFrame(draw);
      }
    };

    const handleResize = () => {
      resize();
      initStars();
      if (!animated) draw();
    };

    resize();
    initStars();
    draw();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [animated]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
