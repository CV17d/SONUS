import { useState, useCallback, useEffect, useMemo } from 'react';
import { PlaylistDLL, type Song } from './doublyLinkedList';
import { savePlaylistContent, loadPlaylistContent } from './storage';

/**
 * Hook para manejar una playlist específica por ID.
 */
export function usePlaylist(playlistId: string | null) {
  const playlist = useMemo(() => new PlaylistDLL(), [playlistId]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar contenido cuando cambie el ID
  useEffect(() => {
    if (!playlistId) return;
    
    setIsLoading(true);
    loadPlaylistContent(playlistId).then(savedSongs => {
      playlist.fromArray(savedSongs);
      setSongs(playlist.toArray());
      setIsLoading(false);
    });
  }, [playlistId, playlist]);

  const updateState = useCallback(() => {
    if (!playlistId) return;
    const newSongs = playlist.toArray();
    setSongs(newSongs);
    savePlaylistContent(playlistId, newSongs);
  }, [playlistId, playlist]);

  const addAtStart = (song: Song) => {
    playlist.addFirst(song);
    updateState();
  };

  const addAtEnd = (song: Song) => {
    playlist.addLast(song);
    updateState();
  };

  const addAtPosition = (song: Song, index: number) => {
    playlist.insertAt(song, index);
    updateState();
  };

  const removeSong = (id: string) => {
    playlist.remove(id);
    updateState();
  };

  const reorderSongs = (newSongs: Song[]) => {
    playlist.fromArray(newSongs);
    updateState();
  };

  return {
    songs,
    isLoading,
    addAtStart,
    addAtEnd,
    addAtPosition,
    removeSong,
    reorderSongs,
  };
}
