import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Shuffle, List, Repeat, Repeat1, Mic2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioVisualizer } from './AudioVisualizer';
import { LyricsView } from './LyricsView';
import type { Song } from '../logic/doublyLinkedList';
import type { RepeatMode } from '../App';

interface PlayerProps {
  songs: Song[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  onViewList: () => void;
  isZenMode: boolean;
  onToggleZen: () => void;
}

export const Player: React.FC<PlayerProps> = ({ 
  songs, 
  currentIndex, 
  onNext, 
  onPrev,
  isPlaying,
  setIsPlaying,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  onViewList,
  isZenMode,
  onToggleZen
}) => {
  const currentSong = songs[currentIndex] || null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Inicializar AudioContext en el primer Play
  const initializeAudio = useCallback(() => {
    if (audioContext || !audioRef.current) return;

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;

    const source = context.createMediaElementSource(audioRef.current);
    source.connect(analyserNode);
    analyserNode.connect(context.destination);

    setAudioContext(context);
    setAnalyser(analyserNode);
  }, [audioContext]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
        }
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentSong, isPlaying, audioContext]);

  // Análisis de Energía en Tiempo Real
  useEffect(() => {
    if (!analyser || !isPlaying) {
      document.documentElement.style.setProperty('--audio-energy', '1');
      return;
    }
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const updateEnergy = () => {
      if (!isPlaying) return;
      analyser.getByteFrequencyData(dataArray);
      const bassRange = dataArray.slice(0, 10);
      const avg = bassRange.reduce((a, b) => a + b, 0) / bassRange.length;
      const energyLevel = 1 + (avg / 255) * 0.5;
      document.documentElement.style.setProperty('--audio-energy', energyLevel.toString());
      animationId = requestAnimationFrame(updateEnergy);
    };

    updateEnergy();
    return () => {
      cancelAnimationFrame(animationId);
      document.documentElement.style.setProperty('--audio-energy', '1');
    };
  }, [analyser, isPlaying]);

  // Manejar Saltos de Tiempo (Shortcuts)
  useEffect(() => {
    const handleSkip = (e: any) => {
      if (audioRef.current && e.detail?.amount) {
        audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + e.detail.amount));
      }
    };
    window.addEventListener('sonus-skip', handleSkip);
    return () => window.removeEventListener('sonus-skip', handleSkip);
  }, []);

  // Handle loop mode directly in audio element for 'one'
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = (repeatMode === 'one');
    }
  }, [repeatMode]);

  const togglePlay = () => {
    initializeAudio();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setProgress((cur / dur) * 100 || 0);
      setCurrentTime(cur);
      setDuration(dur);

      // Lógica de Crossfade (Fade out)
      const fadeTime = 3; // Segundos de fundido
      if (dur > 0 && dur - cur <= fadeTime) {
        const volumeFactor = Math.max(0, (dur - cur) / fadeTime);
        audioRef.current.volume = volumeFactor * volume;
      } else if (cur < fadeTime) {
        const volumeFactor = Math.min(1, cur / 1);
        audioRef.current.volume = volumeFactor * volume;
      } else {
        audioRef.current.volume = volume;
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      setProgress(newProgress);
    }
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        width: '100%',
        maxWidth: '500px', 
        padding: '2rem 2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'var(--surface-container-high)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        position: 'absolute', 
        top: '1.5rem', 
        right: '2rem', 
        display: 'flex', 
        gap: '0.75rem',
        zIndex: 10
      }}>
        <button 
          className="btn-icon" 
          onClick={onToggleShuffle} 
          style={{ 
            color: isShuffle ? 'var(--secondary)' : 'var(--on-surface-variant)',
            opacity: isShuffle ? 1 : 0.4,
            filter: isShuffle ? 'drop-shadow(0 0 8px var(--secondary))' : 'none'
          }}
          title="Modo Aleatorio"
        >
          <Shuffle size={20} />
        </button>
        <button 
          className="btn-icon" 
          onClick={onToggleRepeat} 
          style={{ 
            color: repeatMode !== 'none' ? 'var(--primary)' : 'var(--on-surface-variant)',
            opacity: repeatMode !== 'none' ? 1 : 0.4,
            filter: repeatMode !== 'none' ? 'drop-shadow(0 0 8px var(--primary))' : 'none'
          }}
          title="Modo Repetición"
        >
          {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
        <button 
          className="btn-icon" 
          onClick={() => setShowLyrics(true)} 
          style={{ opacity: 0.4 }}
          title="Ver Letras"
        >
          <Mic2 size={20} />
        </button>
        <button 
          className="btn-icon" 
          onClick={onViewList}
          style={{ opacity: 0.4 }}
          title="Ver Lista de Canciones"
        >
          <List size={22} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSong?.id || 'empty'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--gradient-accent)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      </AnimatePresence>

      <audio 
        ref={audioRef} 
        src={currentSong?.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
      />

      <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />
        
        <motion.div 
          animate={isPlaying ? { rotate: 360, scale: [1, 1.02, 1] } : { rotate: 0, scale: 1 }}
          transition={isPlaying ? { rotate: { repeat: Infinity, duration: 25, ease: "linear" }, scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } } : { duration: 0.5 }}
          style={{ 
            width: 'min(280px, 45vh)', 
            height: 'min(280px, 45vh)', 
            borderRadius: '50%', 
            background: 'var(--surface-bright)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
            border: '6px solid var(--surface-container-highest)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSong?.id}
              initial={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(30px)' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ width: '100%', height: '100%' }}
            >
              {currentSong?.coverUrl ? (
                <img src={currentSong.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-main)', opacity: 0.8 }}>
                  <Music size={100} color="var(--on-surface)" style={{ opacity: 0.3 }} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div style={{ 
            position: 'absolute', 
            width: '24px', 
            height: '24px', 
            background: 'var(--background)', 
            borderRadius: '50%',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
            zIndex: 10
          }} />
        </motion.div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem', width: '100%', zIndex: 1 }}>
        <motion.h2 
          key={currentSong?.id}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ 
            fontSize: 'min(2.25rem, 6vh)', 
            fontWeight: 800, 
            marginBottom: '0.25rem',
            letterSpacing: 'var(--letter-spacing-display)',
            fontFamily: 'var(--font-display)',
            color: 'var(--on-surface)'
          }}
        >
          {currentSong?.title || 'Sonus'}
        </motion.h2>
        <p style={{ 
          color: 'var(--secondary)', 
          fontSize: '0.85rem', 
          fontWeight: 800, 
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: 0.9
        }}>
          {currentSong?.artist || 'Premium Experience'}
        </p>
      </div>

      <div style={{ width: '100%', marginBottom: '2rem', zIndex: 1 }}>
        <div style={{ position: 'relative', height: '8px' }}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={handleProgressChange}
            className="progress-slider"
            style={{ 
              width: '100%', 
              cursor: 'pointer',
              position: 'absolute',
              top: 0,
              accentColor: 'var(--secondary)',
              height: '8px',
              zIndex: 2,
              opacity: 0
            }} 
          />
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'absolute', top: 0 }} />
          <motion.div 
            style={{ 
              width: `${progress}%`, 
              height: '8px', 
              background: 'var(--gradient-accent)', 
              borderRadius: '4px',
              position: 'absolute',
              top: 0,
              boxShadow: '0 0 20px var(--secondary)'
            }} 
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', opacity: 0.6 }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', zIndex: 1 }}>
        <button className="btn-icon" onClick={onPrev} title="Anterior">
          <SkipBack size={28} />
        </button>
        
        <button 
          onClick={togglePlay}
          className="btn-primary"
          style={{ 
            width: '82px', 
            height: '82px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: isPlaying 
              ? '0 0 40px rgba(163, 166, 255, 0.4)' 
              : '0 20px 40px rgba(163, 166, 255, 0.2)',
            transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {isPlaying ? <Pause size={38} fill="white" /> : <Play size={38} fill="white" style={{ marginLeft: '4px' }} />}
        </button>

        <button className="btn-icon" onClick={onNext} title="Siguiente">
          <SkipForward size={28} />
        </button>

        <button 
          className={`btn-icon ${isZenMode ? 'active' : ''}`}
          onClick={onToggleZen}
          title="Modo Focus / Zen"
        >
          <Zap size={22} color={isZenMode ? 'var(--primary)' : 'currentColor'} />
        </button>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.3, zIndex: 1 }}>
        <Volume2 size={16} />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          style={{ width: '100px', accentColor: 'var(--primary)' }}
        />
      </div>
      <AnimatePresence>
        {showLyrics && currentSong && (
          <LyricsView 
            song={currentSong} 
            currentTime={currentTime} 
            onClose={() => setShowLyrics(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
