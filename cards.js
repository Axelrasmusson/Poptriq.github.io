import { seedCards } from './cards-data.js';
import { getSupabaseClient } from './supabase-client.js';

function fromDatabase(row) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    artist: row.artist || '',
    link: row.playback_url,
    questions: Array.isArray(row.questions) ? row.questions : [],
    answers: Array.isArray(row.answers) ? row.answers : [],
    playback: row.playback || (row.type === 'movie' ? { start: 20, end: 40 } : undefined),
  };
}

function staticCards(type) {
  return seedCards.filter((card) => !type || card.type === type);
}

export async function loadCards(type) {
  const supabase = await getSupabaseClient();
  if (supabase) {
    let query = supabase.from('cards').select('*').order('id');
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (!error && data?.length) return data.map(fromDatabase);
    if (error) console.warn('POPTRIQ: använder importerad reservdata.', error.message);
  }
  return staticCards(type);
}

export async function loadCard(type, id) {
  const normalizedId = String(id).toUpperCase();
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', normalizedId)
      .eq('type', type)
      .maybeSingle();
    if (!error && data) return fromDatabase(data);
    if (error) console.warn('POPTRIQ: använder importerad reservdata.', error.message);
  }
  return seedCards.find((card) => card.type === type && card.id === normalizedId) || null;
}

export async function saveCard(card) {
  const supabase = await getSupabaseClient({ required: true });
  const payload = {
    id: card.id,
    type: card.type,
    status: card.status,
    title: card.title,
    artist: card.artist || null,
    playback_url: card.link,
    questions: card.questions,
    answers: card.answers,
    playback: card.playback || {},
  };
  const { data, error } = await supabase.from('cards').upsert(payload).select().single();
  if (error) throw error;
  return fromDatabase(data);
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
