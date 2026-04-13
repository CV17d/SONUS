import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Shuffle, List, Repeat, Repeat1, Mic2, Zap, Maximize2 } from 'lucide-react';
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
  isZenMode: boolean;
  onToggleZen: () => void;
  eqBands: number[];
  isMini?: boolean;
  isMobile?: boolean;
  onViewList?: () => void;
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
  onToggleZen,
  eqBands,
  isMini,
  isMobile
}) => {
  const currentSong = songs[currentIndex] || null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
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

    // Crear filtros (EQ 5 bandas)
    const eqFrequencies = [60, 230, 910, 3600, 14000];
    const newFilters = eqFrequencies.map(freq => {
      const filter = context.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });

    // Conectar nodos en cadena: fuente -> filtro1 -> filtro2 ... -> analyser -> destino
    source.connect(newFilters[0]);
    for (let i = 0; i < newFilters.length - 1; i++) {
      newFilters[i].connect(newFilters[i + 1]);
    }
    newFilters[newFilters.length - 1].connect(analyserNode);
    analyserNode.connect(context.destination);

    setAudioContext(context);
    setAnalyser(analyserNode);
    setFilters(newFilters);
  }, [audioContext]);

  // Actualizar ganancias de filtros en tiempo real
  useEffect(() => {
    if (filters.length === eqBands.length) {
      eqBands.forEach((gain, i) => {
        if (filters[i].gain.value !== gain) {
          filters[i].gain.setTargetAtTime(gain, audioContext?.currentTime || 0, 0.1);
        }
      });
    }
  }, [eqBands, filters, audioContext]);

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
    <>
      <audio
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        crossOrigin="anonymous"
      />

      {isMini ? (
        <motion.div
          layoutId="player-base"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '110px',
            background: 'var(--surface-container-high)',
            boxShadow: '0 -20px 40px rgba(0,0,0,0.4)',
            borderTop: '1px solid var(--surface-container-highest)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            zIndex: 100,
            overflow: 'hidden'
          }}
          className="glass-panel"
        >
          {/* Progress Bar Top Edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary)'
              }}
            />
          </div>

          {/* Left: Song Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: 0 }}>
            <motion.div
              layoutId="player-cover-container"
              style={{ width: '64px', height: '64px', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--surface-bright)', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSong?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  {currentSong?.coverUrl ? (
                    <img src={currentSong.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music size={24} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <div style={{ minWidth: 0 }}>
              <motion.p
                layoutId="player-title"
                style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}
              >
                {currentSong?.title || 'Sonus'}
              </motion.p>
              <motion.p
                layoutId="player-artist"
                style={{ fontSize: '0.8rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, margin: '4px 0 0 0' }}
              >
                {currentSong?.artist || 'Premium'}
              </motion.p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <motion.div
            layoutId="player-center-controls"
            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '1.5rem' : '2rem', flex: 1, justifyContent: 'center' }}
          >
            <button className="btn-icon" onClick={onPrev}><SkipBack size={isMobile ? 24 : 28} /></button>
            <button
              onClick={togglePlay}
              className="btn-primary"
              style={{
                width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isPlaying ? '0 0 30px rgba(163, 166, 255, 0.4)' : '0 10px 20px rgba(0,0,0,0.2)',
                transform: isPlaying ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {isPlaying ? <Pause size={isMobile ? 24 : 28} fill="white" /> : <Play size={isMobile ? 24 : 28} fill="white" style={{ marginLeft: '4px' }} />}
            </button>
            <button className="btn-icon" onClick={onNext}><SkipForward size={isMobile ? 24 : 28} /></button>
          </motion.div>

          {/* Right: Extra Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: isMobile ? 0 : 1, justifyContent: 'flex-end' }}>
            {!isMobile && (
              <>
                <button
                  className="btn-icon"
                  onClick={onToggleShuffle}
                  style={{ color: isShuffle ? 'var(--secondary)' : 'var(--on-surface-variant)', opacity: isShuffle ? 1 : 0.4 }}
                  title="Modo Aleatorio"
                >
                  <Shuffle size={22} />
                </button>

                <button
                  className="btn-icon"
                  onClick={onToggleRepeat}
                  style={{ color: repeatMode !== 'none' ? 'var(--primary)' : 'var(--on-surface-variant)', opacity: repeatMode !== 'none' ? 1 : 0.4 }}
                  title="Modo Repetición"
                >
                  {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.7, margin: '0 0.5rem' }}>
                  <Volume2 size={24} />
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (audioRef.current) audioRef.current.volume = v;
                    }}
                    style={{ width: '140px', accentColor: 'var(--primary)', height: '6px' }}
                  />
                </div>
              </>
            )}

            {onViewList && (
              <button
                className="btn-icon"
                onClick={onViewList}
                style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', paddingLeft: isMobile ? '0' : '1.25rem', marginLeft: '0.5rem' }}
                title="Expandir Reproductor"
              >
                <Maximize2 size={isMobile ? 24 : 28} />
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          layoutId="player-base"
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: showLyrics ? '950px' : '500px',
            padding: showLyrics ? '2rem 3rem' : '2rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--surface-container-high)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
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
              onClick={() => setShowLyrics(!showLyrics)}
              style={{
                color: showLyrics ? 'var(--primary)' : 'var(--on-surface-variant)',
                opacity: showLyrics ? 1 : 0.4,
                filter: showLyrics ? 'drop-shadow(0 0 8px var(--primary))' : 'none'
              }}
              title="Modo Karaoke / Letras"
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

          <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: showLyrics ? 'space-between' : 'center',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem',
            position: 'relative',
            flexWrap: 'wrap'
          }}>
            <motion.div
              layoutId="player-cover-container"
              animate={{ x: (showLyrics && window.innerWidth > 900) ? -20 : 0 }}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
                margin: (showLyrics && window.innerWidth <= 900) ? '0 auto' : '0'
              }}
            >
              <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />

              {/* Capas de Aura Potente */}
              {isPlaying && [0.8, 1.2, 1.6].map((delay, index) => (
                <motion.div
                  key={`aura-${index}`}
                  className="aura-layer aura-potent"
                  style={{
                    width: isMobile ? 'min(220px, 40vh)' : 'min(280px, 45vh)',
                    height: isMobile ? 'min(220px, 40vh)' : 'min(280px, 45vh)',
                    animationDelay: `${delay}s`,
                    background: `radial-gradient(circle, var(--dynamic-color) 0%, transparent 70%)`,
                    boxShadow: `0 0 60px var(--dynamic-color)`,
                    opacity: 0.6
                  }}
                />
              ))}

              <motion.div
                animate={isPlaying ? { rotate: 360, scale: [1, 1.02, 1] } : { rotate: 0, scale: 1 }}
                transition={isPlaying ? { rotate: { repeat: Infinity, duration: 25, ease: "linear" }, scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } } : { duration: 0.5 }}
                style={{
                  width: isMobile ? 'min(220px, 40vh)' : 'min(280px, 45vh)',
                  height: isMobile ? 'min(220px, 40vh)' : 'min(280px, 45vh)',
                  borderRadius: '50%',
                  background: 'var(--surface-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 100px var(--dynamic-color)',
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
            </motion.div>

            {showLyrics && currentSong && (
              <div style={{ flex: 1, height: '450px', display: 'flex', alignItems: 'center' }}>
                <LyricsView
                  song={currentSong}
                  currentTime={currentTime}
                  onClose={() => setShowLyrics(false)}
                  variant="side"
                />
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem', width: '100%', zIndex: 1 }}>
            <motion.h2
              layoutId="player-title"
              key={currentSong?.id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                fontSize: 'min(2.5rem, 6vh)',
                fontWeight: 800,
                marginBottom: '0.25rem',
                letterSpacing: 'var(--letter-spacing-display)',
                fontFamily: 'var(--font-display)',
                color: 'var(--on-surface)'
              }}
            >
              {currentSong?.title || 'Sonus'}
            </motion.h2>
            <motion.p
              layoutId="player-artist"
              style={{
                color: 'var(--secondary)',
                fontSize: 'max(0.85rem, 1.5vh)',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                opacity: 0.9
              }}
            >
              {currentSong?.artist || 'Premium Experience'}
            </motion.p>
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
                  accentColor: 'var(--dynamic-color)',
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
                  background: 'linear-gradient(90deg, var(--dynamic-color), var(--secondary))',
                  borderRadius: '4px',
                  position: 'absolute',
                  top: 0,
                  boxShadow: '0 0 20px var(--dynamic-color)'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '1rem', fontWeight: 800, color: 'var(--on-surface)', opacity: 0.8 }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <motion.div
            layoutId="player-center-controls"
            style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', zIndex: 1 }}
          >
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
          </motion.div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.5, zIndex: 1 }}>
            <Volume2 size={22} />
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
              style={{ width: '160px', accentColor: 'var(--primary)', height: '6px' }}
            />
          </div>
        </motion.div>
      )}
    </>
  );
};
