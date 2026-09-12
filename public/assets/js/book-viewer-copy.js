const COPY = {
  en: {
    label: 'Interactive book', controls: 'Book view controls',
    help: 'Drag to turn · Scroll or pinch to zoom. Arrow keys turn; + / − zoom; Home resets.',
    loading: 'Preparing the book…', fallback: 'Simple 3D preview. Drag or use the controls to explore.',
    unavailable: 'Interactive preview unavailable. The cover and book details are still available.',
    coverUnavailable: 'Cover unavailable. Showing a titled cover instead.',
    left: 'Rotate left', right: 'Rotate right', up: 'Rotate up', down: 'Rotate down',
    in: 'Zoom in', out: 'Zoom out', reset: 'Reset', spin: 'Auto-rotate',
    resetShort: 'Reset', pause: 'Pause', spinStart: 'Spin',
  },
  es: {
    label: 'Libro interactivo', controls: 'Controles de vista del libro',
    help: 'Arrastra para girar · Pellizca o usa la rueda para acercar. Flechas: girar; + / −: zoom; Inicio: restablecer.',
    loading: 'Preparando el libro…', fallback: 'Vista 3D sencilla. Arrastra o usa los controles para explorar.',
    unavailable: 'Vista interactiva no disponible. La portada y los detalles siguen disponibles.',
    coverUnavailable: 'Portada no disponible. Se muestra el título en su lugar.',
    left: 'Girar a la izquierda', right: 'Girar a la derecha', up: 'Girar hacia arriba', down: 'Girar hacia abajo',
    in: 'Acercar', out: 'Alejar', reset: 'Restablecer', spin: 'Giro automático',
    resetShort: 'Inicio', pause: 'Pausa', spinStart: 'Girar',
  }
};

export function setViewerLanguage(root, book, language) {
  const copy = COPY[language] || COPY.en;
  root.querySelector('[data-viewer-stage]').setAttribute('aria-label', `${copy.label}: ${book.title[language]}`);
  root.querySelector('[data-viewer-help]').textContent = copy.help;
  root.querySelector('[data-viewer-controls]').setAttribute('aria-label', copy.controls);
  root.querySelectorAll('[data-viewer-action]').forEach(button => {
    const action = button.dataset.viewerAction;
    button.setAttribute('aria-label', copy[action]);
    button.title = copy[action];
    if (action === 'reset') button.textContent = copy.resetShort;
    if (action === 'spin') button.textContent = button.getAttribute('aria-pressed') === 'true' ? copy.pause : copy.spinStart;
  });
  return copy;
}
