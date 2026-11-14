import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../supabase/migrations/001_poptriq.sql', import.meta.url), 'utf8');
const seed = await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8');

test('databasen kräver admin för alla skrivningar', () => {
  assert.match(migration, /alter table public\.cards enable row level security/i);
  assert.match(migration, /cards_insert_admin[\s\S]*is_poptriq_admin/i);
  assert.match(migration, /cards_update_admin[\s\S]*is_poptriq_admin/i);
  assert.match(migration, /cards_delete_admin[\s\S]*is_poptriq_admin/i);
});

test('seedningen skriver inte över adminändringar', () => {
  assert.match(seed, /on conflict \(id\) do nothing/i);
  assert.doesNotMatch(seed, /do update/i);
});
