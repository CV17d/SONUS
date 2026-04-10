import React from 'react';
import { Trash2, Music, Plus, GripVertical, ChevronLeft, Search } from 'lucide-react';
import { Reorder } from 'framer-motion';
import type { Song } from '../logic/doublyLinkedList';

interface PlaylistProps {
  songs: Song[];
  currentIndex: number;
  onSelectSong: (index: number) => void;
  onAddSong: (file: File) => void;
  onRemoveSong: (id: string) => void;
  onReorder: (newOrder: Song[]) => void;
  onBack: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ 
  songs, 
  currentIndex, 
  onSelectSong, 
  onAddSong, 
  onRemoveSong,
  onReorder,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        onAddSong(file);
      });
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '3rem', 
        width: '100%',
        maxWidth: '650px', 
        height: '80vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--surface-container-high)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3.5rem' }}>
        <button 
          onClick={onBack}
          className="btn-icon"
          style={{ 
            background: 'var(--surface-container-low)', 
            padding: '0.8rem', 
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary)'
          }}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-display)',
            letterSpacing: 'var(--letter-spacing-display)'
          }}>
            Playlist
          </h2>
          <p style={{ 
            fontSize: '0.7rem', 
            color: 'var(--on-surface-variant)', 
            fontWeight: 800, 
            opacity: 0.6, 
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: '0.25rem'
          }}>
            {songs.length} {songs.length === 1 ? 'Pista' : 'Pistas'} en tu colección
          </p>
        </div>
        
        <label 
          className="btn-primary" 
          style={{ 
            marginLeft: 'auto',
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 24px rgba(163, 166, 255, 0.3)'
          }}
          title="Añadir más música"
        >
          <Plus size={24} />
          <input type="file" accept="audio/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Buscador de Canciones */}
      <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
        <input 
          type="text"
          placeholder="Busca una pista..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--surface-container-low)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem 1.75rem 1.1rem 3.75rem',
            color: 'var(--on-surface)',
            fontSize: '0.95rem',
            fontWeight: 500,
            outline: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.3s ease'
          }}
          className="search-input"
        />
        <Search 
          size={20} 
          style={{ 
            position: 'absolute', 
            left: '1.5rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--on-surface-variant)',
            opacity: 0.4
          }} 
        />
      </div>

      {/* Lista Scrolleable con Zebra-layering y Reorder */}
      <Reorder.Group 
        axis="y" 
        values={filteredSongs} 
        onReorder={onReorder}
        style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          flex: 1, 
          overflowY: 'auto', 
          paddingRight: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {filteredSongs.length === 0 ? (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--on-surface-variant)',
            opacity: 0.3
          }}>
            <Music size={80} style={{ marginBottom: '2rem' }} />
            <p style={{ fontWeight: 800, letterSpacing: '3px', fontSize: '0.85rem' }}>{searchQuery ? 'SIN RESULTADOS' : 'PLAYLIST VACÍA'}</p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            // Buscamos el índice original para mantener la funcionalidad de onSelectSong
            const originalIndex = songs.findIndex(s => s.id === song.id);
            return (
              <Reorder.Item 
                key={song.id} 
                value={song}
                className="list-item-zebra"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '1.5rem',
                  cursor: 'grab',
                  position: 'relative',
                  transition: 'background 0.2s, transform 0.2s',
                  background: currentIndex === originalIndex ? 'var(--surface-container-highest)' : ''
                }}
                whileDrag={{ 
                  scale: 1.05, 
                  boxShadow: '0 25px 50px rgba(0,0,0,0.15)', 
                  zIndex: 10,
                  background: 'var(--surface-bright)' 
                }}
              >
                <div 
                  onClick={() => onSelectSong(originalIndex)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}
                >
                <div style={{ color: 'var(--on-surface-variant)', opacity: 0.2 }}>
                  <GripVertical size={18} />
                </div>

                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--surface-container-highest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {song.coverUrl ? (
                    <img src={song.coverUrl} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Music size={24} color="var(--on-surface-variant)" style={{ opacity: 0.4 }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: currentIndex === originalIndex ? 'white' : 'var(--on-surface)',
                    fontFamily: 'var(--font-display)'
                  }}>
                    {song.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--on-surface-variant)', 
                    fontWeight: 600,
                    opacity: 0.8
                  }}>
                    {song.artist}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', opacity: currentIndex === originalIndex ? 1 : 0.4 }}>
                 <button 
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSong(song.id);
                  }}
                  style={{ padding: '0.6rem' }}
                >
                  <Trash2 size={20} color="var(--error)" />
                </button>
              </div>
            </Reorder.Item>
            );
          })
        )}
      </Reorder.Group>
    </div>
  );
};
