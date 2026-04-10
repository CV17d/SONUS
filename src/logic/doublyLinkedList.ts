/**
 * Represanta la información de una canción.
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;   // Metadato del álbum
  duration: number; // en segundos
  blob: Blob;       // el archivo real
  coverBlob?: Blob; // la carátula extraída
  url?: string;     // URL temporal del blob de audio
  coverUrl?: string; // URL temporal de la carátula
  lyrics?: string;   // Letras (sincronizadas o planas)
}

/**
 * Nodo de la lista doblemente enlazada.
 */
export class SongNode {
  public data: Song;
  public next: SongNode | null = null;
  public prev: SongNode | null = null;

  constructor(song: Song) {
    this.data = song;
  }
}

/**
 * Clase principal para gestionar la playlist como una Lista Doblemente Enlazada.
 * Todo el código está en inglés pero recordamos que la UI será en español.
 */
export class PlaylistDLL {
  private head: SongNode | null = null;
  private tail: SongNode | null = null;
  private length: number = 0;

  get size(): number {
    return this.length;
  }

  /**
   * Agrega una canción al inicio de la lista.
   */
  public addFirst(song: Song): void {
    const newNode = new SongNode(song);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.length++;
  }

  /**
   * Agrega una canción al final de la lista.
   */
  public addLast(song: Song): void {
    const newNode = new SongNode(song);
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
    }
    this.length++;
  }

  /**
   * Inserta una canción en una posición específica (0-indexed).
   */
  public insertAt(song: Song, index: number): void {
    if (index <= 0) {
      this.addFirst(song);
      return;
    }
    if (index >= this.length) {
      this.addLast(song);
      return;
    }

    const newNode = new SongNode(song);
    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current!.next;
    }

    // Insertar antes de 'current'
    newNode.prev = current!.prev;
    newNode.next = current;
    current!.prev!.next = newNode;
    current!.prev = newNode;

    this.length++;
  }

  /**
   * Elimina una canción por su ID.
   */
  public remove(id: string): Song | null {
    let current = this.head;
    while (current) {
      if (current.data.id === id) {
        if (current.prev) {
          current.prev.next = current.next;
        } else {
          this.head = current.next;
        }

        if (current.next) {
          current.next.prev = current.prev;
        } else {
          this.tail = current.prev;
        }

        this.length--;
        return current.data;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Busca una canción por su posición.
   */
  public getAt(index: number): SongNode | null {
    if (index < 0 || index >= this.length) return null;
    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current!.next;
    }
    return current;
  }

  /**
   * Convierte la lista en un array para facilitar el renderizado en React o guardado en DB.
   */
  public toArray(): Song[] {
    const songs: Song[] = [];
    let current = this.head;
    while (current) {
      songs.push(current.data);
      current = current.next;
    }
    return songs;
  }

  /**
   * Inicializa la lista desde un array (por ejemplo, al cargar de IndexedDB).
   */
  public fromArray(songs: Song[]): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
    songs.forEach(s => this.addLast(s));
  }
}
