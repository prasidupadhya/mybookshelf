import { createHash } from 'node:crypto';
import { requiredEnv } from './env.js';

// ElevenLabs text-to-speech. The key is read only on the server and never leaves it.
// eleven_multilingual_v2 speaks English and Spanish from the same voice.
export const SPEECH_MODEL = 'eleven_multilingual_v2';
// George, a standard ElevenLabs library voice. Set ELEVENLABS_VOICE_ID to use a different one.
const DEFAULT_VOICE = 'JBFqnCBsd6RMkjVDRZzb';
export const MAX_SPEECH_CHARACTERS = 2000;

export function speechVoice() {
  return process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
}

// The hash covers everything that changes the audio, so a new voice or text always means a new clip.
export function speechHash(text, lang) {
  return createHash('sha256').update(JSON.stringify([SPEECH_MODEL, speechVoice(), lang, text])).digest('hex');
}

export async function synthesizeSpeech(text) {
  const apiKey = requiredEnv('ELEVENLABS_API_KEY');
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(speechVoice())}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: SPEECH_MODEL, voice_settings: { stability: .5, similarity_boost: .75 } }),
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error('Speech provider rejected the request');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1 || bytes.length > 8388608) throw new Error('Speech provider returned unexpected audio');
  return bytes;
}
