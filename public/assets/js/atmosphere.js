// One composited light pool; nothing runs continuously or follows touch input.
export function initAtmosphere() {
  const room = document.querySelector('[data-room-light]');
  if (!room) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let x = 0, y = 0;
  let books = [];

  const tracks = () => fine.matches && !reduced.matches
    && document.documentElement.dataset.theme === 'dark'
    && !document.body.classList.contains('has-open-bookplate');
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    room.style.removeProperty('--lamp-x');
    room.style.removeProperty('--lamp-y');
    books.forEach(book => book.style.removeProperty('--book-illumination'));
  }
  function paint() {
    frame = 0;
    if (!tracks()) return;
    room.style.setProperty('--lamp-x', `${x}px`);
    room.style.setProperty('--lamp-y', `${y}px`);
    // Only cover faces receive the extra light: arbitrary spine label colors
    // keep their measured contrast. The shared perspective stays unflattened.
    books.forEach(book => {
      const rect = book.getBoundingClientRect();
      const distance = Math.hypot(x - rect.x - rect.width / 2, y - rect.y - rect.height / 2);
      book.style.setProperty('--book-illumination', String(Math.max(0, 1 - distance / 480) * .7));
    });
  }
  document.addEventListener('pointermove', event => {
    if (!tracks() || event.pointerType !== 'mouse') return;
    x = event.clientX; y = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', reset, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  fine.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
  new MutationObserver(reset).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(() => { books = [...document.querySelectorAll('[data-book]')]; }).observe(
    document.querySelector('[data-bookcase]'), { childList: true, subtree: true }
  );
}
