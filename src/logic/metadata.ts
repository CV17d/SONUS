import * as mm from 'music-metadata-browser';
import type { Song } from './doublyLinkedList';

/**
 * Extrae metadatos inteligentes de un archivo de audio.
 */
export async function extractMetadata(file: File): Promise<Partial<Song>> {
  try {
    const metadata = await mm.parseBlob(file);
    const { common, format } = metadata;
    
    console.log('Metadatos extraídos con éxito:', { title: common.title, artist: common.artist, hasPicture: !!common.picture });

    // Extraer carátula si existe
    let coverBlob: Blob | undefined;
    if (common.picture && common.picture.length > 0) {
      coverBlob = new Blob([new Uint8Array(common.picture[0].data)], { type: common.picture[0].format });
    }

    // Fallback inteligente si los metadatos fallan o están incompletos
    let finalTitle = common.title;
    let finalArtist = common.artist || (common.artists && common.artists.length > 0 ? common.artists[0] : null) || common.albumartist;

    if (!finalTitle || !finalArtist) {
      const fileNameClean = file.name.replace(/\.[^/.]+$/, "");
      if (fileNameClean.includes(" - ")) {
        const parts = fileNameClean.split(" - ");
        if (!finalArtist) finalArtist = parts[0].trim();
        if (!finalTitle) finalTitle = parts.slice(1).join(" - ").trim();
      }
    }

    return {
      title: finalTitle || file.name.replace(/\.[^/.]+$/, ""),
      artist: finalArtist || 'Artista Desconocido',
      album: common.album || 'Álbum Desconocido',
      duration: format.duration || 0,
      coverBlob: coverBlob,
      coverUrl: coverBlob ? URL.createObjectURL(coverBlob) : undefined,
      lyrics: common.lyrics ? common.lyrics.join('\n') : undefined
    };
  } catch (error) {
    console.error('Error crítico extrayendo metadatos:', error);
    const fileNameClean = file.name.replace(/\.[^/.]+$/, "");
    let guessedArtist = 'Artista Desconocido';
    let guessedTitle = fileNameClean;

    if (fileNameClean.includes(" - ")) {
      const parts = fileNameClean.split(" - ");
      guessedArtist = parts[0].trim();
      guessedTitle = parts.slice(1).join(" - ").trim();
    }

    return {
      title: guessedTitle,
      artist: guessedArtist,
      album: 'Álbum Desconocido',
      duration: 0
    };
  }
}
