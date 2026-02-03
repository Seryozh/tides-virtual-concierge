# API Documentation

This document provides detailed information about the Tides Virtual Concierge API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [POST /api/transcribe](#post-apitranscribe)
  - [POST /api/chat](#post-apichat)
  - [POST /api/synthesize](#post-apisynthesize)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

Currently, the API does not require authentication as it's designed for internal use at Tides Residential. In a production deployment with external access, consider implementing API key authentication.

## Base URL

**Local Development:**
```
http://localhost:3000
```

**Production:**
```
https://your-deployment-url.vercel.app
```

---

## Endpoints

### POST /api/transcribe

Transcribes audio recordings to text using OpenAI Whisper.

#### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | Yes | Audio file in WebM format |
| `language` | string | No | Language code ('en' or 'es'). Defaults to 'en' |

#### Response

**Success (200):**
```json
{
  "text": "Do I have any packages?"
}
```

**Error (400):**
```json
{
  "error": "No audio file provided"
}
```

**Error (500):**
```json
{
  "error": "Transcription failed"
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@recording.webm" \
  -F "language=en"
```

#### Notes

- Audio must be in WebM format (default output from MediaRecorder API)
- Maximum audio length: ~30 seconds (Whisper API limit)
- Supported languages: English ('en'), Spanish ('es')

---

### POST /api/chat

Processes user messages with GPT-4o and returns streamed responses.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "messages": [
    {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Do I have any packages?"
        }
      ]
    }
  ],
  "unitNumber": "101",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "language": "en"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Array | Yes | Array of message objects with role and parts |
| `unitNumber` | string | No | Resident's unit number (e.g., "101") |
| `sessionId` | string | No | UUID for conversation persistence |
| `language` | string | No | Language code ('en' or 'es'). Defaults to 'en' |

#### Response

**Success (200):**

Server-Sent Events (SSE) stream:
```
data: {"type":"text-delta","textDelta":"You"}
data: {"type":"text-delta","textDelta":" have"}
data: {"type":"text-delta","textDelta":" 2"}
data: {"type":"text-delta","textDelta":" packages"}
...
data: [DONE]
```

**Error (500):**
```json
{
  "error": "Internal server error"
}
```

#### Available Tools

The AI assistant can call these tools during conversation:

##### checkPackages

Queries pending packages for a specific unit.

**Input Schema:**
```typescript
{
  unitNumber: string  // e.g., "101"
}
```

**Returns:**
- "No pending packages found." (if none exist)
- "Found {count} packages from {couriers}." (if packages exist)
- "System Error: Database unreachable." (if database error)

##### logPickup

Marks all packages for a unit as picked up.

**Input Schema:**
```typescript
{
  unitNumber: string  // e.g., "101"
}
```

**Returns:**
- "Successfully logged pickup."
- "Failed to update." (if database error)

#### Example

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "parts": [{"type": "text", "text": "Do I have any packages?"}]
      }
    ],
    "unitNumber": "101",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "language": "en"
  }'
```

#### Notes

- Responses are streamed for real-time user feedback
- Conversation history is loaded automatically using `sessionId`
- Maximum 10 previous conversation exchanges are included for context
- The AI will automatically call tools when needed (e.g., checking database)
- Maximum 5 tool call steps per request (to prevent infinite loops)

---

### POST /api/synthesize

Converts text to natural-sounding speech using ElevenLabs.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "text": "You have 2 packages from Amazon and FedEx.",
  "language": "en"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text to convert to speech |
| `language` | string | No | Language code ('en' or 'es'). Defaults to 'en' |

#### Response

**Success (200):**

Audio stream (MP3 format)

**Headers:**
```
Content-Type: audio/mpeg
Content-Length: {size}
```

**Error (400):**
```json
{
  "error": "No text provided"
}
```

**Error (500):**
```json
{
  "error": "ElevenLabs not configured"
}
```

or

```json
{
  "error": "Synthesis failed"
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, welcome to Tides!", "language": "en"}' \
  --output response.mp3
```

#### Notes

- Requires ElevenLabs API key and voice ID in environment variables
- Falls back to browser TTS if ElevenLabs is not configured (client-side)
- Spanish language uses `ELEVENLABS_VOICE_ID_ES` or falls back to default voice
- Audio format: MP3 (MPEG)
- Model: `eleven_turbo_v2_5` (optimized for real-time applications)

---

## Error Handling

All endpoints follow consistent error response patterns:

### Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (missing or invalid parameters) |
| 500 | Internal Server Error (API failure, database error, etc.) |

### Common Error Scenarios

1. **Missing API Keys**
   - Symptom: 500 error with "ElevenLabs not configured"
   - Solution: Add API keys to `.env.local`

2. **Invalid Audio Format**
   - Symptom: 400 error with "Transcription failed"
   - Solution: Ensure audio is in WebM format

3. **Database Connection Error**
   - Symptom: Tool returns "System Error: Database unreachable"
   - Solution: Check Supabase credentials and network connectivity

4. **Session/Unit Data Issues**
   - Symptom: Empty or incorrect responses
   - Solution: Ensure `sessionId` and `unitNumber` are provided

---

## Rate Limiting

Currently, rate limiting is not implemented. For production use, consider:

1. **API-Level Rate Limiting**
   - Use Vercel's built-in rate limiting
   - Or implement custom middleware with Redis

2. **Third-Party API Limits**
   - **OpenAI**: Tier-based rate limits (check your tier at platform.openai.com)
   - **ElevenLabs**: Character/month limits based on plan
   - **Supabase**: 500 requests/second on free tier

3. **Recommended Limits**
   - `/api/transcribe`: 60 requests/minute per IP
   - `/api/chat`: 30 requests/minute per session
   - `/api/synthesize`: 60 requests/minute per IP

---

## Testing with Postman

Import this collection to test the API:

### Collection Variables
```json
{
  "base_url": "http://localhost:3000",
  "session_id": "{{$guid}}",
  "unit_number": "101",
  "language": "en"
}
```

### Sample Requests

1. **Transcribe Audio**
   - Method: POST
   - URL: `{{base_url}}/api/transcribe`
   - Body: form-data
     - `audio`: [file]
     - `language`: `{{language}}`

2. **Chat**
   - Method: POST
   - URL: `{{base_url}}/api/chat`
   - Body: raw (JSON)
     ```json
     {
       "messages": [
         {
           "role": "user",
           "parts": [{"type": "text", "text": "Hello"}]
         }
       ],
       "unitNumber": "{{unit_number}}",
       "sessionId": "{{session_id}}",
       "language": "{{language}}"
     }
     ```

3. **Synthesize**
   - Method: POST
   - URL: `{{base_url}}/api/synthesize`
   - Body: raw (JSON)
     ```json
     {
       "text": "Welcome to Tides!",
       "language": "{{language}}"
     }
     ```

---

## Webhooks (Future)

Potential webhook events for future implementation:

- `package.received` - New package delivered
- `package.picked_up` - Package marked as picked up
- `booking.created` - New amenity booking
- `conversation.completed` - Conversation ended

---

For questions or issues, please open an issue on GitHub or refer to the main [README](README.md).
