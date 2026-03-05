import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    console.log("=== User Debug ===");
    console.log("Auth user:", authUser?.id);
    console.log("Auth error:", authError);

    if (!authUser) {
      return NextResponse.json({
        error: "Not authenticated",
        authError,
      });
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    console.log("Profile data:", profile);
    console.log("Profile error:", profileError);

    // If no profile, create one
    if (!profile || profileError?.code === "PGRST116") {
      console.log("Creating user profile...");
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || null,
          categories: ["technology", "business", "sports", "entertainment", "world"],
        })
        .select()
        .single();

      console.log("New profile:", newProfile);
      console.log("Create error:", createError);

      return NextResponse.json({
        action: "created",
        profile: newProfile,
        error: createError,
      });
    }

    return NextResponse.json({
      action: "exists",
      profile,
      categories: profile.categories,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      error: "Exception",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
