import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchNewsForUser } from "@/lib/news";
import { checkRateLimit } from "@/lib/rate-limit";
import type { User } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    console.log("=== /api/news called ===");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.error("❌ No auth user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Auth user:", authUser.id);

    // Rate limit
    const { allowed } = await checkRateLimit(authUser.id, "/api/news");
    if (!allowed) {
      console.error("❌ Rate limit exceeded");
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    console.log("✅ Rate limit passed");

    // Get user preferences
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      console.error("❌ User profile error:", userError);
      return NextResponse.json(
        { error: "User profile not found", details: userError },
        { status: 404 }
      );
    }

    const user = userData as User;
    console.log("✅ User profile loaded, categories:", user.categories);

    // Optional category override from query params
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("categories");
    const overrideCategories = categoryParam
      ? categoryParam.split(",")
      : undefined;

    console.log("📰 Fetching articles...");
    const articles = await fetchNewsForUser(user, overrideCategories);
    console.log(`✅ Fetched ${articles.length} articles`);

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("❌ Exception in /api/news:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
