const cards = [
  { type: 'music', id: 'M001', link: 'https://open.spotify.com/track/5e9TFTbltYBg2xThimr0rU?si=Hs4DFwtcST6P9t6-1RctvA&utm_source=copy-link', title: 'The Chain', artist: 'Fleetwood Mac', questions: ['Stevie Nicks', 'Järn', 'Fyra'] },
  { type: 'music', id: 'M002', link: 'https://open.spotify.com/track/3No0idjeViPyWDP4gh1YGo?si=Y45nW0kZQRCMu6vEpsDX8w&utm_source=copy-link', title: 'Jag ska fånga en ängel', questions: ['Struts', 'Ted - För kärlekens skull', 'LA / Los Angeles'] },
  { type: 'music', id: 'M003', link: 'https://open.spotify.com/track/28P5HAF0Kll9Xd9dX4qw7A?si=248c3a0176104b30', title: 'Eye of the Tiger', questions: ['Rocky', 'Iris', 'Indien'] },
  { type: 'music', id: 'M004', link: 'https://open.spotify.com/track/6I1kZgg3bGrPKxhZOltbRW?si=0yOp-CAKTpeSwcwgbGcNsA&utm_source=copy-link&context=spotify%3Aplaylist%3A37i9dQZF1E8M29t70Xtl3a&rowId=62666531306464343266663939383530', title: 'Alla vill till himmelen men ingen vill dö', questions: ['Mali', 'YouTube', 'Valhall'] },
  { type: 'music', id: 'M005', link: 'https://open.spotify.com/track/2374M0fQpWi3dLnB54qaLX', title: 'Africa', questions: ['Kilimanjaro', 'Algeriet', 'Sydafrika'] },
  { type: 'music', id: 'M006', link: 'https://open.spotify.com/track/0O75V4Ku0mNg2dkyPbIAfc', title: 'Natteravn', questions: ['Sydafrika', 'Öresundsbron', 'Oden'] },
  { type: 'music', id: 'M007', link: 'https://open.spotify.com/track/5UqCQaDshqbIk3pkhy4Pjg', title: 'Levels', questions: ['Tim Bergling', 'Disc jockey', 'Coldplay'] },
  { type: 'music', id: 'M008', link: 'https://open.spotify.com/track/33ZXjLCpiINn8eQIDYEPTD', title: 'Shook Ones Part II', questions: ['8 Mile', 'The Big Apple', 'Spider-Man'] },
  { type: 'music', id: 'M009', link: 'https://open.spotify.com/track/7J1uxwnxfQLu4APicE5Rnj', title: 'Billie Jean', questions: ['Moonwalk', 'Madonna', 'Wimbledon'] },
  { type: 'music', id: 'M010', link: 'https://open.spotify.com/track/5R8dQOPq8haW94K7mgERlO', title: 'Poker Face', questions: ['Royal flush', '52', 'A Star Is Born'] },
  { type: 'movie', id: 'F001', link: 'https://www.youtube.com/watch?v=ez6WQ7IX72U', title: 'Back to the Future', questions: ['DeLorean', 'Live Aid', 'Ampere'] },
  { type: 'movie', id: 'F002', link: 'https://www.youtube.com/watch?v=Wfv5jdW__N0', title: 'Jurassic Park', questions: ['Grönland', 'Ace of Base', 'Fåglar'] },
  { type: 'movie', id: 'F003', link: 'https://www.youtube.com/watch?v=lFzVJEksoDY', title: 'The Lion King', questions: ['Tredjeplats', 'Gepard', 'Sony'] },
  { type: 'movie', id: 'F004', link: 'https://www.youtube.com/watch?v=oHY7D7K58BM', title: 'Titanic', questions: ['Belfast', 'Hudsonfloden', 'Hongkong'] },
  { type: 'movie', id: 'F005', link: 'https://www.youtube.com/watch?v=tGgCqGm_6Hs', title: 'The Matrix', questions: ['0 och 1', 'Neo', 'Napster'] },
  { type: 'movie', id: 'F006', link: 'https://www.youtube.com/watch?v=NBClQpIsEXk', title: "Harry Potter and the Philosopher's Stone", questions: ['Hogwarts', 'Xbox', 'Edinburgh'] },
  { type: 'movie', id: 'F007', link: 'https://www.youtube.com/watch?v=EXeTwQWrcwY', title: 'The Dark Knight', questions: ['Jokern', 'Hörsel / ekolokalisering', 'Barack Obama'] },
  { type: 'movie', id: 'F008', link: 'https://www.youtube.com/watch?v=5PSNL1qE6VY', title: 'Avatar', questions: ['Pandora', 'Michael Jackson', 'Indien'] },
  { type: 'movie', id: 'F009', link: 'https://www.youtube.com/watch?v=Qwe6qXFTdgc', title: 'Inception', questions: ['Dubai', 'Lucid dreaming / klardröm', 'Snurra'] },
  { type: 'movie', id: 'F010', link: 'https://www.youtube.com/watch?v=eOrNdBpGMv8', title: 'The Avengers', questions: ['Bullseye', 'London', 'Ca 1 km'] },
];

export async function loadCards(type) {
  return cards.filter((card) => card.type === type);
}

export async function loadCard(type, id) {
  return cards.find((card) => card.type === type && card.id.toLowerCase() === String(id).toLowerCase()) || null;
}

export function youtubeId(link) {
  try {
    const url = new URL(link);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    return url.searchParams.get('v') || '';
  } catch {
    return link || '';
  }
}
