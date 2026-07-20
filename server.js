const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');

const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const app = express();

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

function extractElevenLabsErrorMessage(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item?.msg || item?.message || JSON.stringify(item)).join('; ');
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

function requireElevenLabsKey(res) {
  if (!ELEVENLABS_API_KEY) {
    console.error('[server] ELEVENLABS_API_KEY is not set');
    res.status(500).json({
      error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
      detail: 'ELEVENLABS_API_KEY is not configured on the server.',
    });
    return false;
  }
  return true;
}

/**
 * POST /api/clone-voice
 * multipart/form-data with:
 *   - files: audio sample
 *   - name: optional voice label
 */
app.post('/api/clone-voice', upload.single('files'), async (req, res) => {
  if (!requireElevenLabsKey(res)) return;

  try {
    console.log('[clone-voice] request', {
      contentType: req.headers['content-type'],
      hasFile: Boolean(req.file),
      fileBytes: req.file?.size || 0,
      mimeType: req.file?.mimetype || null,
      originalname: req.file?.originalname || null,
      name: req.body?.name || null,
    });

    if (!req.file || !req.file.buffer?.length) {
      res.status(400).json({
        error: 'Missing audio file',
        detail: 'No audio bytes were found in the multipart upload.',
      });
      return;
    }

    const voiceName = (req.body?.name && String(req.body.name).trim()) || `MyVoice-${Date.now()}`;
    const mimeType = req.file.mimetype || 'audio/m4a';
    const filename =
      req.file.originalname || (mimeType.includes('webm') ? 'voice-sample.webm' : 'voice-sample.m4a');

    const elevenLabsForm = new FormData();
    elevenLabsForm.append('name', voiceName);
    elevenLabsForm.append('files', new Blob([req.file.buffer], { type: mimeType }), filename);

    const elevenLabsResponse = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: elevenLabsForm,
    });

    const responseText = await elevenLabsResponse.text();
    let data = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { raw: responseText };
    }

    console.log('[clone-voice] ElevenLabs response', {
      status: elevenLabsResponse.status,
      ok: elevenLabsResponse.ok,
      body: data,
      rawBody: responseText.slice(0, 4000),
    });

    if (!elevenLabsResponse.ok) {
      const detail = extractElevenLabsErrorMessage(data) || responseText || 'Failed to create voice clone';
      res.status(elevenLabsResponse.status).json({
        error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
        detail,
        elevenLabsStatus: elevenLabsResponse.status,
        elevenLabsResponse: data,
      });
      return;
    }

    if (!data.voice_id) {
      res.status(502).json({
        error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
        detail: 'ElevenLabs response did not include a voice_id',
        elevenLabsResponse: data,
      });
      return;
    }

    res.status(200).json({ voice_id: data.voice_id });
  } catch (error) {
    console.error('[clone-voice] error', error);
    res.status(500).json({
      error: 'Something went wrong creating your voice. Please try again in a quiet environment.',
      detail: error?.message || String(error),
    });
  }
});

/**
 * POST /api/speak
 * JSON { text, voice_id } → audio/mpeg from ElevenLabs TTS
 */
app.post('/api/speak', async (req, res) => {
  if (!requireElevenLabsKey(res)) return;

  try {
    const { text, voice_id: voiceId } = req.body || {};

    if (!text || !voiceId) {
      res.status(400).json({ error: 'Missing text or voice_id' });
      return;
    }

    const elevenLabsResponse = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
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
      console.error('[speak] ElevenLabs failed', {
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
    console.error('[speak] error', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      detail: error?.message || String(error),
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    hasElevenLabsKey: Boolean(ELEVENLABS_API_KEY),
  });
});

// Serve the Expo web export when present (Railway production).
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (req, res, next) => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
      next();
      return;
    }
    res.sendFile(indexPath);
  });
}

app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'MyVoice API is running.',
    hasElevenLabsKey: Boolean(ELEVENLABS_API_KEY),
  });
});

process.on('uncaughtException', (error) => {
  console.error('[server] uncaughtException', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[server] unhandledRejection', error);
});

const server = app.listen(PORT, HOST, () => {
  console.log(`MyVoice server listening on http://${HOST}:${PORT}`);
  console.log(`ElevenLabs key configured: ${Boolean(ELEVENLABS_API_KEY)}`);
  console.log(`Dist directory present: ${fs.existsSync(DIST_DIR)}`);
});

server.on('error', (error) => {
  console.error('[server] listen error', error);
  process.exit(1);
});
