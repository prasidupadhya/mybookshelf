const COPY = {
  en: {
    label: 'Interactive book', controls: 'Book view controls',
    keys: 'Arrow keys rotate, plus and minus zoom, Home resets, Space toggles spin.',
    loading: 'Preparing the book…', fallback: 'Simple 3D preview. Drag or use the controls to explore.',
    unavailable: 'Interactive preview unavailable. The cover and book details are still available.',
    coverUnavailable: 'Cover unavailable. Showing a titled cover instead.',
    left: 'Rotate left', right: 'Rotate right', up: 'Rotate up', down: 'Rotate down',
    in: 'Zoom in', out: 'Zoom out', reset: 'Reset', spin: 'Auto-rotate',
    resetShort: 'Reset', spinStart: 'Spin',
  },
  es: {
    label: 'Libro interactivo', controls: 'Controles de vista del libro',
    keys: 'Flechas para girar, más y menos para zoom, Inicio para restablecer, Espacio para girar automáticamente.',
    loading: 'Preparando el libro…', fallback: 'Vista 3D sencilla. Arrastra o usa los controles para explorar.',
    unavailable: 'Vista interactiva no disponible. La portada y los detalles siguen disponibles.',
    coverUnavailable: 'Portada no disponible. Se muestra el título en su lugar.',
    left: 'Girar a la izquierda', right: 'Girar a la derecha', up: 'Girar hacia arriba', down: 'Girar hacia abajo',
    in: 'Acercar', out: 'Alejar', reset: 'Restablecer', spin: 'Giro automático',
    resetShort: 'Inicio', spinStart: 'Girar',
  }
};

export function setViewerLanguage(root, book, language) {
  const copy = COPY[language] || COPY.en;
  root.querySelector('[data-viewer-stage]').setAttribute('aria-label', `${copy.label}: ${book.title[language]}`);
  root.querySelector('[data-viewer-stage]').setAttribute('aria-description', copy.keys);
  root.querySelector('[data-viewer-controls]').setAttribute('aria-label', copy.controls);
  root.querySelectorAll('[data-viewer-action]').forEach(button => {
    const action = button.dataset.viewerAction;
    button.setAttribute('aria-label', copy[action]);
    button.title = copy[action];
    if (action === 'reset') button.textContent = copy.resetShort;
    if (action === 'spin') button.textContent = copy.spinStart;
  });
  return copy;
}
