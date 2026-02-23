import { NextRequest, NextResponse } from "next/server";
import { syncUwflowRatings } from "@/lib/uwflow-sync";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncUwflowRatings(prisma);
    return NextResponse.json(result);
  } catch (error) {
    console.error("UWFlow sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
