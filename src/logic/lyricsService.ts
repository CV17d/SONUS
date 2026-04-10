/**
 * Servicio para buscar letras de canciones usando la API de LrcLib.
 * Soporta letras sincronizadas (LRC) y letras planas.
 */

export interface LyricsData {
  id: number;
  name: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

export interface SyncedLine {
  time: number; // tiempo en segundos
  text: string;
}

/**
 * Busca letras en lrclib.net usando el artista y el título.
 */
export async function fetchLyrics(artist: string, title: string): Promise<LyricsData | null> {
  try {
    const query = new URLSearchParams({
      artist_name: artist,
      track_name: title
    });
    
    const response = await fetch(`https://lrclib.net/api/get?${query.toString()}`);
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Error en la API de letras');
    
    return await response.json();
  } catch (error) {
    console.error('Error buscando letras:', error);
    return null;
  }
}

/**
 * Parsea un string de formato LRC en un array de líneas sincronizadas.
 * Ejemplo línea LRC: [00:12.34] Letra de la canción
 */
export function parseLRC(lrc: string): SyncedLine[] {
  if (!lrc) return [];
  
  const lines = lrc.split('\n');
  const result: SyncedLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      
      const time = minutes * 60 + seconds + (milliseconds / 100);
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        result.push({ time, text });
      }
    }
  });
  
  return result.sort((a, b) => a.time - b.time);
}
