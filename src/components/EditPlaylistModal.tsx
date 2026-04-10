import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaylistMetadata } from '../logic/storage';

interface EditPlaylistModalProps {
  playlist: PlaylistMetadata | null;
  onClose: () => void;
  onSave: (id: string, name: string, coverBlob: Blob | null) => void;
}

const PRESETS = [
  { id: 'aurora', name: 'Aurora Digital', url: '/presets/aurora.png' },
  { id: 'oceanic', name: 'Oceanic Beats', url: '/presets/oceanic.png' },
  { id: 'golden', name: 'Golden Jazz', url: '/presets/golden.png' },
  { id: 'techno', name: 'Emerald Techno', url: '/presets/techno.png' },
];

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({ 
  playlist, 
  onClose, 
  onSave 
}) => {
  const [name, setName] = useState('');
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setSelectedBlob(playlist.coverBlob || null);
      setPreviewUrl(playlist.coverUrl || null);
    }
  }, [playlist]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectPreset = async (presetUrl: string) => {
    try {
      const response = await fetch(presetUrl);
      const blob = await response.blob();
      setSelectedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error cargando preset:', error);
    }
  };

  const handleSave = () => {
    if (playlist && name.trim()) {
      onSave(playlist.id, name, selectedBlob);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {playlist && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="glass-panel" 
            style={{ 
              padding: '3rem',
              position: 'relative',
              background: 'var(--surface-container-high)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Fondo de luz sutil */}
            <div style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '300px',
              height: '300px',
              background: 'var(--primary)',
              filter: 'blur(150px)',
              opacity: 0.2,
              pointerEvents: 'none'
            }} />

            <button 
              onClick={onClose}
              className="btn-icon"
              style={{ position: 'absolute', top: '2rem', right: '2rem' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              marginBottom: '2.5rem',
              letterSpacing: '-1px',
              fontFamily: 'var(--font-display)' 
            }}>
              Estética de Playlist
            </h2>

            <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '3rem' }}>
              {/* Zona de Carga Punteada */}
              <div style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '2rem', 
                background: previewUrl ? 'transparent' : 'rgba(255,255,255,0.03)',
                border: '2px dashed rgba(163, 166, 255, 0.3)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <Upload size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '1px' }}>EXPLORAR</p>
                  </div>
                )}
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 800, letterSpacing: '2px' }}>TÍTULO</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dale un nombre vibrante..."
                    style={{
                      background: 'var(--surface-container-lowest)',
                      border: 'none',
                      borderRadius: '1rem',
                      padding: '1.25rem',
                      color: 'var(--on-surface)',
                      fontSize: '1.1rem',
                      outline: 'none',
                      fontFamily: 'var(--font-body)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 800, letterSpacing: '2px', display: 'block', marginBottom: '1.25rem' }}>
                GALERÍA PRESET
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {PRESETS.map((preset) => (
                   <motion.div 
                    key={preset.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectPreset(preset.url)}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '1.25rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: previewUrl?.includes(preset.id) || previewUrl?.includes(preset.url) ? 'var(--primary)' : 'transparent',
                      transition: 'border-color 0.2s',
                      background: 'var(--surface-bright)'
                    }}
                   >
                     <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </motion.div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                onClick={handleSave} 
                style={{ flex: 1, padding: '1.25rem', fontSize: '1rem' }}
              >
                Guardar Configuración
              </button>
              <button 
                onClick={onClose} 
                style={{ 
                  flex: 0.5, 
                  background: 'rgba(255,255,255,0.05)', 
                  border: 'none',
                  borderRadius: '1rem',
                  color: 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
