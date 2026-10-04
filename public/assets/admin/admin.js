import { getReadableInk, pickCoverColor } from '../js/book-appearance.js';

const $ = selector => document.querySelector(selector);
const form = $('#book-form');
const editor = $('#book-editor');
const shelves = [
  ['currently_reading', 'Currently reading'], ['want_to_read', 'Want to read'], ['read', 'Read']
];
const nullable = ['title_es', 'cover_url', 'back_cover_url', 'cover_texture_url', 'goodreads_url', 'spine_title_override'];
let books = [], editingId = null, savedForm = '', dirty = false, saving = false;
let slugTouched = false, previewTimer = 0, draggedId = null, resumeDraft = false;
let previewViewer = null, previewSession = 0, previewImport = null;
let colorTimer = 0, colorSession = 0, manualColorRevision = 0, queuedColorRevision = 0, colorRequest = null;

function node(tag, text, attributes = {}) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  Object.assign(element, attributes); return element;
}

function toast(message, error = false) {
  const box = node('div', undefined, { className: 'toast' });
  if (error) box.setAttribute('role', 'alert');
  box.append(node('span', message));
  const dismiss = node('button', '×', { type: 'button' }); dismiss.setAttribute('aria-label', 'Dismiss notification');
  dismiss.addEventListener('click', () => box.remove()); box.append(dismiss);
  $('#toasts').replaceChildren(box);
  if (!error) window.setTimeout(() => box.remove(), 7000);
}

async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api/admin/${path}`, {
      method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(20000),
      headers: { 'X-Requested-With': 'fetch', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch { throw new Error('Unable to reach the server. Your changes have not been confirmed; refresh before retrying.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('The server could not complete the request. Please try again.'); }
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') {
      resumeDraft = editor.open;
      if (editor.open) editor.close(); showLogin('Your session expired. Sign in again; your editor draft is kept in this tab.');
    }
    throw new Error(data.error || 'The request could not be completed');
  }
  return data;
}

function showLogin(message = '') {
  $('#boot-status').hidden = true; $('#dashboard').hidden = true; $('#logout').hidden = true;
  $('#login-panel').hidden = false; $('#account-status').textContent = 'Private administration';
  $('#login-error').textContent = message; $('#username').focus();
}

async function showDashboard(user) {
  $('#account-status').textContent = `Signed in as ${user.username}`;
  await loadBooks();
  $('#boot-status').hidden = true; $('#login-panel').hidden = true;
  $('#dashboard').hidden = false; $('#logout').hidden = false;
  if (resumeDraft) { resumeDraft = false; editor.showModal(); previewBook(); }
  else $('#add-book').focus();
}

async function loadBooks() {
  const data = await api('books'); books = data.books; renderShelves();
}

function setBusy(value) {
  saving = value;
  $('#dashboard').querySelectorAll('button, select').forEach(element => { element.disabled = value; });
  $('#logout').disabled = value;
  form.querySelectorAll('.editor-fields input, .editor-fields textarea, .editor-fields select, .editor-fields button, .editor-footer button').forEach(element => { element.disabled = value; });
  $('#close-editor').disabled = value;
  if (!value) { form.elements.spine_author_override.disabled = $('#inherit-author').checked; renderShelves(); }
}

function button(label, action, book, accessibleLabel = label) {
  const element = node('button', label, { type: 'button', className: 'admin-button' });
  element.dataset.action = action; element.dataset.id = book.id;
  element.setAttribute('aria-label', accessibleLabel); return element;
}

function renderShelves() {
  const focused = document.activeElement;
  const focusId = focused?.dataset.id, focusAction = focused?.dataset.action;
  $('#collection-count').textContent = `${books.length} ${books.length === 1 ? 'book' : 'books'}`;
  const columns = shelves.map(([shelf, label]) => {
    const column = node('section', undefined, { className: 'shelf-column' }); column.dataset.shelf = shelf;
    const group = books.filter(book => book.shelf === shelf).sort((a, b) => a.sort_order - b.sort_order);
    const heading = node('h2', label); heading.id = `admin-${shelf}`;
    heading.append(node('span', String(group.length), { className: 'shelf-count' }));
    column.setAttribute('aria-labelledby', heading.id); column.append(heading);
    const list = node('ul', undefined, { className: 'shelf-list' });
    group.forEach((book, index) => {
      const card = node('li', undefined, { className: 'book-card', draggable: !saving }); card.dataset.id = book.id;
      const summary = node('div', undefined, { className: 'card-summary' });
      const image = node('img', undefined, { className: 'card-cover', alt: '', loading: 'lazy' });
      if (book.cover_url) image.src = book.cover_url;
      image.addEventListener('error', () => { image.removeAttribute('src'); image.style.visibility = 'hidden'; });
      const copy = node('div');
      const title = button(book.title, 'edit', book, `Edit ${book.title}`); title.className = 'card-title';
      copy.append(title, node('p', book.author, { className: 'card-author' }));
      if (book.page_count) copy.append(node('p', `${book.page_count} pages`, { className: 'card-author' }));
      summary.append(image, copy); card.append(summary);
      const actions = node('div', undefined, { className: 'card-actions' });
      if (shelf === 'want_to_read') actions.append(button('Start reading', 'start', book, `Start reading ${book.title}`));
      if (shelf === 'currently_reading') actions.append(button('Mark as read', 'finish', book, `Mark ${book.title} as read`));
      const move = node('select'); move.dataset.action = 'move'; move.dataset.id = book.id;
      move.setAttribute('aria-label', `Move ${book.title} to a shelf`);
      shelves.forEach(([id, name]) => move.append(node('option', name, { value: id, selected: id === shelf })));
      const up = button('↑', 'up', book, `Move ${book.title} up`); up.disabled = saving || index === 0;
      const down = button('↓', 'down', book, `Move ${book.title} down`); down.disabled = saving || index === group.length - 1;
      actions.append(move, up, down, button('Edit', 'edit', book, `Edit ${book.title}`), button('Delete', 'delete', book, `Delete ${book.title}`));
      if (saving) actions.querySelectorAll('button, select').forEach(element => { element.disabled = true; });
      card.append(actions); list.append(card);
    });
    if (!group.length) list.append(node('li', 'No books on this shelf yet.', { className: 'empty-shelf' }));
    column.append(list); return column;
  });
  $('#admin-shelves').replaceChildren(...columns);
  if (focusId && focusAction) {
    const next = $('#admin-shelves').querySelector(`[data-id="${focusId}"][data-action="${focusAction}"]:not(:disabled)`)
      || $('#admin-shelves').querySelector(`[data-id="${focusId}"][data-action="edit"]`);
    next?.focus({ preventScroll: true });
  }
}

function localDate(value) {
  if (!value) return '';
  const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 19);
}

function formData() {
  // Disabled inputs still need to be represented when comparing drafts or restoring after a save.
  const data = Object.fromEntries([...form.querySelectorAll('[name]')].map(input => [input.name, input.value]));
  for (const key of nullable) data[key] = data[key].trim() || null;
  data.page_count = data.page_count === '' ? null : Number(data.page_count);
  data.cover_aspect = Number(data.cover_aspect);
  data.spine_author_override = $('#inherit-author').checked ? null : data.spine_author_override;
  for (const key of ['started_at', 'finished_at']) data[key] = data[key] ? new Date(data[key]).toISOString() : null;
  return data;
}

function markDirty() {
  try { dirty = JSON.stringify(formData()) !== savedForm; } catch { dirty = true; }
  $('#save-status').textContent = dirty ? 'Unsaved changes' : '';
}

function syncColors() {
  form.querySelectorAll('[data-color-for]').forEach(picker => {
    const hex = form.elements[picker.dataset.colorFor].value;
    if (/^#[a-f0-9]{6}$/i.test(hex)) picker.value = hex;
  });
}

function previewUrl(value) {
  if (!value) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

async function previewBook() {
  const value = name => form.elements[name].value;
  const spineColor = /^#[a-f0-9]{6}$/i.test(value('spine_color')) ? value('spine_color') : '#b99a5b';
  const book = {
    id: 'admin-preview', title: { en: value('title') || 'Untitled book', es: value('title_es') || value('title') || 'Untitled book' }, author: value('author') || 'Author',
    pageCount: Number(value('page_count')) || null,
    coverAspect: Math.min(2, Math.max(.2, Number(value('cover_aspect')) || .625)),
    accentColor: spineColor, spineColor,
    spineTextColor: /^#[a-f0-9]{6}$/i.test(value('spine_text_color')) ? value('spine_text_color') : getReadableInk(spineColor),
    backColor: /^#[a-f0-9]{6}$/i.test(value('back_color')) ? value('back_color') : spineColor,
    spineTitle: value('spine_title_override'), spineAuthor: $('#inherit-author').checked ? undefined : value('spine_author_override'),
    coverUrl: previewUrl(value('cover_url')), backCoverUrl: previewUrl(value('back_cover_url'))
  };
  const texture = value('cover_texture_url').trim();
  const coverSource = previewUrl(texture) || book.coverUrl;
  book.coverTextureUrl = coverSource ? `/api/admin/cover?url=${encodeURIComponent(coverSource)}` : null;
  book.backCoverTextureUrl = book.backCoverUrl ? `/api/admin/cover?url=${encodeURIComponent(book.backCoverUrl)}` : null;
  const session = ++previewSession;
  const root = $('#live-preview'), image = $('#preview-cover');
  root.style.setProperty('--cover-aspect', book.coverAspect);
  root.style.setProperty('--book-binding', book.spineColor); root.style.setProperty('--book-spine', book.spineColor);
  root.style.setProperty('--book-back', book.backColor); root.style.setProperty('--plate-accent', book.accentColor);
  image.hidden = !book.coverUrl; $('#preview-fallback').hidden = Boolean(book.coverUrl);
  $('#preview-title').textContent = book.title.en; image.alt = `Cover of ${book.title.en}`;
  image.onload = () => {
    if (session !== previewSession) return;
    root.style.setProperty('--cover-aspect', image.naturalWidth / image.naturalHeight);
    if (form.elements.cover_url.value.trim() !== book.coverUrl || saving) return;
    const aspect = image.naturalWidth / image.naturalHeight;
    if (aspect >= .2 && aspect <= 2 && Number(form.elements.cover_aspect.value) !== aspect) {
      form.elements.cover_aspect.value = aspect; markDirty();
    }
  };
  image.onerror = () => { if (session === previewSession) { image.hidden = true; $('#preview-fallback').hidden = false; } };
  if (book.coverUrl) image.src = book.coverUrl; else image.removeAttribute('src');
  const back = root.querySelector('.bookplate__book-back'); back.replaceChildren();
  if (book.backCoverUrl) {
    const cover = node('img', undefined, { src: book.backCoverUrl, alt: '', className: 'book__back-cover' });
    cover.onerror = () => cover.remove(); back.append(cover);
  }
  $('#preview-caption').textContent = book.pageCount ? `${book.pageCount} pages` : 'Page count not set';
  if (previewViewer) { previewViewer.updateBook(book); return; }
  try {
    previewImport ||= import('../js/book-viewer.js');
    const { createBookViewer } = await previewImport;
    if (session === previewSession && editor.open) previewViewer = createBookViewer(root, book, 'en');
  } catch { if (session === previewSession) root.querySelector('[data-viewer-status]').textContent = 'Interactive preview unavailable. The cover is still available.'; }
}

function openEditor(book = null) {
  if (saving) return;
  editingId = book?.id || null; slugTouched = Boolean(book); dirty = false;
  manualColorRevision = 0; queuedColorRevision = 0; colorRequest = null;
  $('#editor-error').textContent = ''; $('#color-status').textContent = ''; form.reset();
  const defaults = {
    title: '', title_es: '', author: '', slug: '', shelf: 'want_to_read', page_count: '', cover_url: '', back_cover_url: '',
    goodreads_url: '', spine_color: '#b99a5b', back_color: '#b99a5b', spine_text_color: '#17110f', accent_color: '#b99a5b',
    spine_title_override: '', spine_author_override: '', description_en: '', description_es: '',
    started_at: '', finished_at: '', cover_aspect: .625, cover_texture_url: ''
  };
  for (const key of Object.keys(defaults)) form.elements[key].value = key.endsWith('_at') ? localDate(book?.[key]) : book?.[key] ?? defaults[key];
  if (!book?.spine_text_color) form.elements.spine_text_color.value = getReadableInk(form.elements.spine_color.value);
  $('#inherit-author').checked = book?.spine_author_override == null;
  form.elements.spine_author_override.disabled = $('#inherit-author').checked;
  $('#editor-heading').textContent = book ? 'Edit book' : 'Add book';
  savedForm = JSON.stringify(formData()); syncColors(); markDirty();
  editor.showModal(); $('#title').focus();
  editor.scrollTop = 0; previewBook();
}

function confirmAction(heading, message, label) {
  const dialog = $('#confirmation'); $('#confirm-heading').textContent = heading;
  $('#confirm-message').textContent = message; $('#confirm-accept').textContent = label;
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
    dialog.showModal(); $('#confirm-cancel').focus();
  });
}
$('#confirm-accept').addEventListener('click', () => $('#confirmation').close('confirm'));
$('#confirm-cancel').addEventListener('click', () => $('#confirmation').close('cancel'));
$('#confirmation').addEventListener('cancel', event => { event.preventDefault(); $('#confirmation').close('cancel'); });

async function closeEditor() {
  if (saving) return;
  if (dirty && !await confirmAction('Discard changes?', 'Your unsaved book edits will be discarded.', 'Discard')) return;
  dirty = false; editor.close(); $('#add-book').focus();
}
editor.addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
editor.addEventListener('close', () => {
  clearTimeout(previewTimer); clearTimeout(colorTimer); ++previewSession; ++colorSession;
  previewViewer?.dispose(); previewViewer = null;
});
$('#close-editor').addEventListener('click', closeEditor); $('#cancel-editor').addEventListener('click', closeEditor);
$('#add-book').addEventListener('click', () => openEditor());
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

form.addEventListener('input', event => {
  const input = event.target;
  if (input.name === 'slug') slugTouched = true;
  if (input.name === 'title' && !slugTouched) form.elements.slug.value = input.value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/, '');
  if (input.dataset.colorFor) form.elements[input.dataset.colorFor].value = input.value;
  if (input.dataset.colorFor || ['spine_color', 'back_color', 'spine_text_color', 'accent_color'].includes(input.name)) manualColorRevision++;
  if (input.name === 'cover_url') {
    form.elements.cover_texture_url.value = ''; ++colorSession; clearTimeout(colorTimer);
    queuedColorRevision = manualColorRevision;
    colorTimer = setTimeout(() => { colorTimer = 0; colorRequest = suggestColors({ revision: queuedColorRevision }); }, 650);
  }
  if (input.id === 'inherit-author') form.elements.spine_author_override.disabled = input.checked;
  syncColors(); markDirty(); clearTimeout(previewTimer); previewTimer = setTimeout(previewBook, 180);
});
form.elements.shelf.addEventListener('change', () => {
  const field = form.elements.shelf.value === 'currently_reading' ? 'started_at' : form.elements.shelf.value === 'read' ? 'finished_at' : null;
  if (field && !form.elements[field].value) form.elements[field].value = localDate(new Date());
  markDirty();
});

form.addEventListener('submit', async event => {
  event.preventDefault(); if (saving || !form.reportValidity()) return;
  $('#editor-error').textContent = ''; setBusy(true); $('#save-status').textContent = 'Saving…';
  try {
    // Saving immediately after pasting a cover must include its suggested colors.
    if (colorTimer) { clearTimeout(colorTimer); colorTimer = 0; colorRequest = suggestColors({ revision: queuedColorRevision }); }
    if (colorRequest) await colorRequest;
    const body = formData();
    const result = await api(editingId ? `books/${editingId}` : 'books', { method: editingId ? 'PATCH' : 'POST', body });
    books = books.filter(book => book.id !== result.book.id).concat(result.book);
    dirty = false; editor.close(); toast(editingId ? 'Book updated.' : 'Book added.');
  } catch (error) { $('#editor-error').textContent = error.message; toast(error.message, true); }
  finally { setBusy(false); $('#save-status').textContent = dirty ? 'Unsaved changes' : ''; }
});

async function coverSample(url) {
  const image = new Image(); image.crossOrigin = 'anonymous';
  const load = source => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Cover timed out')), 8000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Cover could not be sampled')); }; image.src = source;
  });
  try { await load(url); pickCoverColor(image); return { image }; }
  catch {
    const response = await fetch('/api/admin/cover', {
      method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('Cover could not be sampled');
    const blobUrl = URL.createObjectURL(await response.blob());
    try { return { image: await load(blobUrl), blobUrl }; }
    catch (error) { URL.revokeObjectURL(blobUrl); throw error; }
  }
}

async function suggestColors({ revision = manualColorRevision, explicit = false } = {}) {
  const url = form.elements.cover_texture_url.value.trim() || previewUrl(form.elements.cover_url.value);
  if (!url) { if (explicit) toast('Add a front cover URL first.', true); return; }
  const session = ++colorSession;
  $('#color-status').textContent = 'Choosing colors from your cover…';
  try {
    const { image, blobUrl } = await coverSample(url);
    if (session !== colorSession || !editor.open) { if (blobUrl) URL.revokeObjectURL(blobUrl); return; }
    const color = pickCoverColor(image);
    const aspect = image.naturalWidth / image.naturalHeight;
    if (aspect >= .2 && aspect <= 2) form.elements.cover_aspect.value = aspect;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    if (!explicit && revision !== manualColorRevision) { $('#color-status').textContent = 'Your edited colors were kept.'; markDirty(); previewBook(); return; }
    form.elements.spine_color.value = color; form.elements.back_color.value = color;
    form.elements.spine_text_color.value = getReadableInk(color);
    if (!editingId) form.elements.accent_color.value = color;
    syncColors(); markDirty(); previewBook(); $('#color-status').textContent = 'Cover colors selected. You can edit any color.';
    if (explicit) toast('Suggested spine, back and text colors applied.');
  } catch {
    if (session === colorSession) $('#color-status').textContent = 'This cover could not be sampled. You can choose the colors manually.';
  }
}
$('#pick-colors').addEventListener('click', () => { clearTimeout(colorTimer); colorTimer = 0; colorRequest = suggestColors({ explicit: true }); });

async function updateBook(book, patch, message) {
  setBusy(true);
  try {
    const { book: updated } = await api(`books/${book.id}`, { method: 'PATCH', body: patch });
    books = books.map(item => item.id === updated.id ? updated : item); toast(message);
  } catch (error) { toast(error.message, true); }
  finally { setBusy(false); }
}

async function reorder(shelf, ordered) {
  const previous = books;
  books = books.map(book => book.shelf === shelf ? { ...book, sort_order: ordered.indexOf(book.id) } : book);
  setBusy(true); renderShelves();
  try {
    const result = await api('books/reorder', { method: 'POST', body: { shelf, ids: ordered } });
    books = books.filter(book => book.shelf !== shelf).concat(result.books); toast('Shelf order saved.');
  } catch (error) { books = previous; toast(error.message, true); }
  finally { setBusy(false); }
}

$('#admin-shelves').addEventListener('click', async event => {
  const control = event.target.closest('button[data-action]'); if (!control || saving) return;
  const book = books.find(book => book.id === control.dataset.id); if (!book) return;
  const action = control.dataset.action;
  if (action === 'edit') return openEditor(book);
  if (action === 'start') return updateBook(book, { shelf: 'currently_reading', started_at: new Date().toISOString() }, 'Book moved to Currently reading.');
  if (action === 'finish') return updateBook(book, { shelf: 'read', finished_at: new Date().toISOString() }, 'Book marked as read.');
  if (action === 'up' || action === 'down') {
    const ordered = books.filter(item => item.shelf === book.shelf).sort((a, b) => a.sort_order - b.sort_order).map(item => item.id);
    const index = ordered.indexOf(book.id), next = index + (action === 'up' ? -1 : 1);
    if (next >= 0 && next < ordered.length) { [ordered[index], ordered[next]] = [ordered[next], ordered[index]]; await reorder(book.shelf, ordered); }
  }
  if (action === 'delete' && await confirmAction('Delete book?', `“${book.title}” will be removed from your bookshelf.`, 'Delete')) {
    setBusy(true);
    try { await api(`books/${book.id}`, { method: 'DELETE' }); books = books.filter(item => item.id !== book.id); toast('Book deleted.'); }
    catch (error) { toast(error.message, true); }
    finally { setBusy(false); }
  }
});
$('#admin-shelves').addEventListener('change', event => {
  const control = event.target.closest('select[data-action="move"]'); if (!control || saving) return;
  const book = books.find(book => book.id === control.dataset.id);
  if (book) updateBook(book, { shelf: control.value }, 'Book moved.');
});

$('#admin-shelves').addEventListener('dragstart', event => {
  const card = event.target.closest('.book-card'); if (!card || saving) { event.preventDefault(); return; }
  draggedId = card.dataset.id; event.dataTransfer.setData('text/plain', draggedId); event.dataTransfer.effectAllowed = 'move'; card.classList.add('is-dragging');
});
$('#admin-shelves').addEventListener('dragover', event => {
  const card = event.target.closest('.book-card'), source = books.find(book => book.id === draggedId);
  if (source && card && card.closest('[data-shelf]').dataset.shelf === source.shelf) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; card.classList.add('is-drop-target'); }
});
$('#admin-shelves').addEventListener('dragleave', event => event.target.closest('.book-card')?.classList.remove('is-drop-target'));
$('#admin-shelves').addEventListener('dragend', () => { draggedId = null; $('#admin-shelves').querySelectorAll('.is-dragging, .is-drop-target').forEach(element => element.classList.remove('is-dragging', 'is-drop-target')); });
$('#admin-shelves').addEventListener('drop', event => {
  event.preventDefault(); const target = event.target.closest('.book-card'), source = books.find(book => book.id === draggedId);
  if (!target || !source || saving || target.dataset.id === source.id || target.closest('[data-shelf]').dataset.shelf !== source.shelf) return;
  const ordered = books.filter(book => book.shelf === source.shelf && book.id !== source.id).sort((a, b) => a.sort_order - b.sort_order).map(book => book.id);
  const rect = target.getBoundingClientRect();
  ordered.splice(ordered.indexOf(target.dataset.id) + (event.clientY > rect.y + rect.height / 2 ? 1 : 0), 0, source.id);
  draggedId = null; reorder(source.shelf, ordered);
});

$('#refresh').addEventListener('click', async () => {
  setBusy(true); try { await loadBooks(); toast('Bookshelf refreshed.'); } catch (error) { toast(error.message, true); } finally { setBusy(false); }
});
$('#logout').addEventListener('click', async () => {
  if (dirty && !await confirmAction('Discard changes?', 'Sign out and discard your unsaved edits?', 'Sign out')) return;
  try { await api('logout', { method: 'POST' }); dirty = false; books = []; showLogin(); } catch (error) { toast(error.message, true); }
});
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; $('#login-error').textContent = '';
  try {
    const { user } = await api('login', { method: 'POST', body: { username: $('#username').value, password: $('#password').value } });
    $('#password').value = ''; await showDashboard(user);
  } catch (error) { $('#login-error').textContent = error.message; $('#password').value = ''; $('#password').focus(); }
  finally { button.disabled = false; }
});

try { await showDashboard((await api('me')).user); }
catch (error) { showLogin(error.message === 'Please sign in' ? '' : error.message); }
