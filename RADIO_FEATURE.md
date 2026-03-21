# Radio-Style AI News Narrator Feature

## Overview

The Orbit feature now generates **AI-powered radio-style news broadcasts** with natural narration, smooth transitions, and professional voice synthesis.

## How It Works

### 1. **AI Script Generation** (`/api/generate-radio-script`)
- Uses **OpenAI GPT-4** to transform raw news articles into engaging radio narration
- Creates natural transitions between stories
- Groups content by category with contextual intros
- Adds opening greetings and closing sign-offs
- Optimized for the selected duration (10/20/30 minutes)

### 2. **Text-to-Speech** (`/api/tts`)
- Converts the radio script to high-quality audio
- Uses **Google Cloud Text-to-Speech** with natural voices
- Automatically generates script if not already created
- Stores audio in Supabase Storage

### 3. **Enhanced UI**
- "Generate Radio Script" button to create narration
- Toggle to show/hide the full script
- Audio player with playback controls
- Speed adjustment (0.8x - 1.5x)

## Setup Instructions

### 1. Add Environment Variables

Add to `.env.local`:

```bash
# OpenAI API (for radio script generation)
OPENAI_API_KEY=sk-your-openai-api-key

# Google Cloud TTS (for audio generation)
GOOGLE_TTS_API_KEY=your-google-cloud-api-key
```

### 2. Update Supabase Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Add radio_script column to digests table
ALTER TABLE digests ADD COLUMN IF NOT EXISTS radio_script TEXT;
```

### 3. Get API Keys

**OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env.local`

**Google Cloud TTS API Key:**
1. Go to https://console.cloud.google.com/
2. Enable "Cloud Text-to-Speech API"
3. Create credentials (API Key)
4. Add to `.env.local`

## User Flow

1. User creates an Orbit (selects duration + categories)
2. System fetches relevant articles from Supabase
3. User clicks **"Generate Radio Script"**
   - AI analyzes articles and creates engaging narration
   - Script is saved to database
4. User clicks **"Generate Audio"**
   - TTS converts script to MP3
   - Audio is uploaded to Supabase Storage
5. User plays the radio broadcast with controls

## Example Radio Script Output

```
Good morning! Welcome to your personalized news orbit. 
Over the next 10 minutes, we'll explore the latest in 
technology, world events, and business. Let's dive in.

Starting with technology... OpenAI has just announced 
a breakthrough in AI reasoning capabilities. The new 
model shows remarkable improvements in complex problem 
solving...

Moving to world news, tensions in the Middle East 
continue to evolve. Leaders from multiple nations 
gathered today to discuss...

And wrapping up with business, the stock market saw 
significant movement this week. Tech stocks led the 
charge with...

That's all for today's orbit. Stay curious, stay 
informed, and we'll see you next time!
```

## API Endpoints

### `POST /api/generate-radio-script`
**Request:**
```json
{
  "digest_id": "uuid"
}
```

**Response:**
```json
{
  "radio_script": "Full radio narration text...",
  "cached": false
}
```

### `POST /api/tts`
**Request:**
```json
{
  "digest_id": "uuid"
}
```

**Response:**
```json
{
  "audio_url": "https://supabase-storage-url/audio.mp3"
}
```

## Cost Considerations

### OpenAI API
- Model: `gpt-4o-mini`
- ~2,000-3,000 tokens per script
- Cost: ~$0.01-0.02 per script

### Google Cloud TTS
- ~2,000-6,000 characters per audio
- Cost: ~$0.03-0.10 per audio

**Total cost per Orbit:** ~$0.04-0.12

## Rate Limits

- **Radio Script Generation:** 10 per hour per user
- **Audio Generation:** 5 per day per user

## Customization

### Modify the AI Prompt

Edit `RADIO_SYSTEM_PROMPT` in `/api/generate-radio-script/route.ts`:

```typescript
const RADIO_SYSTEM_PROMPT = `You are a professional radio news host...`;
```

### Change Voice Settings

Edit voice parameters in `/api/tts/route.ts`:

```typescript
voice: {
  languageCode: "en-US",
  name: "en-US-Casual-K",  // Change voice
  ssmlGender: "MALE",       // MALE, FEMALE, NEUTRAL
},
audioConfig: {
  speakingRate: 1.0,        // 0.25 - 4.0
  pitch: 0.0,               // -20.0 to 20.0
}
```

## Alternative TTS Providers

### ElevenLabs (Higher Quality)
- More natural voices
- Better emotional range
- Higher cost (~$0.30 per audio)

### OpenAI TTS (Simpler)
- Built-in to OpenAI API
- Good quality
- Lower cost (~$0.015 per audio)

To switch providers, modify `/api/tts/route.ts` to call the respective API.

## Troubleshooting

**Script generation fails:**
- Check OpenAI API key is valid
- Verify rate limits not exceeded
- Check console logs for errors

**Audio generation fails:**
- Verify Google Cloud TTS API is enabled
- Check API key permissions
- Ensure Supabase Storage bucket exists

**Audio doesn't play:**
- Check browser console for CORS errors
- Verify Supabase Storage bucket is public
- Test audio URL directly in browser

## Future Enhancements

- [ ] Multiple voice options (male/female/accents)
- [ ] Background music/sound effects
- [ ] Chapter markers for categories
- [ ] Podcast-style intro/outro jingles
- [ ] User-customizable narration style
- [ ] Multi-language support
