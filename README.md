# Poptriq – GitHub Pages

Den här mappen innehåller Poptriqs film- och musikkort som en statisk webbplats, färdig för GitHub Pages.

## Publicera

1. Skapa ett nytt repository på GitHub, exempelvis `poptriq`.
2. Ladda upp **innehållet** i den här mappen till repositoryts huvudnivå.
3. Öppna **Settings → Pages** i GitHub.
4. Under **Build and deployment**, välj **Deploy from a branch**.
5. Välj `main`, mappen `/ (root)`, och tryck **Save**.

GitHub visar sedan den publika adressen. Direktlänkar som `/movie/F001` fungerar genom den inkluderade `404.html`.

## Viktigt

- Ändra inte kortens ID:n om befintliga QR-koder ska fortsätta fungera.
- Filmklippen använder YouTube och musiklänkarna öppnar Spotify.
- Standardläget spelar filmklippet två gånger. Lägg till `?version=single` för en uppspelning.
