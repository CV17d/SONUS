/**
 * Servicio para buscar carátulas de álbumes usando la API de iTunes.
 */
export async function fetchCoverArt(artist: string, title: string): Promise<string | null> {
  try {
    const searchTerm = encodeURIComponent(`${artist} ${title}`);
    const response = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=musicTrack&limit=1`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      // Obtener la URL de la imagen y mejorar la resolución (600x600 o 1000x1000)
      const artworkUrl = result.artworkUrl100;
      if (artworkUrl) {
        return artworkUrl.replace('100x100bb', '600x600bb');
      }
    }
  } catch (error) {
    console.error('Error buscando carátula en iTunes:', error);
  }
  
  return null;
}
