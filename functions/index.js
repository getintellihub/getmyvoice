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

function extractElevenLabsErrorMessage(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join('; ');
  }
  if (data.detail?.message) return data.detail.message;
  if (data.message) return data.message;
  if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

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
        // Prefer the last uploaded file part named "files"
        fileBuffer = Buffer.concat(chunks);
        fileInfo = { ...info, fieldName: name };
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
      logger.info('cloneVoice request received', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        hasRawBody: Boolean(req.rawBody),
        rawBodyBytes: req.rawBody ? req.rawBody.length : 0,
      });

      const { fields, fileBuffer, fileInfo } = await parseMultipartRequest(req);

      logger.info('cloneVoice multipart parsed', {
        fields: Object.keys(fields),
        voiceName: fields.name || null,
        fileFieldName: fileInfo?.fieldName || null,
        filename: fileInfo?.filename || null,
        mimeType: fileInfo?.mimeType || null,
        fileBytes: fileBuffer ? fileBuffer.length : 0,
      });

      if (!fileBuffer || fileBuffer.length === 0) {
        logger.error('cloneVoice missing audio file after multipart parse', {
          fields,
          fileInfo,
        });
        res.status(400).json({
          error: 'Missing audio file',
          detail: 'No audio bytes were found in the multipart upload.',
        });
        return;
      }

      const voiceName = (fields.name && fields.name.trim()) || `MyVoice-${Date.now()}`;
      const mimeType = fileInfo?.mimeType || 'audio/webm';
      const filename = fileInfo?.filename || (mimeType.includes('webm') ? 'voice-sample.webm' : 'voice-sample.m4a');

      const elevenLabsForm = new FormData();
      elevenLabsForm.append('name', voiceName);
      elevenLabsForm.append('files', new Blob([fileBuffer], { type: mimeType }), filename);

      logger.info('Calling ElevenLabs /voices/add', {
        voiceName,
        mimeType,
        filename,
        fileBytes: fileBuffer.length,
      });

      const elevenLabsResponse = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY.value() },
        body: elevenLabsForm,
      });

      const responseText = await elevenLabsResponse.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      // Always log the full ElevenLabs response for debugging.
      logger.info('ElevenLabs /voices/add response', {
        status: elevenLabsResponse.status,
        ok: elevenLabsResponse.ok,
        body: data,
        rawBody: responseText.slice(0, 4000),
      });

      if (!elevenLabsResponse.ok) {
        const detail = extractElevenLabsErrorMessage(data) || responseText || 'Failed to create voice clone';
        logger.error('ElevenLabs voice clone failed', {
          status: elevenLabsResponse.status,
          detail,
          data,
        });
        res.status(elevenLabsResponse.status).json({
          error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
          detail,
          elevenLabsStatus: elevenLabsResponse.status,
          elevenLabsResponse: data,
        });
        return;
      }

      if (!data.voice_id) {
        logger.error('ElevenLabs response missing voice_id', { data });
        res.status(502).json({
          error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
          detail: 'ElevenLabs response did not include a voice_id',
          elevenLabsResponse: data,
        });
        return;
      }

      logger.info('cloneVoice succeeded', { voice_id: data.voice_id });
      res.status(200).json({ voice_id: data.voice_id });
    } catch (error) {
      logger.error('cloneVoice error', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        error,
      });
      res.status(500).json({
        error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
        detail: error?.message || String(error),
      });
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
        logger.error('ElevenLabs speak failed', {
          status: elevenLabsResponse.status,
          errorBody,
        });
        res.status(elevenLabsResponse.status).json({
          error: 'Failed to generate speech',
          detail: errorBody,
        });
        return;
      }

      const audioBuffer = Buffer.from(await elevenLabsResponse.arrayBuffer());
      res.set('Content-Type', 'audio/mpeg');
      res.status(200).send(audioBuffer);
    } catch (error) {
      logger.error('speak error', {
        message: error?.message,
        stack: error?.stack,
        error,
      });
      res.status(500).json({ error: 'Failed to generate speech', detail: error?.message || String(error) });
    }
  },
);
