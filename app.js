import { movies } from './movies.js';
import { loadCard, loadCards, youtubeId } from './cards.js';

const basePath = window.POPTRIQ_BASE_PATH || '';
const app = document.querySelector('#app');
const brand = document.querySelector('.brand');
const logo = document.querySelector('[data-brand-logo]');
const rawPath = location.pathname.startsWith(basePath)
  ? location.pathname.slice(basePath.length)
  : location.pathname;
const path = rawPath.replace(/\/+$/, '') || '/';
const params = new URLSearchParams(location.search);
const singlePlay = params.get('version') === 'single';
const totalPlays = singlePlay ? 1 : 2;

logo.src = `${basePath}/assets/poptriq-logo.png`;

function siteUrl(route) {
  return `${location.origin}${basePath}${route}`;
}

function setPageState(state) {
  document.body.dataset.state = state;
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.append(script);
    }
  });
}

function requestFullscreen(element) {
  const enter = element.requestFullscreen || element.webkitRequestFullscreen || element.msRequestFullscreen;
  if (!enter) return Promise.resolve();
  try {
    return Promise.resolve(enter.call(element)).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

async function exitFullscreen() {
  const leave = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (!leave || !(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement)) return;
  try { await leave.call(document); } catch {}
}

function movieResult(movie, onReplay) {
  const result = document.createElement('section');
  result.className = 'round-result';
  const label = document.createElement('p');
  label.className = 'result-kicker';
  label.textContent = 'FILMEN VAR';
  const title = document.createElement('h2');
  title.textContent = movie.title;
  title.tabIndex = -1;
  result.append(label, title);
  if (movie.id && movie.questions?.length) {
    const answer = document.createElement('a');
    answer.className = 'replay-button';
    answer.href = siteUrl('/answer/' + movie.id);
    answer.textContent = 'Visa facit';
    result.append(answer);
  }
  const replay = document.createElement('button');
  replay.className = 'replay-button';
  replay.type = 'button';
  replay.textContent = 'Spela igen';
  replay.addEventListener('click', onReplay);
  result.append(replay);
  return result;
}

function showMovie(id, card) {
  const source = movies[id] || (card ? {
    youtubeId: youtubeId(card.link),
    start: 20,
    end: 40,
  } : null);

  if (!source?.youtubeId) return showMissing();

  setPageState('ready');
  app.innerHTML = '';

  const screen = document.createElement('section');
  screen.className = 'movie-screen';

  const intro = document.createElement('div');
  intro.className = 'movie-intro';
  intro.innerHTML = '<p class="category-label">FILM</p>';

  const stage = document.createElement('div');
  stage.className = 'player-stage';

  const frame = document.createElement('div');
  frame.className = 'video-frame';
  frame.hidden = true;
  const playerMount = document.createElement('div');
  playerMount.id = `yt-${String(id).replace(/[^a-z0-9]/gi, '-')}`;
  frame.append(playerMount);

  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'play-button';
  startButton.setAttribute('aria-label', 'Spela filmklippet');
  startButton.innerHTML = '<span class="play-mark" aria-hidden="true"></span><span>PLAY CLIP</span>';

  const support = document.createElement('p');
  support.className = 'support-copy';
  support.textContent = 'Titta noga. Gissa filmen.';

  const status = document.createElement('p');
  status.className = 'playback-status';
  status.setAttribute('aria-live', 'polite');

  stage.append(frame, startButton);
  screen.append(intro, stage, support, status);
  app.append(screen);

  let player;
  let timer;
  let plays = 0;
  let ending = false;
  let readyResolve;
  const playerReady = new Promise((resolve) => { readyResolve = resolve; });

  loadYouTubeApi().then(() => {
    player = new window.YT.Player(playerMount.id, {
      videoId: source.youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        disablekb: 0,
        enablejsapi: 1,
        end: source.end,
        fs: 1,
        hl: 'sv',
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 0,
        rel: 0,
        start: source.start,
      },
      events: {
        onReady: readyResolve,
        onStateChange: ({ data }) => {
          if (data === window.YT.PlayerState.PLAYING) monitorEnd();
          if (data === window.YT.PlayerState.ENDED) finishPlay();
        },
      },
    });
  });

  function clearTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function monitorEnd() {
    clearTimer();
    timer = window.setInterval(() => {
      if (!player?.getCurrentTime) return;
      if (player.getCurrentTime() >= source.end - 0.12) finishPlay();
    }, 120);
  }

  function finishPlay() {
    if (ending) return;
    ending = true;
    clearTimer();
    player?.pauseVideo?.();
    plays += 1;

    if (plays < totalPlays) {
      status.textContent = `Visning ${plays + 1} av ${totalPlays}`;
      window.setTimeout(() => {
        ending = false;
        player.seekTo(source.start, true);
        player.playVideo();
      }, 450);
      return;
    }

    const duration = player?.getDuration?.();
    if (duration > 0) player.seekTo(duration, true);
    player?.pauseVideo?.();
    exitFullscreen().finally(showResult);
  }

  function showResult() {
    clearTimer();
    setPageState('complete');
    screen.classList.remove('started');
    screen.classList.add('completed');
    frame.hidden = false;
    support.hidden = true;
    status.textContent = '';
    screen.querySelector('.round-result')?.remove();
    const result = movieResult(card || { title: source.title || 'Filmklippet är slut' }, startPlayback);
    screen.append(result);
    result.querySelector('h2').focus({ preventScroll: true });
    result.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  async function startPlayback() {
    ending = false;
    plays = 0;
    setPageState('playing');
    screen.classList.remove('completed');
    screen.classList.add('started');
    screen.querySelector('.round-result')?.remove();
    frame.hidden = false;
    support.hidden = false;
    status.textContent = totalPlays > 1 ? `Visning 1 av ${totalPlays}` : '';

    requestFullscreen(frame);
    await playerReady;
    player.seekTo(source.start, true);
    player.playVideo();
  }

  startButton.addEventListener('click', startPlayback);
}

function showAnswer(card) {
  if (!card) return showMissing();
  setPageState('answer');
  app.innerHTML = `
    <section class="answer-card">
      <p class="category-label">FACIT · ${card.id}</p>
      <h1>${card.title}</h1>
      ${card.artist ? `<p class="artist">${card.artist}</p>` : ''}
      <ol>${card.questions.map((answer) => `<li>${answer}</li>`).join('')}</ol>
    </section>
  `;
}

async function showAdmin() {
  setPageState('admin');
  const [movieCards, musicCards] = await Promise.all([loadCards('movie'), loadCards('music')]);
  const rows = [
    ...Object.keys(movies).map((id) => ({ type: 'movie', id, label: `Äldre filmkort ${id}` })),
    ...movieCards.map((card) => ({ ...card, label: card.title })),
    ...musicCards.map((card) => ({ ...card, label: card.title })),
  ];
  app.innerHTML = `
    <section class="admin-panel">
      <p class="category-label">POPTRIQ</p>
      <h1>Kortlänkar</h1>
      <div class="admin-list">
        ${rows.map((row) => {
          const playRoute = row.type === 'music' ? `/music/${row.id}` : `/movie/${row.id}`;
          const answer = row.title ? `<a href="${basePath}/answer/${row.id}">Facit</a>` : '';
          return `<article><div><strong>${row.id}</strong><span>${row.label}</span></div><div><a href="${basePath}${playRoute}">Öppna</a>${answer}</div><small>${siteUrl(playRoute)}</small></article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function showMissing() {
  setPageState('missing');
  app.innerHTML = '<section class="message-card"><p class="category-label">POPTRIQ</p><h1>Kortet hittades inte</h1><p>Kontrollera QR-koden och försök igen.</p></section>';
}

async function route() {
  if (path === '/admin') return showAdmin();
  if (path === '/') {
    setPageState('home');
    app.innerHTML = '<section class="message-card"><p class="category-label">POPTRIQ</p><h1>Skanna ett spelkort</h1><p>Den här sidan öppnas via spelets QR-koder.</p></section>';
    return;
  }

  const legacyId = path.match(/^\/(\d+)$/)?.[1];
  if (legacyId) return showMovie(legacyId, null);

  const match = path.match(/^\/(movie|music|answer)\/([^/]+)$/i);
  if (!match) return showMissing();
  const [, type, id] = match;

  if (type.toLowerCase() === 'music') {
    const card = await loadCard('music', id);
    if (!card?.link) return showMissing();
    location.replace(card.link);
    return;
  }

  if (type.toLowerCase() === 'answer') {
    const kind = String(id).toUpperCase().startsWith('M') ? 'music' : 'movie';
    return showAnswer(await loadCard(kind, id));
  }

  const card = await loadCard('movie', id);
  showMovie(id, card);
}

route();
