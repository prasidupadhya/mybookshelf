import { getDb } from '../../../lib/db.js';
import { api, HttpError, method } from '../../../lib/http.js';
import { UUID } from '../../../lib/validation.js';
import { MAX_SPEECH_CHARACTERS, speechHash, synthesizeSpeech } from '../../../lib/speech.js';

// Narrates a saved description. Only descriptions stored in the database can be spoken, and each
// (book, language) is generated once and then served from the database, so visitors cost no extra credits.
export default api(async (req, res) => {
  method(req, res, ['GET']);
  const { id, lang = 'en' } = req.query || {};
  if (!UUID.test(id || '') || !['en', 'es'].includes(lang)) throw new HttpError(400, 'Invalid narration request');
  const db = getDb();
  const [book] = await db.query(`SELECT description_en, description_es FROM books WHERE id = $1`, [id]);
  const text = (lang === 'es' ? book?.description_es : book?.description_en)?.trim();
  if (!text) throw new HttpError(404, 'No description to narrate');
  if (text.length > MAX_SPEECH_CHARACTERS) throw new HttpError(400, 'Description is too long to narrate');

  const hash = speechHash(text, lang);
  let [clip] = await db.query('SELECT audio, text_hash FROM speech_clips WHERE book_id = $1 AND lang = $2', [id, lang]);
  if (!clip || clip.text_hash !== hash) {
    let audio;
    try { audio = await synthesizeSpeech(text); }
    catch { throw new HttpError(503, 'Narration is temporarily unavailable'); }
    // Replaces any clip made from an older description or voice.
    await db.query(
      `INSERT INTO speech_clips (book_id, lang, text_hash, audio) VALUES ($1, $2, $3, $4)
       ON CONFLICT (book_id, lang) DO UPDATE SET text_hash = EXCLUDED.text_hash, audio = EXCLUDED.audio, created_at = now()`,
      [id, lang, hash, audio]
    );
    clip = { audio, text_hash: hash };
  }
  // The URL does not change when a description is edited, so the shared cache is kept short.
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=300, stale-while-revalidate=3600');
  res.setHeader('Content-Type', 'audio/mpeg');
  res.statusCode = 200; res.end(Buffer.from(clip.audio));
});
