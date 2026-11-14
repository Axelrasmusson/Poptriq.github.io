// Kopiera till config.js för nuvarande statiska sajt. Supabase anon-nyckeln är
// avsedd att vara publik; databasens RLS-policys skyddar skrivningar.
globalThis.POPTRIQ_CONFIG = {
  supabaseUrl: 'https://DITT-PROJEKT.supabase.co',
  supabaseAnonKey: 'DIN-PUBLIKA-ANON-NYCKEL',
};
