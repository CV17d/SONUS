import { PlaylistDLL, type Song } from './src/logic/doublyLinkedList';

const playlist = new PlaylistDLL();

const song1: Song = { id: '1', title: 'Song 1', artist: 'Artist 1', duration: 120, blob: new Blob() };
const song2: Song = { id: '2', title: 'Song 2', artist: 'Artist 2', duration: 150, blob: new Blob() };
const song3: Song = { id: '3', title: 'Song 3', artist: 'Artist 3', duration: 180, blob: new Blob() };

console.log('--- Testing DLL logic ---');

// Test addFirst
playlist.addFirst(song1);
console.log('Added 1 to start. Size:', playlist.size);

// Test addLast
playlist.addLast(song3);
console.log('Added 3 to end. Size:', playlist.size);

// Test insertAt
playlist.insertAt(song2, 1);
console.log('Inserted 2 at index 1. Size:', playlist.size);

const array = playlist.toArray();
console.log('Order:', array.map(s => s.title).join(' -> '));

if (array[0].id === '1' && array[1].id === '2' && array[2].id === '3') {
  console.log('✅ Insertion order correct.');
} else {
  console.log('❌ Insertion order failed.');
}

// Test removal
playlist.remove('2');
console.log('Removed 2. Size:', playlist.size);
const arrayAfterRemoval = playlist.toArray();
console.log('Order after removal:', arrayAfterRemoval.map(s => s.title).join(' -> '));

if (arrayAfterRemoval.length === 2 && arrayAfterRemoval[0].id === '1' && arrayAfterRemoval[1].id === '3') {
  console.log('✅ Removal logic correct.');
} else {
  console.log('❌ Removal logic failed.');
}

// Test Navigation
const firstNode = playlist.getAt(0);
const secondNode = firstNode?.next;
const prevNode = secondNode?.prev;

if (secondNode?.data.id === '3' && prevNode?.data.id === '1') {
  console.log('✅ Pointers (next/prev) correct.');
} else {
  console.log('❌ Pointers failed.');
}
