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

      // Dibujar resplandor sutil detrás
      const avg = dataArray.reduce((src, next) => src + next, 0) / bufferLength;
      const glowSize = 150 + avg * 0.5;

      const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, glowSize);
      gradient.addColorStop(0, 'rgba(163, 166, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(83, 221, 252, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Dibujar barras circulares (espectro)
      const barCount = 60;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * 2]; // Tomar muestras
        const angle = (i / barCount) * Math.PI * 2;
        
        const barHeight = (value / 255) * 40;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `rgba(83, 221, 252, ${0.4 + (value / 255) * 0.6})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
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
