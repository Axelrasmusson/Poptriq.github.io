# POPTRIQ

Statisk spelarupplevelse för 50 musikkort och 50 filmkort. Spelarens befintliga rutter och utseende är bevarade, medan kortinnehållet kan hämtas från Supabase och redigeras på en skyddad adminsida.

## Rutter

- Musik: /music/M001
- Film: /movie/F001
- Facit: /answer/M001 eller /answer/F001
- Admin: /admin
- Äldre numeriska filmrutter, exempelvis /001, finns kvar.

GitHub Pages använder 404.html för att ladda samma klientrouter vid direktlänkar. Standardläget spelar filmklippet två gånger. Lägg till ?version=single för en visning.

Den faktiska implementationen före ändringen är dokumenterad i docs/current-behavior.md.

## Data

cards-data.js innehåller en verifierad statisk reserv med exakt 100 kort från masterarkets flik WEBBIMPORT 100, läst 2026-11-14. Varje rad innehåller oförändrat ID, typ, status, titel, artist, länk, tre frågor och tre facit. Alla importerade statusvärden är draft.

När Supabase är konfigurerat läser spelare och admin i första hand tabellen cards. Om backend inte är konfigurerad eller tillfälligt inte går att läsa använder spelarvyn den statiska reserven.

## Konfigurera Supabase

1. Skapa eller anslut ett Supabase-projekt.
2. Kör supabase/migrations/001_poptriq.sql i SQL Editor.
3. Kör supabase/seed.sql. Seedningen använder ON CONFLICT DO NOTHING och skriver därför inte över senare adminändringar.
4. Skapa administratörens användare i Authentication → Users.
5. Lägg användarens UUID i admin_users:

       insert into public.admin_users (user_id)
       values ('ANVÄNDARENS-UUID');

6. Fyll i projektets URL och publika anon-nyckel i config.js. Samma format finns i config.example.js.

För Lovable/Vite kan samma klient läsa VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY. Lösenord och service-role-nycklar ska aldrig läggas i klientkoden.

Databasen har Row Level Security:

- Alla får läsa korten för spelarvyn.
- Endast inloggade användare som finns i admin_users får skapa, ändra eller ta bort kort.
- Adminsidan har ingen registrering; konton skapas av projektägaren.

## Admin

Öppna /admin och logga in med Supabase-kontot. Admin kan:

- söka på ID, titel och artist;
- filtrera musik/film;
- redigera titel, artist, länk, tre frågor och tre facit;
- öppna kortet i befintligt spelarflöde;
- spara centralt med bekräftelse;
- visa och ladda ned spel- och facit-QR som PNG;
- exportera samtliga aktuella kort som JSON-backup.

Kort-ID är skrivskyddat. Formuläret varnar för osparade ändringar och validerar obligatoriska fält samt Spotify-/YouTube-format utan att skriva om texterna.

## Test

Kräver Node.js 20 eller senare.

    npm test

Testerna kontrollerar 100 unika ID, fördelningen 50/50, tre frågor och facit per kort, länkformat, filmens 20–40-sekundersinställning, RLS-skrivskydd och icke-destruktiv seedning.

För att generera om seed.sql från cards-data.js:

    npm run generate:seed

Gör detta endast för nya ID. Befintliga databasrader skrivs aldrig över av seedfilen.

## Publicering

Inga ändringar publiceras automatiskt. Vid en framtida GitHub Pages-publicering ska main och / (root) användas. Säkerställ först att config.js eller Lovable-miljövariablerna är satta och att Supabase-migration, seed och administratör har skapats.
