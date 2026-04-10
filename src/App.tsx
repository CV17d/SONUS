import { useState, useEffect, useCallback } from 'react';
import { usePlaylistsManager } from './logic/usePlaylistsManager';
import { usePlaylist } from './logic/usePlaylist';
import { Player } from './components/Player';
import { Playlist } from './components/Playlist';
import { Sidebar } from './components/Sidebar';
import { EditPlaylistModal } from './components/EditPlaylistModal';
import { Loader2, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { extractMetadata } from './logic/metadata';
import { fetchCoverArt } from './logic/coverService';
import { getDominantColor } from './logic/colorExtractor';
import { ThemeToggle } from './components/ThemeToggle';
import type { Song } from './logic/doublyLinkedList';
import type { PlaylistMetadata } from './logic/storage';

type ViewMode = 'player' | 'list';
export type RepeatMode = 'none' | 'one' | 'all';

function App() {
  const { 
    playlists, 
    activePlaylistId, 
    setActivePlaylistId, 
    createPlaylist, 
    updatePlaylist, 
    deletePlaylist,
    isLoadingManager 
  } = usePlaylistsManager();

  const { 
    songs, 
    addAtEnd, 
    removeSong,
    reorderSongs
  } = usePlaylist(activePlaylistId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistMetadata | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [viewMode, setViewMode] = useState<ViewMode>('player');
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('sonus-theme') as 'light' | 'dark') || 'light');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('sonus-theme', theme);
  }, [theme]);

  // Logic

  const handleNext = useCallback(() => {
    if (songs.length === 0) return;

    if (repeatMode === 'one') {
      // Re-trigger current index to restart song
      const sameIndex = currentIndex;
      setCurrentIndex(-1); // Trick to force update if needed, better just let Player handle it but we do it here too
      setTimeout(() => setCurrentIndex(sameIndex), 0);
      return;
    }

    if (isShuffle && songs.length > 1) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * songs.length);
      } while (nextIndex === currentIndex);
      setCurrentIndex(nextIndex);
    } else {
      if (currentIndex === songs.length - 1) {
        if (repeatMode === 'all') {
          setCurrentIndex(0);
        }
        // else stop or stay at last
      } else {
        setCurrentIndex((prev) => (prev + 1) % songs.length);
      }
    }
  }, [songs.length, isShuffle, currentIndex, repeatMode]);

  const handlePrev = useCallback(() => {
    if (songs.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
  }, [songs.length]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si se está escribiendo en un input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowRight':
          window.dispatchEvent(new CustomEvent('sonus-skip', { detail: { amount: 10 } }));
          break;
        case 'ArrowLeft':
          window.dispatchEvent(new CustomEvent('sonus-skip', { detail: { amount: -10 } }));
          break;
        case 'KeyZ':
          setIsZenMode(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // --- EXPERIENCIA VISUAL PREMIUM (Autocover & Dynamic BG) ---
  useEffect(() => {
    const song = songs[currentIndex];
    if (!song) return;

    const processVisuals = async () => {
      let coverUrl = song.coverUrl;


      // 1. Si no tiene carátula, buscarla en iTunes
      if (!coverUrl || coverUrl.includes('blob:')) {
        // Solo buscamos si no tenemos una carátula real o si es un blob genérico 
        // (music-metadata suele devolver blobs si los encuentra, pero si no hay, buscamos fuera)
        if (!song.coverBlob) {
           const externalCover = await fetchCoverArt(song.artist, song.title);
           if (externalCover) {
             coverUrl = externalCover;
             // Actualizar el objeto song localmente para esta sesión
             song.coverUrl = externalCover;
           }
        }
      }

      // 2. Extraer color y aplicar fondo dinámico
      if (coverUrl) {
        const color = await getDominantColor(coverUrl);
        if (color) {
          document.documentElement.style.setProperty('--dynamic-color', color);
          document.documentElement.style.setProperty('--primary', color);
          // Actualizar gradientes globales
          document.documentElement.style.setProperty('--gradient-main', `linear-gradient(135deg, ${color}, var(--secondary))`);
        }
      } else {
        // Fallback
        document.documentElement.style.setProperty('--dynamic-color', 'var(--primary)');
      }
    };

    processVisuals();
  }, [currentIndex, songs]);


  const handleSelectSong = (index: number) => {
    setCurrentIndex(index);
    setViewMode('player'); 
  };

  const handleAddSong = async (file: File) => {
    const meta = await extractMetadata(file);
    
    const newSong: Song = {
      id: Math.random().toString(36).substring(2, 9),
      title: meta.title || file.name.replace(/\.[^/.]+$/, ""),
      artist: meta.artist || 'Artista Local',
      album: meta.album,
      duration: meta.duration || 0,
      blob: file,
      coverBlob: meta.coverBlob,
      url: URL.createObjectURL(file),
      coverUrl: meta.coverUrl
    };

    addAtEnd(newSong);
    if (songs.length === 0) setCurrentIndex(0);
  };

  const handleRemove = (id: string) => {
    const indexToRemove = songs.findIndex(s => s.id === id);
    removeSong(id);
    if (indexToRemove <= currentIndex && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleCreatePlaylist = () => {
    createPlaylist('Nueva Playlist');
  };

  if (isLoadingManager) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div 
      className={isZenMode ? 'zen-active' : ''} 
      style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* Botón Flotante para Sidebar (Mobile / Zen Toggle) */}
      {!isZenMode && isMobile && !isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '1.5rem',
            zIndex: 80,
            background: 'var(--surface-container-high)',
            border: 'none',
            color: 'white',
            padding: '0.8rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* FONDO DINÁMICO ULTRA-PREMIUM */}
      <div className="dynamic-bg-container">
        <motion.div 
          className="dynamic-bg-blob"
          animate={{
            scale: isPlaying ? [1, 1.2, 1] : 1,
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 60, repeat: Infinity, ease: "linear" }
          }}
        />
      </div>

      {!isZenMode && (
        <Sidebar 
          playlists={playlists}
          activeId={activePlaylistId}
          onSelect={(id) => {
            setActivePlaylistId(id);
            setCurrentIndex(0);
            setViewMode('list'); 
          }}
          onCreate={handleCreatePlaylist}
          onEdit={(p) => setEditingPlaylist(p)}
          onDelete={deletePlaylist}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: isMobile ? '5rem 1rem 2rem' : '1.5rem 3rem',
        margin: '0',
        overflowY: 'auto',
        width: '100%',
        height: '100vh',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: isMobile ? '1.5rem' : '3rem',
          zIndex: 100
        }}>
          <ThemeToggle theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
        </div>

        <header style={{ 
          textAlign: 'center', 
          marginBottom: '1rem',
          opacity: viewMode === 'player' ? 1 : 0.2,
          transition: 'opacity 0.5s'
        }}>
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : '3.5rem', 
            fontWeight: 800, 
            letterSpacing: '-3px',
            background: 'var(--gradient-main)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem'
          }}>
            SONUS
          </h1>
        </header>

        <main style={{ 
          flex: 1,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <AnimatePresence mode="wait">
            {viewMode === 'player' ? (
              <motion.div 
                key="player-view"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <Player 
                  songs={songs}
                  currentIndex={currentIndex}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  repeatMode={repeatMode}
                  onToggleRepeat={() => setRepeatMode(prev => 
                    prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
                  )}
                  isShuffle={isShuffle}
                  onToggleShuffle={() => setIsShuffle(!isShuffle)}
                  onViewList={() => setViewMode('list')}
                  isZenMode={isZenMode}
                  onToggleZen={() => setIsZenMode(!isZenMode)}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="list-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <Playlist 
                  songs={songs}
                  currentIndex={currentIndex}
                  onSelectSong={handleSelectSong}
                  onAddSong={handleAddSong}
                  onRemoveSong={handleRemove}
                  onReorder={reorderSongs}
                  onBack={() => setViewMode('player')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {editingPlaylist && (
        <EditPlaylistModal 
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onSave={updatePlaylist}
        />
      )}
    </div>
  );
}

export default App;
