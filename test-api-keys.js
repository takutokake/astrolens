/**
 * Test script to verify OpenAI and Google TTS API keys
 * Run with: node test-api-keys.js
 */

require('dotenv').config({ path: '.env.local' });

async function testOpenAI() {
  console.log('\n🤖 Testing OpenAI API...');
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    return false;
  }
  
  console.log(`✓ API Key found: ${apiKey.substring(0, 20)}...`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from Astrolens!" in exactly 5 words.' }
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ OpenAI API Error (${response.status}):`, error);
      return false;
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content;
    
    console.log('✅ OpenAI API is working!');
    console.log(`   Response: "${message}"`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Tokens used: ${data.usage.total_tokens}`);
    return true;
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    return false;
  }
}

async function testGoogleTTS() {
  console.log('\n🎙️  Testing Google Cloud TTS API...');
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_TTS_API_KEY not found in .env.local');
    return false;
  }
  
  console.log(`✓ API Key found: ${apiKey.substring(0, 20)}...`);
  
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: 'Hello from Astrolens! This is a test of the text to speech API.' },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Casual-K',
            ssmlGender: 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Google TTS API Error (${response.status}):`, error);
      return false;
    }

    const data = await response.json();
    
    if (data.audioContent) {
      const audioSize = Buffer.from(data.audioContent, 'base64').length;
      console.log('✅ Google TTS API is working!');
      console.log(`   Audio generated: ${(audioSize / 1024).toFixed(2)} KB`);
      console.log(`   Format: MP3`);
      console.log(`   Voice: en-US-Casual-K`);
      return true;
    } else {
      console.error('❌ No audio content in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Google TTS API Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Astrolens API Key Verification Test');
  console.log('═══════════════════════════════════════════');
  
  const openaiOk = await testOpenAI();
  const ttsOk = await testGoogleTTS();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  Test Results');
  console.log('═══════════════════════════════════════════');
  console.log(`OpenAI API:      ${openaiOk ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Google TTS API:  ${ttsOk ? '✅ WORKING' : '❌ FAILED'}`);
  console.log('═══════════════════════════════════════════\n');
  
  if (openaiOk && ttsOk) {
    console.log('🎉 All API keys are working correctly!');
    console.log('   You can now generate radio broadcasts.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some API keys are not working.');
    console.log('   Please check the error messages above.\n');
    process.exit(1);
  }
}

main();
