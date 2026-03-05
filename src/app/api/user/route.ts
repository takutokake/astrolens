import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { preferencesSchema } from "@/lib/validations";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.error("❌ No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`👤 Fetching profile for user: ${authUser.id}`);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.error("❌ Supabase query error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // If user doesn't exist, create them
      if (error.code === "PGRST116") {
        console.log("🔧 User profile not found, creating...");
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            email: authUser.email!,
            name: authUser.user_metadata?.name || null,
            categories: [],
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Failed to create user profile:", createError);
          return NextResponse.json(
            { error: "Failed to create user profile", details: createError.message },
            { status: 500 }
          );
        }

        console.log("✅ User profile created");
        return NextResponse.json({ user: newUser });
      }

      return NextResponse.json(
        { error: "User profile not found", details: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      console.error("❌ No data returned from query");
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("✅ User profile fetched successfully");
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("❌ Exception in GET /api/user:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.error("❌ No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`👤 Updating preferences for user: ${authUser.id}`);

    const body = await request.json();
    console.log("📝 Request body:", JSON.stringify(body, null, 2));

    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      console.error("❌ Validation failed:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid preferences", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed, updating DB...");

    const { data, error } = await supabase
      .from("users")
      .update(parsed.data)
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { 
          error: "Failed to update preferences",
          details: error.message,
          hint: error.hint 
        },
        { status: 500 }
      );
    }

    console.log("✅ User preferences updated successfully");
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("❌ Exception in PATCH /api/user:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
