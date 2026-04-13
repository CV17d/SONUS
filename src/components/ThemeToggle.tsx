import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <div 
      onClick={toggleTheme}
      style={{
        width: '80px',
        height: '40px',
        borderRadius: '100px',
        background: isDark ? 'var(--surface-container-high)' : '#e2e8f0',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.1)',
        transition: 'background 0.5s ease',
        zIndex: 100
      }}
    >
      <motion.div
        animate={{
          x: isDark ? 40 : 0,
          rotate: isDark ? 360 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: isDark ? 'var(--gradient-main)' : 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: isDark ? 'white' : '#64748b'
        }}
      >
        {isDark ? <Moon size={18} fill="white" /> : <Sun size={18} fill="#f59e0b" color="#f59e0b" />}
      </motion.div>
    </div>
  );
};
