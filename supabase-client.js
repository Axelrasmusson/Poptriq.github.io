let clientPromise;

function configuration() {
  const runtime = globalThis.POPTRIQ_CONFIG || {};
  const build = import.meta.env || {};
  return {
    url: runtime.supabaseUrl || build.VITE_SUPABASE_URL || '',
    key: runtime.supabaseAnonKey || build.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function isBackendConfigured() {
  const { url, key } = configuration();
  return Boolean(url && key);
}

export async function getSupabaseClient({ required = false } = {}) {
  if (!isBackendConfigured()) {
    if (required) throw new Error('Supabase är inte konfigurerat. Se README.md.');
    return null;
  }
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) => {
        const { url, key } = configuration();
        return createClient(url, key, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
      });
  }
  return clientPromise;
}
