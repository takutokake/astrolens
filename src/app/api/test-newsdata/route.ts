import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEWSDATA_API_KEY;
  
  console.log("=== NewsData.io API Test ===");
  console.log("API Key present:", !!apiKey);
  console.log("API Key value:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING");

  if (!apiKey) {
    return NextResponse.json({
      error: "NEWSDATA_API_KEY not found in environment",
      envVars: Object.keys(process.env).filter(k => k.includes("NEWS")),
    });
  }

  try {
    // Test with a simple query
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&category=technology&language=en`;
    console.log("Testing URL:", url.replace(apiKey, "***"));

    const res = await fetch(url, {
      next: { revalidate: 0 },
    });

    console.log("Response status:", res.status);
    console.log("Response headers:", Object.fromEntries(res.headers.entries()));

    const text = await res.text();
    console.log("Response body (first 500 chars):", text.substring(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({
        error: "Failed to parse JSON response",
        status: res.status,
        body: text.substring(0, 1000),
      });
    }

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      resultCount: data.results?.length || 0,
      data: data,
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({
      error: "Exception during test",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
