# 🚀 Quick Start Guide

## ⚡ 3-Minute Setup

### Step 1: Create Database Table (REQUIRED)
Go to: https://yupczmvscswimpaffqdl.supabase.co/project/_/sql/new

Paste and run this SQL:
```sql
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL,
  unit_number TEXT,
  messages JSONB NOT NULL
);

CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON conversations FOR ALL USING (true);
```

### Step 2: Start Server
```bash
cd tides-virtual-concierge
npm run dev
```

### Step 3: Test
1. Open http://localhost:3000
2. **PRESS AND HOLD** microphone button
3. Say: "Do I have any packages?"
4. **RELEASE** button
5. Listen to AI response in your custom voice!

---

## 🎯 How to Use

### Voice Input (Primary)
1. **Press and hold** the microphone orb
2. Speak your question
3. **Release** to send
4. Wait for response

### Text Input (Testing)
- Type in the input box at bottom
- Press Enter or click Send button

---

## 🔑 Current Settings

### Your APIs (Already Configured)
- ✅ OpenAI API Key (for Whisper & GPT-4o)
- ✅ ElevenLabs API Key: `sk_97e45b6...`
- ✅ ElevenLabs Voice ID: `yoEMsY6awhlIEknBgmfX`
- ✅ Supabase URL & Key

### Default Unit
- Unit 101 (has 2 pending packages)
- Change in top-right corner

---

## ✅ What Works

- ✅ Voice recording (press & hold)
- ✅ Whisper transcription
- ✅ Database queries (packages, bookings)
- ✅ Custom ElevenLabs voice output
- ⚠️ Conversation history (needs SQL setup)

---

## 🧪 Test Phrases

Try saying:
- "Do I have any packages?"
- "Book the tennis court"
- "What amenities can I book?"
- "Hello, how are you?"

---

## 🐛 Troubleshooting

**Mic doesn't work:**
- Allow microphone permission in browser
- Must use HTTPS or localhost

**Robotic voice:**
- Check ElevenLabs keys in `.env.local`
- Restart server: `npm run dev`

**"Processing..." stuck:**
- Check browser console for errors
- Verify all API keys are set

---

## 📞 Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run lint
```

---

**Ready to go! Your Tides Virtual Concierge is live.** 🎉
