import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      if (!isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 135; // Un poco mayor que el radio del disco (130px)

      const avg = dataArray.reduce((src, next) => src + next, 0) / bufferLength;
      const glowSize = 150 + avg * 0.5;
      const dynamicColor = getComputedStyle(document.documentElement).getPropertyValue('--dynamic-color').trim() || '#a3a6ff';
      
      ctx.save();
      const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, glowSize);
      gradient.addColorStop(0, dynamicColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.globalAlpha = 0.2; // Opacidad controlada
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();


      // El aura ya se dibuja arriba. Hemos eliminado las barras del espectro por petición del usuario.
    };


    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      style={{ 
        position: 'absolute', 
        zIndex: 0,
        pointerEvents: 'none'
      }} 
    />
  );
};
