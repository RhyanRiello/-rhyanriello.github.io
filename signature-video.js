(() => {
  'use strict';
  const video = document.getElementById('signature-video');
  const button = document.getElementById('signature-toggle');
  const block = video.closest('.signature-block');
  let visible = false;
  let userPaused = false;
  let playBlocked = false;
  const wantsPlayback = () => visible && !userPaused && !document.hidden && !document.body.classList.contains('motion-lite');

  video.muted = true;
  video.defaultMuted = true;

  function updateButton() {
    button.setAttribute('aria-pressed', String(userPaused));
    button.textContent = userPaused ? 'Retomar animação' : playBlocked ? 'Reproduzir animação' : 'Pausar animação';
  }

  function syncPlayback() {
    if (!wantsPlayback()) {
      video.pause();
      if (document.body.classList.contains('motion-lite') && video.readyState > 0) video.currentTime = 0;
      return;
    }
    const playback = video.play();
    if (playback) playback.catch(error => {
      if (error.name === 'AbortError' || !wantsPlayback()) return;
      playBlocked = true;
      updateButton();
    });
  }

  video.addEventListener('playing', () => {
    if (!wantsPlayback()) { video.pause(); return; }
    playBlocked = false;
    block.dataset.playback = 'playing';
    updateButton();
  });
  video.addEventListener('pause', () => { block.dataset.playback = 'paused'; });
  video.addEventListener('error', () => {
    block.dataset.playback = 'unavailable';
    button.hidden = true;
  });

  button.addEventListener('click', () => {
    userPaused = playBlocked ? false : !userPaused;
    playBlocked = false;
    updateButton();
    syncPlayback();
  });

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncPlayback();
  }, { threshold: 0.1 }).observe(video);
  document.addEventListener('portfolio-motion-change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
})();
