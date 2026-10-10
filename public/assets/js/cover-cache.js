// Shared by the shelf's intent prefetch and the 3D viewer, so each cover texture downloads once per visit.
const covers = new Map();

export function loadCoverBlob(url) {
  if (!covers.has(url)) {
    const request = fetch(url, { mode: 'cors', signal: AbortSignal.timeout(15000) })
      .then(response => { if (!response.ok) throw new Error('Cover unavailable'); return response.blob(); });
    // A failed download can be retried the next time the book is opened.
    request.catch(() => covers.delete(url));
    covers.set(url, request);
  }
  return covers.get(url);
}
