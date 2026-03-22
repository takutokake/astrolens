import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";
import type { NewsDataResponse } from "@/lib/types";

const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest";

// Split categories into batches to minimize API calls while getting good coverage
// For faster accumulation, you can fetch each category separately (10 batches = ~100 articles/run)
const CATEGORY_BATCHES = [
  ["politics", "world", "business", "technology", "science"],
  ["entertainment", "sports", "health", "environment", "food"],
];

// Alternative: One category per batch for more articles (uncomment to use)
// const CATEGORY_BATCHES = CATEGORIES.map(cat => [cat]);

export async function GET(request: NextRequest) {
  // Verify cron secret (supports both header and query param for flexibility)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const providedSecret =
      authHeader?.replace("Bearer ", "") || querySecret;
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NEWSDATA_API_KEY not set" },
      { status: 500 }
    );
  }

  const supabase = await createServiceClient();
  let totalInserted = 0;
  const errors: string[] = [];

  for (const batch of CATEGORY_BATCHES) {
    try {
      const params = new URLSearchParams({
        apikey: apiKey,
        category: batch.join(","),
        language: "en",
      });

      console.log(`🔄 Cron: Fetching batch [${batch.join(", ")}]`);
      const res = await fetch(`${NEWSDATA_BASE_URL}?${params.toString()}`);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Cron: API error for batch [${batch.join(", ")}]: ${res.status} ${errText}`);
        errors.push(`Batch [${batch.join(",")}]: ${res.status}`);
        continue;
      }

      const data: NewsDataResponse = await res.json();

      if (!data.results?.length) {
        console.warn(`⚠️ Cron: 0 results for batch [${batch.join(", ")}]`);
        continue;
      }

      console.log(`✅ Cron: Got ${data.results.length} articles for batch [${batch.join(", ")}]`);

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

      const { data: upserted, error: upsertError } = await supabase
        .from("articles")
        .upsert(articles, { onConflict: "article_id", ignoreDuplicates: false })
        .select();

      if (upsertError) {
        console.error(`❌ Cron: Upsert error:`, upsertError);
        errors.push(`Upsert [${batch.join(",")}]: ${upsertError.message}`);
      } else {
        totalInserted += upserted?.length || 0;
        console.log(`💾 Cron: Stored ${upserted?.length || 0} articles`);
      }
    } catch (err) {
      console.error(`❌ Cron: Exception for batch [${batch.join(", ")}]:`, err);
      errors.push(`Exception [${batch.join(",")}]: ${err}`);
    }
  }

  // Clean up old articles (keep last 7 days to maintain ~500-1000 articles)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: deleted } = await supabase
    .from("articles")
    .delete()
    .lt("published_at", sevenDaysAgo)
    .select();
  
  console.log(`🗑️ Cleaned up ${deleted?.length || 0} articles older than 7 days`);

  // Get total article count
  const { count: totalArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  // Update global cache metadata
  await supabase.from("article_cache_metadata").upsert(
    {
      cache_key: "global:hourly",
      categories: [...CATEGORIES],
      countries: [],
      languages: ["en"],
      last_fetched_at: new Date().toISOString(),
      article_count: totalArticles || 0,
    },
    { onConflict: "cache_key" }
  );

  console.log(`✅ Cron complete: ${totalInserted} new, ${deleted?.length || 0} deleted, ${totalArticles} total articles`);

  return NextResponse.json({
    success: true,
    articles_stored: totalInserted,
    articles_deleted: deleted?.length || 0,
    total_articles: totalArticles || 0,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
