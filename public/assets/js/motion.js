const root = document.documentElement;
const bookcase = document.querySelector("[data-bookcase]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

let frame = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight * 0.18;

function resetBook(book) {
  if (!book) return;
  book.style.removeProperty("--book-rotate-x");
  book.style.removeProperty("--book-rotate-y");
}

function applyPointerMotion() {
  frame = 0;
  if (reduceMotion.matches || !finePointer.matches) return;

  const xPercent = Math.min(100, Math.max(0, (pointerX / window.innerWidth) * 100));
  const yPercent = Math.min(100, Math.max(0, (pointerY / window.innerHeight) * 100));
  root.style.setProperty("--light-x", `${xPercent.toFixed(2)}%`);
  root.style.setProperty("--light-y", `${yPercent.toFixed(2)}%`);

  const rect = bookcase.getBoundingClientRect();
  if (
    pointerX >= rect.left && pointerX <= rect.right &&
    pointerY >= rect.top && pointerY <= rect.bottom
  ) {
    const normalizedX = (pointerX - rect.left) / rect.width - 0.5;
    const normalizedY = (pointerY - rect.top) / rect.height - 0.5;
    bookcase.style.setProperty("--case-tilt-y", `${(normalizedX * 2.6).toFixed(2)}deg`);
    bookcase.style.setProperty("--case-tilt-x", `${(-normalizedY * 1.8).toFixed(2)}deg`);
  }
}

function schedulePointerMotion(event) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!frame) frame = window.requestAnimationFrame(applyPointerMotion);
}

function resetCaseTilt() {
  bookcase.style.setProperty("--case-tilt-x", "0deg");
  bookcase.style.setProperty("--case-tilt-y", "0deg");
}

function updateBookTilt(event) {
  if (reduceMotion.matches || !finePointer.matches) return;
  const book = event.target.closest(".book");
  if (!book) return;

  const rect = book.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  book.style.setProperty("--book-rotate-y", `${(x * 2.4).toFixed(2)}deg`);
  book.style.setProperty("--book-rotate-x", `${(-y * 1.4).toFixed(2)}deg`);
}

function handleBookPointerOut(event) {
  const book = event.target.closest(".book");
  if (!book) return;
  const nextBook = event.relatedTarget?.closest?.(".book");
  if (book !== nextBook) resetBook(book);
}

function syncMotionPreference() {
  if (reduceMotion.matches || !finePointer.matches) {
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    resetCaseTilt();
    document.querySelectorAll(".book").forEach(resetBook);
    root.style.setProperty("--light-x", "50%");
    root.style.setProperty("--light-y", "18%");
  }
}

export function initMotion() {
  document.addEventListener("pointermove", schedulePointerMotion, { passive: true });
  bookcase.addEventListener("pointermove", updateBookTilt, { passive: true });
  bookcase.addEventListener("pointerout", handleBookPointerOut, { passive: true });
  bookcase.addEventListener("pointerleave", resetCaseTilt, { passive: true });
  reduceMotion.addEventListener("change", syncMotionPreference);
  finePointer.addEventListener("change", syncMotionPreference);
  syncMotionPreference();
}
