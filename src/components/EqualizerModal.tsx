import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface EqualizerModalProps {
  eqBands: number[];
  setEqBands: React.Dispatch<React.SetStateAction<number[]>>;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ eqBands, setEqBands, onClose }) => {
  const frequencies = ['Bajos', 'Graves', 'Medios', 'Presencia', 'Agudos'];

  const handleChange = (index: number, value: number) => {
    const newBands = [...eqBands];
    newBands[index] = value;
    setEqBands(newBands);
  };

  const handleReset = () => {
    setEqBands([0, 0, 0, 0, 0]);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel"
        style={{
          width: '90%',
          maxWidth: '500px',
          padding: '2.5rem',
          background: 'var(--surface-container-high)',
          border: '1px solid var(--surface-container-highest)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <button 
          onClick={onClose}
          className="btn-icon"
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <SlidersHorizontal size={36} color="var(--primary)" />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
            Ecualizador
          </h2>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          height: '200px',
          marginBottom: '2rem'
        }}>
          {frequencies.map((freq, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>+12</span>
              
              <input 
                type="range" 
                min="-12" 
                max="12" 
                step="1"
                value={eqBands[index]}
                onChange={(e) => handleChange(index, parseInt(e.target.value))}
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  WebkitAppearance: 'slider-vertical',
                  width: '8px',
                  height: '100%',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer'
                }}
              />
              
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>-12</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--on-surface)' }}>{freq}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={handleReset}
          className="btn-icon"
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--secondary)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginTop: '1rem'
          }}
        >
          Restablecer
        </button>
      </motion.div>
    </div>
  );
};
