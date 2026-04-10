import { useState, useEffect, useCallback } from 'react';
import { 
  type PlaylistMetadata, 
  loadAllPlaylistsMeta, 
  saveAllPlaylistsMeta 
} from './storage';

export function usePlaylistsManager() {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar metadatos al inicio
  useEffect(() => {
    loadAllPlaylistsMeta().then(data => {
      // Si no hay ninguna playlist, crear una por defecto
      if (data.length === 0) {
        const defaultPlaylist: PlaylistMetadata = {
          id: 'default',
          name: 'Mi Primera Playlist',
          coverBlob: null,
          createdAt: Date.now()
        };
        const initialData = [defaultPlaylist];
        setPlaylists(initialData);
        saveAllPlaylistsMeta(initialData);
        setActivePlaylistId('default');
      } else {
        setPlaylists(data);
        setActivePlaylistId(data[0].id);
      }
      setIsLoading(false);
    });
  }, []);

  const createPlaylist = useCallback(async (name: string, coverBlob: Blob | null = null) => {
    const newPlaylist: PlaylistMetadata = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || 'Nueva Playlist',
      coverBlob,
      coverUrl: coverBlob ? URL.createObjectURL(coverBlob) : undefined,
      createdAt: Date.now()
    };
    
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    await saveAllPlaylistsMeta(updated);
    setActivePlaylistId(newPlaylist.id);
    return newPlaylist;
  }, [playlists]);

  const updatePlaylist = useCallback(async (id: string, name: string, coverBlob: Blob | null) => {
    const updated = playlists.map(p => {
      if (p.id === id) {
        // Si hay un blob anterior, revocar su URL para memoria
        if (p.coverUrl) URL.revokeObjectURL(p.coverUrl);
        return {
          ...p,
          name,
          coverBlob,
          coverUrl: coverBlob ? URL.createObjectURL(coverBlob) : undefined
        };
      }
      return p;
    });

    setPlaylists(updated);
    await saveAllPlaylistsMeta(updated);
  }, [playlists]);

  const deletePlaylist = useCallback(async (id: string) => {
    if (playlists.length <= 1) return; // No permitir borrar la última

    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
    await saveAllPlaylistsMeta(updated);
    
    if (activePlaylistId === id) {
      setActivePlaylistId(updated[0].id);
    }
  }, [playlists, activePlaylistId]);

  return {
    playlists,
    activePlaylistId,
    setActivePlaylistId,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    isLoadingManager: isLoading
  };
}
