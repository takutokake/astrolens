import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP, hashIP } from "@/lib/rate-limit";
import { radioScriptRequestSchema } from "@/lib/validations";
import type { Article } from "@/lib/types";

/**
 * SECURITY: Radio script generation endpoint
 * - Rate limited (10/hour for authenticated, 2/hour for IP)
 * - Strict input validation
 * - Authentication required
 * - API key stored server-side only
 */

const RADIO_SYSTEM_PROMPT = `You are a professional radio news host creating an engaging news broadcast. Your style is:
- Warm, conversational, and energetic
- Natural transitions between stories
- Brief context-setting intros for each segment
- Smooth segues that connect related topics
- Engaging but professional tone
- Clear pronunciation-friendly language

Format your script with:
- Opening greeting and overview
- Category-based segments with smooth transitions
- Story summaries that are concise but engaging
- Natural closing

Keep the total length appropriate for the target duration. Use natural speech patterns.`;

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authentication check
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: IP-based rate limiting (defense in depth)
    const clientIP = getClientIP(request);
    const ipHash = clientIP ? hashIP(clientIP) : undefined;

    // SECURITY: Rate limit check
    const { allowed, remaining, resetAt } = await checkRateLimit(
      authUser.id,
      "/api/generate-radio-script",
      ipHash
    );

    if (!allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          resetAt: resetAt?.toISOString()
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetAt?.toISOString() || "",
          }
        }
      );
    }

    // SECURITY: Strict input validation
    const body = await request.json().catch(() => ({}));
    const parsed = radioScriptRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors
        },
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

    // If radio script already exists, return it
    if (digest.radio_script) {
      return NextResponse.json({ 
        radio_script: digest.radio_script,
        cached: true 
      });
    }

    // Fetch articles for this digest
    const serviceClient = await createServiceClient();
    const { data: articles } = await serviceClient
      .from("articles")
      .select("*")
      .in("id", digest.article_ids);

    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { error: "No articles found for this digest" },
        { status: 404 }
      );
    }

    // Group articles by category
    const grouped: Record<string, Article[]> = {};
    (articles as Article[]).forEach((a) => {
      const cat = a.category || "world";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    });

    // Build context for AI
    const articlesContext = Object.entries(grouped)
      .map(([category, catArticles]) => {
        const stories = catArticles
          .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description || ""}`)
          .join("\n\n");
        return `## ${category.toUpperCase()}\n${stories}`;
      })
      .join("\n\n");

    const userPrompt = `Create a ${digest.duration}-minute radio news broadcast script from these articles.

${articlesContext}

Guidelines:
- Start with a warm greeting and brief overview
- Group stories by category with smooth transitions
- Each story should be 20-40 seconds when read aloud
- Use natural, conversational language
- Add brief context or connections between related stories
- End with a friendly sign-off
- Total script should be appropriate for ${digest.duration} minutes of audio

Write the complete radio script now:`;

    // Call OpenAI API
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: RADIO_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI API error:", errText);
      return NextResponse.json(
        { error: "Failed to generate radio script" },
        { status: 502 }
      );
    }

    const openaiData = await openaiRes.json();
    const radioScript = openaiData.choices[0]?.message?.content;

    if (!radioScript) {
      return NextResponse.json(
        { error: "No script generated" },
        { status: 500 }
      );
    }

    // Save radio script to digest
    await serviceClient
      .from("digests")
      .update({ radio_script: radioScript })
      .eq("id", digest_id);

    return NextResponse.json({ 
      radio_script: radioScript,
      cached: false 
    });
  } catch (error) {
    console.error("Radio script generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
