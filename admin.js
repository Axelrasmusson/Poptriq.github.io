import { loadCards, saveCard, youtubeId } from './cards.js';
import { getSupabaseClient, isBackendConfigured } from './supabase-client.js';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function download(name, contents, type = 'application/json') {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([contents], { type }));
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function validPlaybackUrl(type, raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return false;
    if (type === 'music') {
      return url.hostname === 'open.spotify.com' && /^\/track\/[A-Za-z0-9]{22}$/.test(url.pathname);
    }
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)
      && Boolean(youtubeId(raw));
  } catch {
    return false;
  }
}

export async function showAdmin({ app, basePath, siteUrl, setPageState }) {
  setPageState('admin');
  if (!isBackendConfigured()) {
    app.innerHTML = `
      <section class="admin-panel admin-setup">
        <p class="category-label">POPTRIQ ADMIN</p>
        <h1>Anslut lagringen</h1>
        <p>Admin kräver Supabase för riktig inloggning och central lagring. Följ stegen i README.md och skapa <code>config.js</code> från <code>config.example.js</code>.</p>
        <p>Spelarvyn använder under tiden den verifierade, importerade reservdatan med alla 100 kort.</p>
      </section>`;
    return;
  }

  const supabase = await getSupabaseClient({ required: true });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return renderLogin(supabase);

  const { data: administrator } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (!administrator) {
    await supabase.auth.signOut();
    app.innerHTML = '<section class="message-card"><p class="category-label">POPTRIQ ADMIN</p><h1>Saknar behörighet</h1><p>Kontot är inloggat men finns inte i admin_users.</p></section>';
    return;
  }
  return renderWorkspace(supabase);

  function renderLogin(client) {
    app.innerHTML = `
      <section class="admin-panel admin-login">
        <p class="category-label">POPTRIQ ADMIN</p>
        <h1>Logga in</h1>
        <form data-login-form>
          <label>E-post<input name="email" type="email" autocomplete="username" required></label>
          <label>Lösenord<input name="password" type="password" autocomplete="current-password" required></label>
          <button class="primary-button" type="submit">Logga in</button>
          <p class="form-status" data-login-status aria-live="polite"></p>
        </form>
      </section>`;
    app.querySelector('[data-login-form]').addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = app.querySelector('[data-login-status]');
      const form = new FormData(event.currentTarget);
      status.textContent = 'Loggar in…';
      const { error } = await client.auth.signInWithPassword({
        email: form.get('email'),
        password: form.get('password'),
      });
      if (error) {
        status.textContent = 'Inloggningen misslyckades. Kontrollera uppgifterna.';
        return;
      }
      showAdmin({ app, basePath, siteUrl, setPageState });
    });
  }

  async function renderWorkspace(client) {
    const cards = await loadCards();
    let selected = cards[0] || null;
    let dirty = false;
    const warnBeforeLeave = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeave);

    app.innerHTML = `
      <section class="admin-shell">
        <header class="admin-toolbar">
          <div><p class="category-label">POPTRIQ ADMIN</p><h1>Kortinnehåll</h1></div>
          <div class="toolbar-actions">
            <button type="button" data-export>Exportera backup</button>
            <button type="button" data-logout>Logga ut</button>
          </div>
        </header>
        <div class="admin-grid">
          <aside class="card-browser">
            <label class="search-label">Sök<input type="search" data-search placeholder="ID, titel eller artist"></label>
            <label class="filter-label">Typ
              <select data-filter><option value="">Alla</option><option value="music">Musik</option><option value="movie">Film</option></select>
            </label>
            <p class="card-count" data-count></p>
            <div class="card-list" data-list></div>
          </aside>
          <div class="editor-panel" data-editor></div>
        </div>
      </section>`;

    const list = app.querySelector('[data-list]');
    const editor = app.querySelector('[data-editor]');
    const search = app.querySelector('[data-search]');
    const filter = app.querySelector('[data-filter]');
    const count = app.querySelector('[data-count]');

    function renderList() {
      const needle = search.value.trim().toLocaleLowerCase('sv');
      const type = filter.value;
      const visible = cards.filter((card) => {
        const haystack = `${card.id} ${card.title} ${card.artist || ''}`.toLocaleLowerCase('sv');
        return (!type || card.type === type) && (!needle || haystack.includes(needle));
      });
      count.textContent = `${visible.length} av ${cards.length} kort`;
      list.innerHTML = visible.map((card) => `
        <button type="button" class="${card.id === selected?.id ? 'selected' : ''}" data-card-id="${escapeHtml(card.id)}">
          <strong>${escapeHtml(card.id)}</strong>
          <span>${escapeHtml(card.title)}</span>
          <small>${card.type === 'music' ? 'Musik' : 'Film'} · ${escapeHtml(card.status)}</small>
        </button>`).join('');
      list.querySelectorAll('[data-card-id]').forEach((button) => {
        button.addEventListener('click', () => {
          if (dirty && !window.confirm('Du har osparade ändringar. Vill du lämna kortet?')) return;
          selected = cards.find((card) => card.id === button.dataset.cardId);
          dirty = false;
          renderList();
          renderEditor();
        });
      });
    }

    function renderEditor() {
      if (!selected) {
        editor.innerHTML = '<p>Inga kort hittades.</p>';
        return;
      }
      const playRoute = selected.type === 'music' ? `/music/${selected.id}` : `/movie/${selected.id}`;
      const answerRoute = `/answer/${selected.id}`;
      editor.innerHTML = `
        <form data-card-form>
          <div class="editor-heading">
            <div><p class="category-label">${selected.type === 'music' ? 'MUSIK' : 'FILM'} · ${escapeHtml(selected.status)}</p><h2>${escapeHtml(selected.id)}</h2></div>
            <a class="preview-link" href="${basePath}${playRoute}" target="_blank" rel="noopener">Förhandsgranska</a>
          </div>
          <label>Kort-ID<input name="id" value="${escapeHtml(selected.id)}" readonly aria-readonly="true"></label>
          <label>Titel<input name="title" value="${escapeHtml(selected.title)}" required></label>
          ${selected.type === 'music' ? `<label>Artist<input name="artist" value="${escapeHtml(selected.artist)}" required></label>` : ''}
          <label>${selected.type === 'music' ? 'Spotify-länk' : 'YouTube-länk'}<input name="link" type="url" value="${escapeHtml(selected.link)}" required></label>
          <fieldset><legend>Frågor</legend>
            ${selected.questions.map((question, index) => `<label>Fråga ${index + 1}<textarea name="question${index + 1}" required>${escapeHtml(question)}</textarea></label>`).join('')}
          </fieldset>
          <fieldset><legend>Facit</legend>
            ${selected.answers.map((answer, index) => `<label>Facit ${index + 1}<textarea name="answer${index + 1}" required>${escapeHtml(answer)}</textarea></label>`).join('')}
          </fieldset>
          <div class="save-row"><button class="primary-button" type="submit">Spara ändringar</button><p class="form-status" data-save-status aria-live="polite"></p></div>
        </form>
        <section class="qr-section">
          <h3>QR-koder</h3>
          <div class="qr-grid">
            ${qrCard('Spela kort', playRoute, 'play')}
            ${qrCard('Visa facit', answerRoute, 'answer')}
          </div>
        </section>`;

      const form = editor.querySelector('[data-card-form]');
      form.addEventListener('input', () => { dirty = true; });
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const status = editor.querySelector('[data-save-status]');
        const values = new FormData(form);
        const next = {
          ...selected,
          title: String(values.get('title')).trim(),
          artist: selected.type === 'music' ? String(values.get('artist')).trim() : '',
          link: String(values.get('link')).trim(),
          questions: [1, 2, 3].map((number) => String(values.get(`question${number}`)).trim()),
          answers: [1, 2, 3].map((number) => String(values.get(`answer${number}`)).trim()),
        };
        if (!next.title || (next.type === 'music' && !next.artist) || next.questions.some((value) => !value) || next.answers.some((value) => !value)) {
          status.textContent = 'Fyll i alla obligatoriska fält.';
          return;
        }
        if (!validPlaybackUrl(next.type, next.link)) {
          status.textContent = `Ange en giltig ${next.type === 'music' ? 'Spotify-spårlänk' : 'YouTube-länk'}.`;
          return;
        }
        status.textContent = 'Sparar…';
        try {
          const saved = await saveCard(next);
          const index = cards.findIndex((card) => card.id === saved.id);
          cards[index] = saved;
          selected = saved;
          dirty = false;
          status.textContent = 'Sparat centralt.';
          renderList();
        } catch (error) {
          status.textContent = `Kunde inte spara: ${error.message}`;
        }
      });
      renderQrs();
    }

    function qrCard(label, route, suffix) {
      return `<article><h4>${label}</h4><canvas data-qr="${suffix}"></canvas><code>${escapeHtml(siteUrl(route))}</code><button type="button" data-download-qr="${suffix}">Ladda ned PNG</button></article>`;
    }

    async function renderQrs() {
      const { default: QRCode } = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
      const routes = {
        play: selected.type === 'music' ? `/music/${selected.id}` : `/movie/${selected.id}`,
        answer: `/answer/${selected.id}`,
      };
      for (const [suffix, route] of Object.entries(routes)) {
        const canvas = editor.querySelector(`[data-qr="${suffix}"]`);
        await QRCode.toCanvas(canvas, siteUrl(route), { width: 240, margin: 2, errorCorrectionLevel: 'M' });
        editor.querySelector(`[data-download-qr="${suffix}"]`).addEventListener('click', () => {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `${selected.id}-${suffix}.png`;
          link.click();
        });
      }
    }

    search.addEventListener('input', renderList);
    filter.addEventListener('change', renderList);
    app.querySelector('[data-export]').addEventListener('click', async () => {
      const latest = await loadCards();
      download(`poptriq-kort-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(latest, null, 2));
    });
    app.querySelector('[data-logout]').addEventListener('click', async () => {
      if (dirty && !window.confirm('Du har osparade ändringar. Vill du logga ut?')) return;
      dirty = false;
      window.removeEventListener('beforeunload', warnBeforeLeave);
      await client.auth.signOut();
      renderLogin(client);
    });

    renderList();
    renderEditor();
  }
}
