const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const Busboy = require('busboy');

// Set this secret once with:
//   firebase functions:secrets:set ELEVENLABS_API_KEY
// The key never lives in the app code or in this repo — only in Firebase's
// managed secret storage, injected into the function at runtime.
const ELEVENLABS_API_KEY = defineSecret('ELEVENLABS_API_KEY');
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Parses a multipart/form-data request body (Firebase Functions always
 * provides `req.rawBody` as a Buffer, regardless of content type).
 */
function parseMultipartRequest(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let fileInfo = null;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        fileInfo = info;
      });
    });

    busboy.on('finish', () => resolve({ fields, fileBuffer, fileInfo }));
    busboy.on('error', reject);

    if (!req.rawBody) {
      reject(new Error('Missing request body'));
      return;
    }
    busboy.end(req.rawBody);
  });
}

/**
 * cloneVoice
 * Accepts a multipart/form-data upload containing:
 *   - `files`: the recorded audio sample
 *   - `name` (optional): a label for the cloned voice
 * Forwards it to ElevenLabs' POST /v1/voices/add and returns { voice_id }.
 */
exports.cloneVoice = onRequest(
  { secrets: [ELEVENLABS_API_KEY], cors: true, memory: '512MiB', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { fields, fileBuffer, fileInfo } = await parseMultipartRequest(req);

      if (!fileBuffer || fileBuffer.length === 0) {
        res.status(400).json({ error: 'Missing audio file' });
        return;
      }

      const voiceName = (fields.name && fields.name.trim()) || `MyVoice-${Date.now()}`;

      const elevenLabsForm = new FormData();
      elevenLabsForm.append('name', voiceName);
      elevenLabsForm.append(
        'files',
        new Blob([fileBuffer], { type: fileInfo?.mimeType || 'audio/m4a' }),
        fileInfo?.filename || 'voice-sample.m4a',
      );

      const elevenLabsResponse = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY.value() },
        body: elevenLabsForm,
      });

      const data = await elevenLabsResponse.json().catch(() => ({}));

      if (!elevenLabsResponse.ok) {
        logger.error('ElevenLabs voice clone failed', { status: elevenLabsResponse.status, data });
        res.status(elevenLabsResponse.status).json({
          error: data?.detail?.message || 'Failed to create voice clone',
        });
        return;
      }

      res.status(200).json({ voice_id: data.voice_id });
    } catch (error) {
      logger.error('cloneVoice error', error);
      res.status(500).json({ error: 'Something went wrong creating your voice. Please try again in a quiet environment.' });
    }
  },
);

/**
 * speak
 * Accepts JSON { text, voice_id } and proxies ElevenLabs'
 * POST /v1/text-to-speech/{voice_id}, streaming the resulting audio
 * (audio/mpeg) back to the app.
 */
exports.speak = onRequest(
  { secrets: [ELEVENLABS_API_KEY], cors: true, memory: '256MiB', timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { text, voice_id: voiceId } = req.body || {};

      if (!text || !voiceId) {
        res.status(400).json({ error: 'Missing text or voice_id' });
        return;
      }

      const elevenLabsResponse = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY.value(),
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
        }),
      });

      if (!elevenLabsResponse.ok) {
        const errorBody = await elevenLabsResponse.text().catch(() => '');
        logger.error('ElevenLabs speak failed', { status: elevenLabsResponse.status, errorBody });
        res.status(elevenLabsResponse.status).json({ error: 'Failed to generate speech' });
        return;
      }

      const audioBuffer = Buffer.from(await elevenLabsResponse.arrayBuffer());
      res.set('Content-Type', 'audio/mpeg');
      res.status(200).send(audioBuffer);
    } catch (error) {
      logger.error('speak error', error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  },
);
