import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savedArticleSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("saved_articles")
      .select(
        `
        id,
        saved_at,
        article:articles (
          id,
          title,
          description,
          category,
          source_name,
          image_url,
          article_url,
          published_at
        )
      `
      )
      .eq("user_id", authUser.id)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("Saved articles fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch saved articles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved: data });
  } catch (error) {
    console.error("Saved API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = await checkRateLimit(authUser.id, "/api/saved");
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = savedArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { article_id } = parsed.data;

    const { error } = await supabase.from("saved_articles").insert({
      user_id: authUser.id,
      article_id,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already saved" });
      }
      return NextResponse.json(
        { error: "Failed to save article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Article saved" });
  } catch (error) {
    console.error("Save API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = savedArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { article_id } = parsed.data;

    const { error } = await supabase
      .from("saved_articles")
      .delete()
      .eq("user_id", authUser.id)
      .eq("article_id", article_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to unsave article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Article unsaved" });
  } catch (error) {
    console.error("Unsave API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
