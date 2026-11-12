(() => {
  'use strict';
  const root = document.documentElement;
  const shell = document.getElementById('rr-portfolio-shell');
  const overlay = document.getElementById('rr-intro');
  const video = document.getElementById('rr-intro-video');
  const replay = document.getElementById('rr-intro-replay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'rhyan-portfolio-intro-v1';
  const endTime = 3.9;
  let state = 'idle';
  let frame = 0;
  let loadTimer = 0;
  let watchdog = 0;
  let lastFocus = null;
  let lastTime = -1;
  let lastAdvance = 0;
  let runId = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const u = clamp(value); return u ** 3 * (10 + u * (-15 + 6 * u)); };
  const approach = value => { const u = clamp(value); return 1 - (1 - u) ** 5 * (1 + 5 * u + 15 * u ** 2); };
  const retreat = value => { const u = clamp(value); return 1 - (1 - u) ** 7 * (1 + 7 * u + 28 * u ** 2); };
  const motionReduced = () => reduced.matches || document.body.classList.contains('motion-lite');

  function clearBoot() {
    if (window.rrIntroBootTimer) clearTimeout(window.rrIntroBootTimer);
    delete window.rrIntroBootTimer;
  }

  function finish(reason = 'complete') {
    const wasActive = state === 'loading' || state === 'playing';
    const restoreFocus = overlay.contains(document.activeElement);
    state = 'idle';
    runId += 1;
    clearBoot();
    clearTimeout(loadTimer);
    clearTimeout(watchdog);
    cancelAnimationFrame(frame);
    video.pause();
    video.muted = true;
    overlay.hidden = true;
    shell.inert = false;
    root.classList.remove('rr-intro-pending', 'rr-intro-active');
    ['--rr-intro-blur', '--rr-intro-brightness', '--rr-intro-scale', '--rr-intro-origin'].forEach(name => shell.style.removeProperty(name));
    if (wasActive) {
      try { sessionStorage.setItem(storageKey, 'seen'); } catch {}
      if (restoreFocus) {
        // Restore a keyboard-activated replay; automatic playback has no link to focus.
        if (lastFocus?.isConnected && !lastFocus.closest('[hidden], [inert]') && lastFocus.getClientRects().length) {
          lastFocus.focus({ preventScroll: true });
        } else {
          overlay.blur();
        }
      }
      document.dispatchEvent(new CustomEvent('portfolio-intro-end', { detail: { reason } }));
    }
  }

  function paint() {
    if (state !== 'playing') return;
    const t = video.currentTime;
    if (t >= endTime) { finish(); return; }
    if (t !== lastTime) { lastTime = t; lastAdvance = performance.now(); }
    if (performance.now() - lastAdvance > 1600) { finish('stalled'); return; }
    const blur = 1 - smooth((t - 2.67) / (3.9 - 2.67));
    let presence = 0;
    if (t > 1.95 && t < 2.37) presence = approach((t - 1.95) / .42);
    else if (t >= 2.37 && t <= 2.51) presence = 1;
    else if (t > 2.51 && t < 3.11) presence = 1 - retreat((t - 2.51) / .60);
    const radius = Math.min(26, Math.max(14, innerWidth * 25 / 1280));
    shell.style.setProperty('--rr-intro-blur', (radius * blur * (1 + .22 * presence)).toFixed(2) + 'px');
    shell.style.setProperty('--rr-intro-brightness', (1 - .09 * blur).toFixed(3));
    shell.style.setProperty('--rr-intro-scale', (1 + .055 * presence).toFixed(4));
    frame = requestAnimationFrame(paint);
  }

  function start(event) {
    if (state !== 'idle') return;
    if (motionReduced() || document.hidden) { finish('unavailable'); return; }
    clearBoot();
    state = 'loading';
    const currentRun = ++runId;
    lastFocus = event?.currentTarget === replay && event.detail === 0 ? replay : null;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    shell.style.setProperty('--rr-intro-origin', (innerHeight / 2) + 'px');
    shell.inert = true;
    root.classList.add('rr-intro-active');
    root.classList.remove('rr-intro-pending');
    overlay.hidden = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.poster = 'assets/intro-metal-cinema-v1-poster.jpg';
    if (!video.getAttribute('src')) video.src = 'assets/intro-metal-cinema-v2.mp4';
    else video.currentTime = 0;
    overlay.focus({ preventScroll: true });
    loadTimer = setTimeout(() => finish('load-timeout'), 3000);
    watchdog = setTimeout(() => finish('watchdog'), 7000);
    try {
      const playback = video.play();
      if (playback) playback.catch(() => { if (state !== 'idle' && runId === currentRun) finish('autoplay-blocked'); });
    } catch { finish('autoplay-blocked'); }
  }

  video.addEventListener('playing', () => {
    if (state === 'idle') { video.pause(); return; }
    clearTimeout(loadTimer);
    state = 'playing';
    lastAdvance = performance.now();
    lastTime = -1;
    cancelAnimationFrame(frame);
    paint();
  });
  video.addEventListener('ended', () => finish());
  video.addEventListener('error', () => finish('media-error'));
  replay.addEventListener('click', start);
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Tab') event.preventDefault();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state !== 'idle') finish('hidden'); });
  window.addEventListener('pagehide', () => finish('navigation'));
  window.addEventListener('hashchange', () => { if (state !== 'idle') finish('navigation'); });
  window.addEventListener('resize', () => {
    if (state !== 'idle') shell.style.setProperty('--rr-intro-origin', (innerHeight / 2) + 'px');
  }, { passive: true });
  function updateMotion() {
    replay.hidden = motionReduced();
    if (motionReduced()) finish('reduced-motion');
  }
  reduced.addEventListener('change', updateMotion);
  document.addEventListener('portfolio-motion-change', updateMotion);
  updateMotion();
  if (root.classList.contains('rr-intro-pending') && window.scrollY < 20) start();
  else finish('not-requested');
})();
