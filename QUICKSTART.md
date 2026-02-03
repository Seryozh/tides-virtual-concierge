# Quick Start Guide

Get Tides Virtual Concierge running in 5 minutes!

## Prerequisites

Before you start, make sure you have:

- [ ] Node.js 18 or higher installed ([Download](https://nodejs.org/))
- [ ] npm (comes with Node.js)
- [ ] OpenAI API account with credits ([Sign up](https://platform.openai.com/signup))
- [ ] Supabase account ([Sign up](https://supabase.com/dashboard))

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/tides-virtual-concierge.git
cd tides-virtual-concierge

# Install dependencies
npm install
```

## Step 2: Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (~1 minute)
3. Go to **SQL Editor** in the left sidebar
4. Copy the contents of `supabase-schema.sql` and paste into the editor
5. Click "Run" to create the database tables

## Step 3: Configure Environment (1 minute)

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Get from https://elevenlabs.io (for better voice quality)
# ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
# ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

**Where to find Supabase credentials:**
1. Open your Supabase project
2. Click **Settings** (gear icon) in left sidebar
3. Click **API**
4. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test It Out!

1. Click the **language dropdown** (top-right) and select English or Spanish
2. Enter a **unit number** (try "101")
3. **Press and hold** the microphone button
4. **Speak**: "Do I have any packages?"
5. **Release** the button
6. The assistant will respond with voice and text!

### Sample Test Queries

**English:**
- "Do I have any packages?"
- "Who delivered my package?"
- "Hello, how are you?"

**Spanish:**
- "¿Tengo paquetes?"
- "¿Quién entregó mi paquete?"
- "Hola, ¿cómo estás?"

## Troubleshooting

### "Microphone permission denied"

**Solution:** Allow microphone access in your browser settings.

### "Transcription failed"

**Solution:** Check your `OPENAI_API_KEY` is correct and has credits.

### "Chat connection failed"

**Solution:** Verify your Supabase credentials are correct.

### No audio playback

**Solution:** ElevenLabs is optional. If not configured, the app will use browser TTS automatically.

## Next Steps

- [ ] Read the full [README.md](README.md) for detailed information
- [ ] Review [API.md](API.md) to understand the endpoints
- [ ] Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- [ ] Customize the system prompts in `src/app/api/chat/route.ts`
- [ ] Add your own tools and capabilities

## Need Help?

- **Documentation**: See [README.md](README.md)
- **API Docs**: See [API.md](API.md)
- **Issues**: Open an issue on GitHub
- **Questions**: Check existing GitHub discussions

---

**You're all set!** 🎉

Enjoy using Tides Virtual Concierge!
