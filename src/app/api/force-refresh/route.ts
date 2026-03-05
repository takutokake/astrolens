import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" });
    }

    // Get user profile
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User profile not found" });
    }

    const serviceClient = await createServiceClient();

    // Delete ALL cache entries to force fresh fetch
    await serviceClient.from("article_cache_metadata").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await serviceClient.from("articles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("🗑️ Cleared all cache");

    // Now fetch fresh from NewsData.io
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NEWSDATA_API_KEY not set" });
    }

    const categories = userData.categories || [];
    if (categories.length === 0) {
      return NextResponse.json({ error: "No categories selected" });
    }

    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&category=${categories.join(",")}&language=en`;
    console.log("📡 Calling NewsData.io directly...");

    const res = await fetch(url, { next: { revalidate: 0 } });
    
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({
        error: "NewsData.io API failed",
        status: res.status,
        response: errorText,
      });
    }

    const data = await res.json();
    console.log(`✅ Got ${data.results?.length || 0} articles from NewsData.io`);

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        error: "NewsData.io returned 0 results",
        query: { categories, language: "en" },
        response: data,
      });
    }

    // Save articles to DB
    const articles = data.results.map((item: any) => ({
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
      cache_key: `cat:${categories.sort().join(",")}|co:|lang:en`,
    }));

    const { data: saved, error: saveError } = await serviceClient
      .from("articles")
      .insert(articles)
      .select();

    if (saveError) {
      console.error("❌ Save error:", saveError);
      return NextResponse.json({
        error: "Failed to save articles",
        details: saveError,
      });
    }

    console.log(`💾 Saved ${saved?.length || 0} articles`);

    return NextResponse.json({
      success: true,
      articlesFromAPI: data.results.length,
      articlesSaved: saved?.length || 0,
      articles: saved,
    });
  } catch (error) {
    console.error("❌ Force refresh error:", error);
    return NextResponse.json({
      error: "Exception",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
