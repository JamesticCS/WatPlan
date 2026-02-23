/**
 * Manual UWFlow sync script.
 * Usage: npx tsx scripts/sync-uwflow.ts
 */

import { PrismaClient } from "@prisma/client";

// Inline the sync logic to avoid import path issues when running from scripts/
const UWFLOW_GRAPHQL_URL = "https://uwflow.com/graphql";

const UWFLOW_QUERY = `
  query {
    course_search_index {
      code
      name
      liked
      easy
      useful
      ratings
    }
  }
`;

interface UwflowCourse {
  code: string;
  name: string;
  liked: number | null;
  easy: number | null;
  useful: number | null;
  ratings: number | null;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Fetching courses from UWFlow...");
    const response = await fetch(UWFLOW_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: UWFLOW_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`UWFlow API returned ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const uwflowCourses: UwflowCourse[] = json.data?.course_search_index ?? [];
    console.log(`Fetched ${uwflowCourses.length} courses from UWFlow`);

    if (uwflowCourses.length === 0) {
      console.error("No courses returned from UWFlow — aborting");
      process.exit(1);
    }

    // Get all course codes from our DB
    const dbCourses = await prisma.course.findMany({
      select: { id: true, code: true },
    });
    console.log(`Found ${dbCourses.length} courses in database`);

    // Build lookup: normalized code -> DB course id
    const dbCodeMap = new Map<string, string>();
    for (const c of dbCourses) {
      dbCodeMap.set(c.code.toLowerCase().replace(/\s+/g, ""), c.id);
    }

    let matched = 0;
    let unmatched = 0;
    let updated = 0;
    const now = new Date();
    const batchSize = 100;

    const updates: { id: string; liked: number | null; easy: number | null; useful: number | null; ratings: number | null }[] = [];

    for (const uf of uwflowCourses) {
      const normalizedCode = uf.code.toLowerCase().replace(/\s+/g, "");
      const dbId = dbCodeMap.get(normalizedCode);

      if (dbId) {
        matched++;
        updates.push({
          id: dbId,
          liked: uf.liked,
          easy: uf.easy,
          useful: uf.useful,
          ratings: uf.ratings,
        });
      } else {
        unmatched++;
      }
    }

    // Execute updates in batches
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map((u) =>
          prisma.course.update({
            where: { id: u.id },
            data: {
              uwflowLiked: u.liked,
              uwflowEasy: u.easy,
              uwflowUseful: u.useful,
              uwflowRatingsCount: u.ratings,
              uwflowUpdatedAt: now,
            },
          })
        )
      );
      updated += batch.length;
      console.log(`Updated ${updated}/${updates.length} courses...`);
    }

    console.log("\nSync complete:");
    console.log(`  UWFlow courses: ${uwflowCourses.length}`);
    console.log(`  Matched: ${matched}`);
    console.log(`  Unmatched: ${unmatched}`);
    console.log(`  Updated: ${updated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
