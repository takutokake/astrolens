import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" });
    }

    // Update profile to remove restrictive filters
    const { data, error } = await supabase
      .from("users")
      .update({
        countries: [], // Remove country filter
        keywords: [], // Remove keyword filter temporarily
      })
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message });
    }

    return NextResponse.json({
      message: "Profile updated - removed country and keyword filters",
      profile: data,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
