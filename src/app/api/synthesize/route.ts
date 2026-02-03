import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge Runtime Configuration
 * Enables fast text-to-speech generation
 */
export const runtime = 'edge';

/**
 * Synthesize API Route - Text-to-Speech endpoint
 *
 * Converts text responses to natural-sounding speech using ElevenLabs API.
 * Supports language-specific voice selection for English and Spanish.
 *
 * @param req - JSON containing text and language parameter
 * @returns Audio stream (MP3 format)
 */
export async function POST(req: NextRequest) {
  try {
    const { text, language = 'en' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Select voice based on language
    // English voice: default from env, Spanish voice: use multilingual model
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = language === 'es'
      ? (process.env.ELEVENLABS_VOICE_ID_ES || process.env.ELEVENLABS_VOICE_ID) // Fallback to default if Spanish voice not configured
      : process.env.ELEVENLABS_VOICE_ID;

    if (!voiceId || !apiKey) {
      return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 });
    }

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Fast model for real-time
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return NextResponse.json({ error: 'Synthesis failed' }, { status: response.status });
    }

    // Return audio as blob
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Synthesis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
