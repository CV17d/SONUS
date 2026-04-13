import React, { useEffect, useState, useRef } from 'react';
import { X, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchLyrics, parseLRC, type SyncedLine } from '../logic/lyricsService';
import type { Song } from '../logic/doublyLinkedList';

const AuroraBackground = () => (
  <div style={{
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    zIndex: 1,
    opacity: 0.4,
    pointerEvents: 'none'
  }}>
    <motion.div 
      animate={{
        x: [0, 100, -50, 0],
        y: [0, -100, 50, 0],
        scale: [1, 1.2, 0.8, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '50vw',
        height: '50vw',
        background: 'var(--tertiary)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        opacity: 0.6
      }}
    />
    <motion.div 
      animate={{
        x: [0, -120, 80, 0],
        y: [0, 150, -100, 0],
        scale: [1, 1.3, 0.9, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '60vw',
        height: '60vw',
        background: 'var(--primary)',
        filter: 'blur(150px)',
        borderRadius: '50%',
        opacity: 0.5
      }}
    />
    <motion.div 
      animate={{
        x: [0, 150, -150, 0],
        y: [0, 50, 150, 0],
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      style={{
        position: 'absolute',
        top: '40%',
        left: '30%',
        width: '40vw',
        height: '40vw',
        background: 'var(--secondary)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        opacity: 0.4
      }}
    />
  </div>
);

interface LyricsViewProps {
  song: Song;
  currentTime: number;
  onClose: () => void;
  variant?: 'fullscreen' | 'side';
}

export const LyricsView: React.FC<LyricsViewProps> = ({ 
  song, 
  currentTime, 
  onClose,
  variant = 'fullscreen'
}) => {
  const [lyrics, setLyrics] = useState<string | null>(song.lyrics || null);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [isLoading, setIsLoading] = useState(!song.lyrics);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLyrics = async () => {
      if (song.lyrics) {
        setLyrics(song.lyrics);
        if (song.lyrics.includes('[')) {
          setSyncedLines(parseLRC(song.lyrics));
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const data = await fetchLyrics(song.artist, song.title);
      if (data) {
        const bestLyrics = data.syncedLyrics || data.plainLyrics;
        setLyrics(bestLyrics);
        if (data.syncedLyrics) {
          setSyncedLines(parseLRC(data.syncedLyrics));
        }
      }
      setIsLoading(false);
    };

    loadLyrics();
  }, [song]);

  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime, syncedLines]);

  const currentLineIndex = syncedLines.findIndex((line, i) => {
    const nextLine = syncedLines[i + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  const isSide = variant === 'side';

  return (
    <motion.div 
      initial={{ opacity: 0, x: isSide ? 50 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isSide ? 50 : 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: isSide ? 'relative' : 'fixed',
        inset: isSide ? 'auto' : 0,
        backgroundColor: isSide ? 'transparent' : 'var(--background)',
        zIndex: isSide ? 10 : 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: isSide ? '400px' : '100%',
        height: isSide ? '450px' : '100%',
        transition: 'var(--theme-transition)',
        borderLeft: isSide ? '1px solid rgba(255,255,255,0.05)' : 'none'
      }}
    >
      {!isSide && <AuroraBackground />}
      
      {!isSide && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, var(--primary), transparent 70%)`,
          opacity: 0.15,
          filter: 'blur(100px)',
          zIndex: 0
        }} />
      )}

      {/* Header - Solo en modo Fullscreen */}
      {!isSide && (
        <div style={{ 
          padding: '2rem 3rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          zIndex: 10,
          background: 'linear-gradient(to bottom, var(--background), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
               {song.coverUrl ? (
                 <img src={song.coverUrl} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '100%', height: '100%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Music color="white" />
                 </div>
               )}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{song.title}</h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 600 }}>{song.artist}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ padding: '1rem' }}>
            <X size={32} />
          </button>
        </div>
      )}

      {/* Contenido de Letras */}
      <div 
        ref={scrollContainerRef}
        className="lyrics-scroll-container"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isSide ? '2rem 1.5rem' : '4rem 2rem 10rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSide ? 'flex-start' : 'center',
          gap: isSide ? '1.5rem' : '2rem',
          zIndex: 5,
          scrollPaddingTop: isSide ? '10vh' : '20vh',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', marginTop: isSide ? '2rem' : '10vh' }}>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{ color: 'var(--primary)' }}
            >
              <Music size={isSide ? 32 : 48} />
            </motion.div>
          </div>
        ) : !lyrics ? (
          <div style={{ textAlign: 'center', width: '100%', marginTop: isSide ? '2rem' : '10vh' }}>
            <p style={{ fontSize: isSide ? '1.2rem' : '2rem', fontWeight: 800, opacity: 0.3, fontFamily: 'var(--font-display)' }}>No se encontraron letras</p>
          </div>
        ) : syncedLines.length > 0 ? (
          syncedLines.map((line, index) => (
            <div 
              key={index}
              ref={index === currentLineIndex ? activeLineRef : null}
              style={{
                fontSize: isSide ? '1.35rem' : (window.innerWidth < 768 ? '1.5rem' : '2.5rem'),
                lineHeight: 1.3,
                fontWeight: index === currentLineIndex ? 800 : 700,
                textAlign: isSide ? 'left' : 'center',
                color: index === currentLineIndex ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                opacity: index === currentLineIndex ? 1 : 0.3,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: index === currentLineIndex ? 'scale(1.05)' : 'scale(1)',
                fontFamily: 'var(--font-display)',
                maxWidth: isSide ? '100%' : '800px',
                padding: '0.2rem 0',
                cursor: 'pointer'
              }}
            >
              {line.text}
            </div>
          ))
        ) : (
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            textAlign: isSide ? 'left' : 'center', 
            fontSize: isSide ? '1.1rem' : '1.75rem', 
            fontWeight: 600, 
            color: 'var(--on-surface)',
            opacity: 0.8,
            maxWidth: isSide ? '100%' : '800px',
            lineHeight: 1.6
          }}>
            {lyrics}
          </div>
        )}
      </div>

      {/* Footer Gradient Over - Solo en modo Fullscreen para no interferir con el diseño side */}
      {!isSide && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20vh',
          background: 'linear-gradient(to top, var(--background), transparent)',
          pointerEvents: 'none',
          zIndex: 10
        }} />
      )}
    </motion.div>
  );
};
