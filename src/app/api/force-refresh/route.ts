import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";
import type { NewsDataResponse } from "@/lib/types";

const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest";

const CATEGORY_BATCHES = [
  ["politics", "world", "business", "technology", "science"],
  ["entertainment", "sports", "health", "environment", "food"],
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NEWSDATA_API_KEY not set" }, { status: 500 });
    }

    const serviceClient = await createServiceClient();
    let totalInserted = 0;
    const errors: string[] = [];

    for (const batch of CATEGORY_BATCHES) {
      try {
        const params = new URLSearchParams({
          apikey: apiKey,
          category: batch.join(","),
          language: "en",
        });

        const res = await fetch(`${NEWSDATA_BASE_URL}?${params.toString()}`);
        if (!res.ok) {
          errors.push(`Batch [${batch.join(",")}]: ${res.status}`);
          continue;
        }

        const data: NewsDataResponse = await res.json();
        if (!data.results?.length) continue;

        const articles = data.results.map((item) => ({
          article_id: item.article_id,
          title: item.title,
          description: item.description || "",
          content: item.content || null,
          category: item.category?.[0] || batch[0],
          source_name: item.source_name || "Unknown",
          source_id: item.source_id || null,
          image_url: item.image_url || null,
          article_url: item.link,
          published_at: item.pubDate || new Date().toISOString(),
          country: item.country?.[0] || null,
          language: item.language || "en",
          sentiment: item.sentiment || null,
          cache_key: `global:${item.category?.[0] || batch[0]}`,
        }));

        const { data: upserted, error: upsertError } = await serviceClient
          .from("articles")
          .upsert(articles, { onConflict: "article_id", ignoreDuplicates: false })
          .select();

        if (upsertError) {
          errors.push(`Upsert [${batch.join(",")}]: ${upsertError.message}`);
        } else {
          totalInserted += upserted?.length || 0;
        }
      } catch (err) {
        errors.push(`Exception [${batch.join(",")}]: ${err}`);
      }
    }

    // Update global cache metadata
    await serviceClient.from("article_cache_metadata").upsert(
      {
        cache_key: "global:hourly",
        categories: [...CATEGORIES],
        countries: [],
        languages: ["en"],
        last_fetched_at: new Date().toISOString(),
        article_count: totalInserted,
      },
      { onConflict: "cache_key" }
    );

    return NextResponse.json({
      success: true,
      articles_stored: totalInserted,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Force refresh error:", error);
    return NextResponse.json({
      error: "Exception",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
