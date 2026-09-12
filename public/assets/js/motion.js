const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const supports3D = CSS.supports("perspective", "1px") && CSS.supports("transform-style", "preserve-3d");

let pendingSelection = null;

export function cancelBookSelection() {
  if (!pendingSelection) return;
  window.clearTimeout(pendingSelection.timer);
  pendingSelection.book.classList.remove("is-pulled");
  pendingSelection = null;
}

// A touch selection gets the same pull-out as hover, then opens the usual dialog.
// Keyboard activation and reduced motion keep immediate access to the details.
export function selectBook(book, event, openDetails) {
  cancelBookSelection();
  const isTouch = event.pointerType === "touch" || event.pointerType === "pen"
    || (!finePointer.matches && event.detail > 0);

  if (!isTouch || reduceMotion.matches || !supports3D) {
    openDetails();
    return;
  }

  book.classList.add("is-pulled");
  pendingSelection = {
    book,
    openDetails,
    timer: window.setTimeout(() => {
      if (book.isConnected) openDetails();
      cancelBookSelection();
    }, 340)
  };
}

export function initMotion() {
  reduceMotion.addEventListener("change", () => {
    if (!reduceMotion.matches || !pendingSelection) return;
    const { book, openDetails } = pendingSelection;
    cancelBookSelection();
    if (book.isConnected) openDetails();
  });

  document.addEventListener("pointerdown", (event) => {
    if (pendingSelection && !pendingSelection.book.contains(event.target)) cancelBookSelection();
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cancelBookSelection();
  });
}
