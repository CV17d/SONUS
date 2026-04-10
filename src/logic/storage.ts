import { get, set } from 'idb-keyval';
import type { Song } from './doublyLinkedList';

const PLAYLISTS_META_KEY = 'sonus_playlists_meta';
const PLAYLIST_DATA_PREFIX = 'sonus_playlist_data_';

/**
 * Información básica de una lista de reproducción.
 */
export interface PlaylistMetadata {
  id: string;
  name: string;
  coverBlob: Blob | null;
  coverUrl?: string; // URL temporal para la UI
  createdAt: number;
}

/**
 * Guarda la lista de metadatos de todas las playlists.
 */
export async function saveAllPlaylistsMeta(meta: PlaylistMetadata[]): Promise<void> {
  try {
    // Al guardar, eliminamos las URLs temporales.
    const metaToSave = meta.map(m => ({
      ...m,
      coverUrl: undefined
    }));
    await set(PLAYLISTS_META_KEY, metaToSave);
  } catch (error) {
    console.error('Error guardando metadatos de playlists:', error);
  }
}

/**
 * Carga todos los metadatos de las playlists y regenera URLs de portadas.
 */
export async function loadAllPlaylistsMeta(): Promise<PlaylistMetadata[]> {
  try {
    const meta = await get<PlaylistMetadata[]>(PLAYLISTS_META_KEY);
    if (!meta) return [];

    return meta.map(m => ({
      ...m,
      coverUrl: m.coverBlob ? URL.createObjectURL(m.coverBlob) : undefined
    }));
  } catch (error) {
    console.error('Error cargando metadatos de playlists:', error);
    return [];
  }
}

/**
 * Guarda el contenido (canciones) de una playlist específica.
 */
export async function savePlaylistContent(id: string, songs: Song[]): Promise<void> {
  try {
    const songsToSave = songs.map(song => ({
      ...song,
      url: undefined,
      coverUrl: undefined
    }));
    await set(`${PLAYLIST_DATA_PREFIX}${id}`, songsToSave);
  } catch (error) {
    console.error(`Error guardando contenido de la playlist ${id}:`, error);
  }
}

/**
 * Carga el contenido de una playlist específica.
 */
export async function loadPlaylistContent(id: string): Promise<Song[]> {
  try {
    const songs = await get<Song[]>(`${PLAYLIST_DATA_PREFIX}${id}`);
    if (!songs) return [];

    return songs.map(song => ({
      ...song,
      url: URL.createObjectURL(song.blob),
      coverUrl: song.coverBlob ? URL.createObjectURL(song.coverBlob) : undefined
    }));
  } catch (error) {
    console.error(`Error cargando contenido de la playlist ${id}:`, error);
    return [];
  }
}
