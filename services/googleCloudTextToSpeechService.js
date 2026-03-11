'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const {v1beta1} = require('@google-cloud/text-to-speech');

const GEMINI_TTS_PROMPT =
  'Read in an upbeat, frank, and friendly tone. Sound like a helpful peer giving practical advice.';

function resolveWavPath(outputPath) {
  if (typeof outputPath !== 'string' || outputPath.trim() === '') {
    throw new Error('outputPath must be a non-empty string');
  }

  return outputPath.toLowerCase().endsWith('.wav') ? outputPath : `${outputPath}.wav`;
}

function responseAudioToBuffer(audioContent) {
  if (!audioContent) {
    throw new Error('Text-to-Speech API returned empty audioContent');
  }

  if (Buffer.isBuffer(audioContent)) {
    return audioContent;
  }

  if (typeof audioContent === 'string') {
    return Buffer.from(audioContent, 'base64');
  }

  if (audioContent instanceof Uint8Array) {
    return Buffer.from(audioContent);
  }

  throw new Error(`Unsupported audioContent type: ${typeof audioContent}`);
}

async function synthesizeGeminiTtsToWav(textToSynthesize, outputPath) {
  if (typeof textToSynthesize !== 'string' || textToSynthesize.trim() === '') {
    throw new Error('textToSynthesize must be a non-empty string');
  }

  const client = new v1beta1.TextToSpeechClient();

  const request = {
    input: {
      text: textToSynthesize,
      prompt: GEMINI_TTS_PROMPT
    },
    voice: {
      languageCode: 'en-US',
      name: 'Umbriel',
      modelName: 'gemini-2.5-flash-lite-preview-tts'
    },
    audioConfig: {
      audioEncoding: 'LINEAR16'
    }
  };

  const [response] = await client.synthesizeSpeech(request);
  const wavPath = resolveWavPath(outputPath);

  await fs.mkdir(path.dirname(wavPath), {recursive: true});
  await fs.writeFile(wavPath, responseAudioToBuffer(response.audioContent));

  return wavPath;
}

module.exports = {
  synthesizeGeminiTtsToWav
};
