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
      .limit(50);

    if (fetchError) {
      console.error("❌ Error reading articles from Supabase:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch articles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: articles || [] });
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
