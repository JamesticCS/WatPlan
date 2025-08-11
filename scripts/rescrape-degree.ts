/**
 * Targeted re-scrape of specific degrees.
 * Usage: npx tsx scripts/rescrape-degree.ts <kualiId1> [kualiId2] ...
 *
 * Example: npx tsx scripts/rescrape-degree.ts B1bwkJ0Rsh
 *
 * This re-scrapes just the listed degrees (by Kuali PID) without touching
 * courses or other degrees. Useful after fixing scraper bugs.
 */

import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { parseDegreePageHtml, mapKualiCredentialType } from './scraper/parsers';
import { ScraperDb } from './scraper/db';

const BASE_URL = 'https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog';
const RENDER_TIMEOUT = 15000;
const KUALI_PROGRAMS_API = 'https://uwaterloocm.kuali.co/api/v1/catalog/programs/663290e835aff7001cc62323';

interface KualiProgramEntry {
  pid: string;
  title: string;
  groupName1?: string;
  undergraduateCredentialType?: { name: string };
}

async function main() {
  const kualiIds = process.argv.slice(2);
  if (kualiIds.length === 0) {
    console.error('Usage: npx tsx scripts/rescrape-degree.ts <kualiId1> [kualiId2] ...');
    process.exit(1);
  }

  console.log(`Re-scraping ${kualiIds.length} degree(s): ${kualiIds.join(', ')}`);

  // Fetch program metadata from Kuali API
  console.log('Fetching program metadata from Kuali API...');
  const resp = await fetch(KUALI_PROGRAMS_API);
  const allPrograms: KualiProgramEntry[] = await resp.json();
  const programMap = new Map(allPrograms.map(p => [p.pid, p]));

  const prisma = new PrismaClient();
  const db = new ScraperDb(prisma);

  // Look up existing degrees to get their program group names
  const existingDegrees = await prisma.degree.findMany({
    where: { kualiId: { in: kualiIds } },
    include: { program: true },
  });
  const existingMap = new Map(existingDegrees.map(d => [d.kualiId, d]));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'WatPlan-Scraper/1.0 (academic planning tool)',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    for (const kualiId of kualiIds) {
      const meta = programMap.get(kualiId);
      const existing = existingMap.get(kualiId);
      const programGroupName = existing?.program?.name || meta?.title || 'Unknown';
      const credentialCategory = meta?.undergraduateCredentialType?.name
        ? mapKualiCredentialType(meta.undergraduateCredentialType.name, meta.title)
        : undefined;

      console.log(`\nScraping ${kualiId} (${meta?.title || 'unknown'})...`);

      // Navigate and get HTML
      const url = `${BASE_URL}#/programs/${kualiId}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      try {
        await page.waitForSelector('[class*="noBreak"], [class*="itemHeaderH2"]', {
          timeout: RENDER_TIMEOUT,
          state: 'attached',
        });
        await new Promise(r => setTimeout(r, 1500));
      } catch {
        // Continue with what we have
      }

      // Expand all collapsed panels
      try {
        const expandButtons = page.locator('button:has-text("keyboard_arrow_down")');
        const count = await expandButtons.count();
        for (let i = 0; i < count; i++) {
          try {
            await expandButtons.nth(i).click();
            await new Promise(r => setTimeout(r, 300));
          } catch { /* skip */ }
        }
        if (count > 0) await new Promise(r => setTimeout(r, 1000));
      } catch { /* no buttons */ }

      const html = await page.content();
      const degreeData = parseDegreePageHtml(
        html,
        kualiId,
        programGroupName,
        encodeURIComponent(programGroupName),
        credentialCategory,
      );

      console.log(`  Name: ${degreeData.name}`);
      console.log(`  Sections: ${degreeData.sections.length}`);
      for (const s of degreeData.sections) {
        const rootType = s.requirementTree?.logicType || '(none)';
        const childCount = s.requirementTree?.children?.length || 0;
        console.log(`    - ${s.label}: root=${rootType}, children=${childCount}`);
      }

      await db.upsertDegree(degreeData);
      console.log(`  OK: upserted successfully`);
    }
  } finally {
    await browser.close();
    await db.disconnect();
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
