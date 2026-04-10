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
}

export const LyricsView: React.FC<LyricsViewProps> = ({ song, currentTime, onClose }) => {
  const [lyrics, setLyrics] = useState<string | null>(song.lyrics || null);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [isLoading, setIsLoading] = useState(!song.lyrics);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLyrics = async () => {
      if (song.lyrics) {
        setLyrics(song.lyrics);
        // Intentar parsear si parecen sincronizadas
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

  // Auto-scroll a la línea activa
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--background)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'var(--theme-transition)'
      }}
    >
      <AuroraBackground />
      {/* Fondo Aurora Dinámico (mantenemos el anterior como base sólida si se desea) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, var(--primary), transparent 70%)`,
        opacity: 0.15,
        filter: 'blur(100px)',
        zIndex: 0
      }} />

      {/* Header */}
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

      {/* Contenido de Letras */}
      <div 
        ref={scrollContainerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '4rem 2rem 10rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          zIndex: 5,
          scrollPaddingTop: '20vh'
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '10vh' }}>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{ color: 'var(--primary)' }}
            >
              <Music size={48} />
            </motion.div>
            <p style={{ fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '2px' }}>BUSCANDO LETRAS...</p>
          </div>
        ) : !lyrics ? (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, opacity: 0.3, fontFamily: 'var(--font-display)' }}>No se encontraron letras</p>
          </div>
        ) : syncedLines.length > 0 ? (
          syncedLines.map((line, index) => (
            <div 
              key={index}
              ref={index === currentLineIndex ? activeLineRef : null}
              style={{
                fontSize: window.innerWidth < 768 ? '1.5rem' : '2.5rem',
                fontWeight: index === currentLineIndex ? 800 : 600,
                textAlign: 'center',
                color: index === currentLineIndex ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                opacity: index === currentLineIndex ? 1 : 0.4,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: index === currentLineIndex ? 'scale(1.1)' : 'scale(1)',
                fontFamily: 'var(--font-display)',
                maxWidth: '800px',
                padding: '0.5rem 0'
              }}
            >
              {line.text}
            </div>
          ))
        ) : (
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            textAlign: 'center', 
            fontSize: '1.75rem', 
            fontWeight: 600, 
            color: 'var(--on-surface)',
            opacity: 0.8,
            maxWidth: '800px',
            lineHeight: 1.6
          }}>
            {lyrics}
          </div>
        )}
      </div>

      {/* Footer Gradient Over */}
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
    </motion.div>
  );
};
