import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { interactionSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = await checkRateLimit(authUser.id, "/api/interactions");
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = interactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { article_id, interaction_type } = parsed.data;

    const { error } = await supabase.from("user_article_interactions").upsert(
      {
        user_id: authUser.id,
        article_id,
        interaction_type,
      },
      { onConflict: "user_id,article_id,interaction_type" }
    );

    if (error) {
      console.error("Interaction insert error:", error);
      return NextResponse.json(
        { error: "Failed to record interaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Interaction recorded" });
  } catch (error) {
    console.error("Interaction API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
