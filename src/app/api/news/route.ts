import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { User } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const { allowed } = await checkRateLimit(authUser.id, "/api/news");
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get user preferences
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found", details: userError },
        { status: 404 }
      );
    }

    const user = userData as User;

    // Debug logging
    console.log(`📊 User preferences:`, {
      keywords: user.keywords,
      languages: user.languages,
      categories: user.categories
    });

    // Optional category override from query params
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("categories");
    const categories = categoryParam
      ? categoryParam.split(",")
      : user.categories;

    if (!categories || categories.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    // Read directly from Supabase — articles are populated by the hourly cron
    const serviceClient = await createServiceClient();
    const { data: articles, error: fetchError } = await serviceClient
      .from("articles")
      .select("*")
      .in("category", categories)
      .order("published_at", { ascending: false })
      .limit(1000); // Fetch all available articles based on user preferences

    if (fetchError) {
      console.error("❌ Error reading articles from Supabase:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch articles" },
        { status: 500 }
      );
    }

    let finalArticles = articles || [];

    // DEDUPLICATION: Remove duplicate articles by article_id and similar titles
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    finalArticles = finalArticles.filter((article) => {
      // Skip if we've seen this article_id
      if (seenIds.has(article.article_id)) {
        console.log(`🔄 Skipping duplicate article_id: ${article.article_id}`);
        return false;
      }
      
      // Normalize title for similarity check (lowercase, remove punctuation)
      const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      
      // Skip if we've seen a very similar title
      if (seenTitles.has(normalizedTitle)) {
        console.log(`🔄 Skipping duplicate title: "${article.title.substring(0, 50)}..."`);
        return false;
      }
      
      // Filter out articles with very short descriptions (less than 50 characters)
      if (article.description && article.description.length < 50) {
        console.log(`⚠️ Skipping article with short description: "${article.title.substring(0, 50)}..."`);
        return false;
      }
      
      seenIds.add(article.article_id);
      seenTitles.add(normalizedTitle);
      return true;
    });

    console.log(`✨ After deduplication: ${finalArticles.length} unique articles`);

    // KEYWORD PRIORITIZATION: Articles matching keywords appear first
    if (user.keywords && user.keywords.length > 0) {
      console.log(`🔍 Checking ${finalArticles.length} articles for keywords:`, user.keywords);
      
      const keywordMatches: typeof articles = [];
      const nonMatches: typeof articles = [];

      finalArticles.forEach((article) => {
        const searchText = `${article.title} ${article.description} ${article.content || ""}`.toLowerCase();
        const hasKeyword = user.keywords.some((keyword: string) =>
          searchText.includes(keyword.toLowerCase())
        );

        if (hasKeyword) {
          keywordMatches.push(article);
          console.log(`✅ Match found: "${article.title.substring(0, 60)}..."`);
        } else {
          nonMatches.push(article);
        }
      });

      // Prioritize keyword matches first, then regular articles
      finalArticles = [...keywordMatches, ...nonMatches];
      console.log(`✨ Prioritized ${keywordMatches.length} keyword-matched articles out of ${finalArticles.length} total`);
    } else {
      console.log(`⚠️ No keywords set for user - showing articles by recency only`);
    }

    // Return all articles based on user preferences (no limit)
    return NextResponse.json({ articles: finalArticles });
  } catch (error) {
    console.error("❌ Exception in /api/news:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
