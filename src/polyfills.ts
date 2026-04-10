import { Buffer } from 'buffer';

// Definición de globales para el navegador (necesario para music-metadata-browser y otras utilidades de Node.js)
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = {
    env: { NODE_ENV: 'development' },
    nextTick: (callback: Function) => setTimeout(callback, 0),
  };
}
