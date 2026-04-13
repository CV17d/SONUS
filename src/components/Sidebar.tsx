import React from 'react';
import { Plus, Edit3, Music, Trash2, X, Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaylistMetadata } from '../logic/storage';

interface SidebarProps {
  playlists: PlaylistMetadata[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (playlist: PlaylistMetadata) => void;
  onDelete: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenEq: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  playlists, 
  activeId, 
  onSelect, 
  onCreate, 
  onEdit,
  onDelete,
  isOpen = true,
  onClose,
  onOpenEq
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <motion.aside 
      initial={isMobile ? { x: -300 } : { x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={isMobile ? { x: -300 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-panel" 
      style={{ 
        width: '360px', 
        height: isMobile ? '100vh' : 'calc(100vh - 4rem)', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        margin: isMobile ? 0 : '2rem 0 2rem 2rem',
        boxShadow: isMobile ? '20px 0 50px rgba(0,0,0,0.15)' : '0 8px 32px rgba(0,0,0,0.1)',
        borderRadius: isMobile ? 0 : 'var(--radius-lg)',
        zIndex: 100,
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
        <img src="/favicon.svg" alt="Sonus" style={{ width: '36px', height: '36px' }} />
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 800, 
          letterSpacing: '-3px',
          background: 'var(--gradient-main)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          SONUS
        </h1>
      </div>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <input 
          type="text"
          placeholder="Busca en tu música..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--surface-container-low)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem 0.85rem 2.75rem',
            color: 'var(--on-surface)',
            fontSize: '1rem',
            fontWeight: 500,
            outline: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.3s ease'
          }}
          className="search-input"
        />
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '0.85rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--on-surface-variant)',
            opacity: 0.5
          }} 
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ 
          fontSize: '0.85rem', 
          fontWeight: 800, 
          letterSpacing: '0.2em', 
          color: 'var(--on-surface-variant)',
          fontFamily: 'var(--font-display)',
          textTransform: 'uppercase',
          opacity: 0.8
        }}>
          BIBLIOTECA PERSONAL
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={onCreate}
            className="btn-primary"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus size={20} />
          </button>
          
          {isMobile && onClose && (
            <button className="btn-icon" onClick={onClose} style={{ marginLeft: '8px' }}>
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        paddingRight: '0.25rem'
      }}>
        {filteredPlaylists.map((playlist) => (
          <motion.div 
            key={playlist.id}
            whileHover={{ x: 5 }}
            onClick={() => {
              onSelect(playlist.id);
              if (isMobile && onClose) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1.25rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: activeId === playlist.id ? 'var(--surface-container-highest)' : 'transparent',
              transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
              position: 'relative',
              marginBottom: '0.25rem'
            }}
          >
            {activeId === playlist.id && (
              <motion.div 
                layoutId="active-pill"
                style={{
                  position: 'absolute',
                  left: '-4px',
                  width: '4px',
                  height: '24px',
                  background: 'var(--gradient-main)',
                  borderRadius: '2px',
                  boxShadow: '0 0 15px var(--primary)'
                }}
              />
            )}

            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '1rem', 
              overflow: 'hidden',
              background: 'var(--surface-bright)',
              flexShrink: 0
            }}>
              {playlist.coverUrl ? (
                <img src={playlist.coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-main)', opacity: 0.6 }}>
                  <Music size={24} color="var(--on-surface)" />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: '1.1rem', 
                fontWeight: activeId === playlist.id ? 800 : 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: activeId === playlist.id ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em'
              }}>
                {playlist.name}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(playlist);
                }}
              >
                <Edit3 size={18} />
              </button>

              {playlists.length > 1 && (
                <button 
                  className="btn-icon"
                  style={{ color: 'var(--error)', opacity: 0.4 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Borrar "${playlist.name}"?`)) onDelete(playlist.id);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ecualizador Option at Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={onOpenEq}
          className="btn-icon"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-container-low)',
            color: 'var(--on-surface)',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          <SlidersHorizontal size={20} color="var(--primary)" />
          Ecualizador
        </button>
      </div>
    </motion.aside>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 90
              }}
            />
          )}
          {sidebarContent}
        </>
      )}
    </AnimatePresence>
  );
};
