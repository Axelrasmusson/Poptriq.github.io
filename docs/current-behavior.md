# Befintligt spelarflöde (kartlagt före ändringen)

- **Musik:** \`/music/{ID}\` läser kortet och visar en enda knapp. Ett aktivt tryck öppnar Spotify-spåret. På Android används app-/intent-länk med webblänk som reserv.
- **Film:** \`/movie/{ID}\` skapar YouTube IFrame-spelaren. Klippet startar vid 20 sekunder och slutar vid 40 sekunder. Standardläget visar klippet två gånger; \`?version=single\` visar det en gång.
- **Titelavslöjande:** filmtiteln visas först när samtliga visningar är klara. Då visas även “Spela igen” och, om kortet har facit, “Visa facit”.
- **Frågor:** frågorna visas inte i webbspelaren i den befintliga implementationen; de hör till det tryckta kortets spelmoment. De lagras nu separat så att admin kan redigera dem utan att de oavsiktligt visas för spelarna.
- **Facit:** \`/answer/{ID}\` visar titel, eventuell artist och tre svar. Frågor och svar hålls i separata fält.
- **QR-adresser:** permanenta speladresser är \`/music/M001\` respektive \`/movie/F001\`; separat facit finns på \`/answer/M001\` eller \`/answer/F001\`. \`404.html\` laddar samma router så direktlänkar fungerar på GitHub Pages. Äldre numeriska filmadresser som \`/001\` finns kvar.
- **Lagring före ändringen:** 20 kort låg hårdkodade i \`cards.js\`; \`/admin\` var en oskyddad länklista utan redigering eller beständig lagring.
