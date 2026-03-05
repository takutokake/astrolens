import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchNewsForUser, deduplicateArticles, trimToWordCount } from "@/lib/news";
import { checkRateLimit } from "@/lib/rate-limit";
import { digestRequestSchemaRefined } from "@/lib/validations";
import { getTargetWordCount } from "@/lib/types";
import type { User, Duration } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const { allowed } = await checkRateLimit(authUser.id, "/api/digest");
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 digests per hour." },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await request.json();
    const parsed = digestRequestSchemaRefined.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { duration, categories, include_local, mode } = parsed.data;

    // Get user preferences
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const user = userData as User;

    // Fetch news for the requested categories
    const rawArticles = await fetchNewsForUser(
      { ...user, include_local: include_local ?? user.include_local },
      categories
    );

    // Deduplicate
    const unique = deduplicateArticles(rawArticles);

    // Trim to target word count
    const targetWords = getTargetWordCount(duration as Duration);
    const selected = trimToWordCount(unique, targetWords);

    if (selected.length === 0) {
      return NextResponse.json(
        { error: "No articles found for the selected categories" },
        { status: 404 }
      );
    }

    // Calculate actual word count
    const wordCount = selected.reduce((sum, a) => {
      return sum + (a.description || "").split(/\s+/).length;
    }, 0);

    // Create digest record
    const { data: digest, error: digestError } = await supabase
      .from("digests")
      .insert({
        user_id: authUser.id,
        duration,
        categories,
        article_ids: selected.map((a) => a.id),
        word_count: wordCount,
      })
      .select()
      .single();

    if (digestError) {
      console.error("Digest insert error:", digestError);
      return NextResponse.json(
        { error: "Failed to create digest" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      digest,
      articles: selected,
      mode,
    });
  } catch (error) {
    console.error("Digest API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's digest history (last 30 days)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: digests, error } = await supabase
      .from("digests")
      .select("*")
      .eq("user_id", authUser.id)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch digests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ digests });
  } catch (error) {
    console.error("Digest history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
