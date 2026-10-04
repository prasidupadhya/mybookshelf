// One composited light pool; nothing runs continuously or follows touch input.
export function initAtmosphere() {
  const room = document.querySelector('[data-room-light]');
  if (!room) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let x = 0, y = 0;
  let hasPointer = false;
  let books = [];
  let positions = null;

  const tracks = () => fine.matches && !reduced.matches
    && document.documentElement.dataset.theme === 'dark'
    && !document.body.classList.contains('has-open-bookplate');
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    hasPointer = false;
    positions = null;
    room.style.removeProperty('--lamp-x');
    room.style.removeProperty('--lamp-y');
    books.forEach(book => book.style.removeProperty('--book-illumination'));
  }
  function paint() {
    frame = 0;
    if (!tracks() || !hasPointer) return;
    room.style.setProperty('--lamp-x', `${x}px`);
    room.style.setProperty('--lamp-y', `${y}px`);
    // Only cover faces receive the extra light: arbitrary spine label colors
    // keep their measured contrast. The shared perspective stays unflattened.
    positions ||= books.map(book => {
      const rect = book.getBoundingClientRect();
      return { book, x: rect.x + rect.width / 2 + scrollX, y: rect.y + rect.height / 2 + scrollY, light: '' };
    });
    positions.forEach(position => {
      const distance = Math.hypot(x + scrollX - position.x, y + scrollY - position.y);
      const light = (Math.max(0, 1 - distance / 480) * .7).toFixed(2);
      if (light !== position.light) position.book.style.setProperty('--book-illumination', light);
      position.light = light;
    });
  }
  document.addEventListener('pointermove', event => {
    if (!tracks() || event.pointerType !== 'mouse') return;
    hasPointer = true;
    x = event.clientX; y = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', reset, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  fine.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
  new ResizeObserver(() => { positions = null; }).observe(document.querySelector('[data-bookcase]'));
  window.addEventListener('resize', () => { positions = null; }, { passive: true });
  window.addEventListener('scroll', () => { if (tracks() && !frame) frame = requestAnimationFrame(paint); }, { passive: true });
  new MutationObserver(reset).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(() => { books = [...document.querySelectorAll('[data-book]')]; positions = null; }).observe(
    document.querySelector('[data-bookcase]'), { childList: true, subtree: true }
  );
}
