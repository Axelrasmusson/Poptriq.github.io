import test from 'node:test';
import assert from 'node:assert/strict';
import { seedCards } from '../cards-data.js';
import { youtubeId } from '../cards.js';

test('masterimporten innehåller exakt 50 musik- och 50 filmkort', () => {
  assert.equal(seedCards.length, 100);
  assert.equal(seedCards.filter((card) => card.type === 'music').length, 50);
  assert.equal(seedCards.filter((card) => card.type === 'movie').length, 50);
});

test('alla förväntade ID finns exakt en gång', () => {
  const ids = seedCards.map((card) => card.id);
  assert.equal(new Set(ids).size, 100);
  const expected = [
    ...Array.from({ length: 50 }, (_, index) => 'M' + String(index + 1).padStart(3, '0')),
    ...Array.from({ length: 50 }, (_, index) => 'F' + String(index + 1).padStart(3, '0')),
  ];
  assert.deepEqual([...ids].sort(), expected.sort());
});

test('frågor, facit, status och länkar är kompletta', () => {
  for (const card of seedCards) {
    assert.equal(card.status, 'draft', card.id + ' status');
    assert.ok(card.title, card.id + ' tom titel');
    if (card.type === 'music') assert.ok(card.artist, card.id + ' tom artist');
    assert.equal(card.questions.length, 3, card.id + ' frågor');
    assert.equal(card.answers.length, 3, card.id + ' facit');
    assert.ok(card.questions.every(Boolean), card.id + ' tom fråga');
    assert.ok(card.answers.every(Boolean), card.id + ' tomt facit');
    const url = new URL(card.link);
    assert.equal(url.protocol, 'https:');
    if (card.type === 'music') {
      assert.equal(url.hostname, 'open.spotify.com', card.id);
      assert.match(url.pathname, /^\/track\/[A-Za-z0-9]{22}$/);
    } else {
      assert.ok(youtubeId(card.link), card.id + ' saknar YouTube-ID');
      assert.deepEqual(card.playback, { start: 20, end: 40 });
    }
  }
});
