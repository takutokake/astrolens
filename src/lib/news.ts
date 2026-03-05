import { createServiceClient } from "./supabase/server";
import type { Article, NewsDataResponse, User } from "./types";

const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function buildCacheKey(
  categories: string[],
  countries: string[],
  languages: string[]
): string {
  const sorted = [
    `cat:${[...categories].sort().join(",")}`,
    `co:${[...countries].sort().join(",")}`,
    `lang:${[...languages].sort().join(",")}`,
  ].join("|");
  return sorted;
}

export async function fetchNewsForUser(
  user: Pick<User, "categories" | "countries" | "languages" | "keywords" | "max_recency_hours" | "sentiment_mode" | "include_local">,
  overrideCategories?: string[]
): Promise<Article[]> {
  const categories = overrideCategories || user.categories;
  if (!categories.length) return [];

  const countries = user.countries || [];
  const languages = user.languages || ["en"];
  const cacheKey = buildCacheKey(categories, countries, languages);

  const supabase = await createServiceClient();

  // Check cache
  const { data: cacheMeta } = await supabase
    .from("article_cache_metadata")
    .select("*")
    .eq("cache_key", cacheKey)
    .single();

  if (cacheMeta) {
    const age = Date.now() - new Date(cacheMeta.last_fetched_at).getTime();
    console.log(`📦 Cache found: ${cacheMeta.article_count} articles, age: ${Math.floor(age / 1000)}s, TTL: ${CACHE_TTL_MS / 1000}s`);
    
    if (age < CACHE_TTL_MS && cacheMeta.article_count > 0) {
      // Serve from cache
      console.log("✅ Serving from cache");
      const { data: cached } = await supabase
        .from("articles")
        .select("*")
        .eq("cache_key", cacheKey)
        .order("published_at", { ascending: false })
        .limit(50);
      if (cached && cached.length > 0) {
        console.log(`📦 Returning ${cached.length} cached articles`);
        return cached as Article[];
      }
      console.log("⚠️ Cache metadata says articles exist but query returned 0");
    } else {
      console.log("⏰ Cache expired or empty, will fetch fresh");
    }
  } else {
    console.log("📭 No cache entry found, will fetch fresh");
  }

  // Fetch from NewsData.io
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.error("❌ NEWSDATA_API_KEY is not set in environment variables");
    // Return cached data if available as fallback
    const { data: fallback } = await supabase
      .from("articles")
      .select("*")
      .eq("cache_key", cacheKey)
      .order("published_at", { ascending: false })
      .limit(50);
    console.log(`📦 Returning ${fallback?.length || 0} cached articles as fallback`);
    return (fallback as Article[]) || [];
  }

  console.log(`🔍 Fetching news for categories: ${categories.join(", ")}`);
  console.log(`🌍 Countries: ${countries.join(", ") || "none"}, Languages: ${languages.join(", ")}`);
  console.log(`🔑 Cache key: ${cacheKey}`);

  const params = new URLSearchParams({
    apikey: apiKey,
    category: categories.join(","),
    language: languages.join(","),
  });

  // Only add country filter if explicitly set and not empty
  // Free tier NewsData.io has limited results per country+category combo
  if (countries.length > 0 && countries[0] !== "") {
    console.log(`🌍 Adding country filter: ${countries.join(",")}`);
    params.set("country", countries.join(","));
  } else {
    console.log("🌍 No country filter (fetching worldwide news)");
  }

  if (user.keywords && user.keywords.length > 0) {
    params.set("q", user.keywords.join(" OR "));
  }

  // Note: timeframe parameter requires paid plan, skip for free tier
  // if (user.max_recency_hours) {
  //   params.set("timeframe", String(user.max_recency_hours));
  // }

  try {
    const url = `${NEWSDATA_BASE_URL}?${params.toString()}`;
    console.log(`📡 Calling NewsData.io API...`);
    
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ NewsData.io API error: ${res.status}`);
      console.error(`Response: ${errorText}`);
      return [];
    }

    const data: NewsDataResponse = await res.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`⚠️ NewsData.io returned 0 results for query`);
      return [];
    }

    console.log(`✅ Fetched ${data.results.length} articles from NewsData.io`);

    // Upsert articles
    const articles = data.results.map((item) => ({
      article_id: item.article_id,
      title: item.title,
      description: item.description || "",
      content: item.content || null,
      category: item.category?.[0] || "world",
      source_name: item.source_name || "Unknown",
      source_id: item.source_id || null,
      image_url: item.image_url || null,
      article_url: item.link,
      published_at: item.pubDate || new Date().toISOString(),
      country: item.country?.[0] || null,
      language: item.language || "en",
      sentiment: item.sentiment || null,
      cache_key: cacheKey,
    }));

    // Upsert articles (ignore conflicts on article_id)
    const { data: upserted, error: upsertError } = await supabase
      .from("articles")
      .upsert(articles, { onConflict: "article_id", ignoreDuplicates: false })
      .select();

    if (upsertError) {
      console.error("❌ Failed to upsert articles to DB:", upsertError);
      console.error("Error details:", {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code,
      });
      // Return empty on DB error
      return [];
    } else {
      console.log(`💾 Saved ${upserted?.length || 0} articles to database`);
    }

    // Update cache metadata
    const { error: cacheError } = await supabase.from("article_cache_metadata").upsert(
      {
        cache_key: cacheKey,
        categories,
        countries,
        languages,
        last_fetched_at: new Date().toISOString(),
        article_count: upserted?.length || articles.length,
      },
      { onConflict: "cache_key" }
    );

    if (cacheError) {
      console.error("❌ Failed to update cache metadata:", cacheError);
    }

    return (upserted as Article[]) || [];
  } catch (error) {
    console.error("❌ Exception in fetchNewsForUser:", error);
    return [];
  }
}

export function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.article_id)) return false;
    seen.add(article.article_id);
    return true;
  });
}

export function trimToWordCount(articles: Article[], targetWords: number): Article[] {
  let total = 0;
  const result: Article[] = [];

  for (const article of articles) {
    const words = (article.description || "").split(/\s+/).length;
    if (total + words > targetWords && result.length > 0) break;
    result.push(article);
    total += words;
  }

  return result;
}
