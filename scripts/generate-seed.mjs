import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { seedCards } from '../cards-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const json = (value) => quote(JSON.stringify(value)) + '::jsonb';
const rows = seedCards.map((card) => '  (' + [
  quote(card.id),
  quote(card.type),
  quote(card.status),
  quote(card.title),
  card.artist ? quote(card.artist) : 'null',
  quote(card.link),
  json(card.questions),
  json(card.answers),
  json(card.playback || {}),
].join(', ') + ')');

const sql = [
  '-- Genererad från cards-data.js. Importen är medvetet icke-destruktiv:',
  '-- befintliga rader (inklusive adminändringar) skrivs aldrig över.',
  'insert into public.cards',
  '  (id, type, status, title, artist, playback_url, questions, answers, playback)',
  'values',
  rows.join(',\\n'),
  'on conflict (id) do nothing;',
  '',
].join('\\n');

await mkdir(path.join(root, 'supabase'), { recursive: true });
await writeFile(path.join(root, 'supabase', 'seed.sql'), sql, 'utf8');
console.log('Skrev ' + seedCards.length + ' kort till supabase/seed.sql');
