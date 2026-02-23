import { PrismaClient } from "@prisma/client";

interface UwflowCourse {
  code: string;
  name: string;
  liked: number | null;
  easy: number | null;
  useful: number | null;
  ratings: number | null;
}

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

export async function syncUwflowRatings(prisma?: PrismaClient) {
  const db = prisma ?? new PrismaClient();
  const shouldDisconnect = !prisma;

  try {
    // Fetch all courses from UWFlow
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

    if (uwflowCourses.length === 0) {
      return { matched: 0, unmatched: 0, updated: 0, error: "No courses returned from UWFlow" };
    }

    // Get all course codes from our DB
    const dbCourses = await db.course.findMany({
      select: { id: true, code: true },
    });

    // Build lookup: normalized code -> DB course id
    const dbCodeMap = new Map<string, string>();
    for (const c of dbCourses) {
      dbCodeMap.set(c.code.toLowerCase().replace(/\s+/g, ""), c.id);
    }

    let matched = 0;
    let unmatched = 0;
    let updated = 0;
    const now = new Date();

    // Batch updates using transactions
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
      await db.$transaction(
        batch.map((u) =>
          db.course.update({
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
    }

    return { matched, unmatched, updated, totalUwflow: uwflowCourses.length };
  } finally {
    if (shouldDisconnect) {
      await db.$disconnect();
    }
  }
}
