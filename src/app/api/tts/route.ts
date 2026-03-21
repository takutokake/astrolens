import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { ttsRequestSchema } from "@/lib/validations";
import type { Article } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 TTS per day
    const { allowed } = await checkRateLimit(authUser.id, "/api/tts");
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 audio generations per day." },
        { status: 429 }
      );
    }

    // Validate
    const body = await request.json();
    const parsed = ttsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { digest_id } = parsed.data;

    // Verify digest belongs to user
    const { data: digest, error: digestError } = await supabase
      .from("digests")
      .select("*")
      .eq("id", digest_id)
      .eq("user_id", authUser.id)
      .single();

    if (digestError || !digest) {
      return NextResponse.json(
        { error: "Digest not found" },
        { status: 404 }
      );
    }

    // If audio already exists, return it
    if (digest.audio_url) {
      return NextResponse.json({ audio_url: digest.audio_url });
    }

    const serviceClient = await createServiceClient();

    // Get or generate radio script
    let radioScript = digest.radio_script;
    
    if (!radioScript) {
      // Generate radio script first
      const scriptRes = await fetch(
        `${request.nextUrl.origin}/api/generate-radio-script`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Cookie": request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ digest_id }),
        }
      );

      if (!scriptRes.ok) {
        return NextResponse.json(
          { error: "Failed to generate radio script" },
          { status: 500 }
        );
      }

      const scriptData = await scriptRes.json();
      radioScript = scriptData.radio_script;
    }

    if (!radioScript) {
      return NextResponse.json(
        { error: "No radio script available" },
        { status: 500 }
      );
    }

    // Use radio script for TTS
    const textBody = radioScript;

    // Call Google Cloud TTS
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS service not configured" },
        { status: 503 }
      );
    }

    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: textBody },
          voice: {
            languageCode: "en-US",
            name: "en-US-Casual-K",
            ssmlGender: "MALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
          },
        }),
      }
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("Google TTS error:", errText);
      return NextResponse.json(
        { error: "TTS generation failed" },
        { status: 502 }
      );
    }

    const ttsData = await ttsRes.json();
    const audioContent = ttsData.audioContent; // base64 encoded

    // Decode and upload to Supabase Storage
    const audioBuffer = Buffer.from(audioContent, "base64");
    const fileName = `${authUser.id}/${digest_id}.mp3`;

    const { error: uploadError } = await serviceClient.storage
      .from("audio-digests")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to store audio" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = serviceClient.storage.from("audio-digests").getPublicUrl(fileName);

    // Update digest with audio URL
    await serviceClient
      .from("digests")
      .update({ audio_url: publicUrl })
      .eq("id", digest_id);

    return NextResponse.json({ audio_url: publicUrl });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
