import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge Runtime Configuration
 * Provides low-latency audio transcription
 */
export const runtime = 'edge';

/**
 * Transcribe API Route - Speech-to-Text endpoint
 *
 * Converts audio recordings to text using OpenAI Whisper API.
 * Supports both English and Spanish transcription.
 *
 * @param req - FormData containing audio file and language parameter
 * @returns JSON with transcribed text
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en'; // Default to English

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Forward to OpenAI Whisper API
    const whisperFormData = new FormData();

    // Convert File to Blob to ensure compatibility with OpenAI's expected format in some environments
    const blob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    whisperFormData.append('file', blob, 'recording.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', language); // Support 'en' or 'es'

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whisper API error:', error);
      return NextResponse.json({ error: 'Transcription failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
