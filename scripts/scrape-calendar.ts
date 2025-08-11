import { chromium, Page } from 'playwright';
import { PrismaClient, CredentialCategory } from '@prisma/client';
import { parseCoursePageHtml, parseDegreePageHtml, extractKualiIdFromHref, mapKualiCredentialType } from './scraper/parsers';
import { ScraperDb } from './scraper/db';
import { GroupLink, ItemLink } from './scraper/types';

// ─── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog';
const NAV_DELAY = 200; // ms between page navigations
const RENDER_TIMEOUT = 15000; // ms to wait for SPA content to render

// ─── Logging ────────────────────────────────────────────────────────────────

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { timeZone: 'America/Halifax', hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

const log = {
  phase(msg: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  [${timestamp()}] ${msg}`);
    console.log(`${'='.repeat(60)}`);
  },
  group(msg: string) {
    console.log(`\n[${timestamp()}] --- ${msg} ---`);
  },
  info(msg: string) {
    console.log(`[${timestamp()}] ${msg}`);
  },
  item(msg: string) {
    console.log(`[${timestamp()}] ${msg}`);
  },
  error(msg: string, err?: unknown) {
    console.error(`[${timestamp()}] [ERROR] ${msg}`);
    if (err instanceof Error) console.error(`  ${err.message}`);
  },
  summary(phase: string, success: number, errors: number) {
    console.log(`\n[${timestamp()}] ${phase} complete: ${success} succeeded, ${errors} failed`);
  },
};

// ─── Navigation Helpers ─────────────────────────────────────────────────────

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Navigate to a hash route and wait for SPA to render */
async function navigateToHash(page: Page, hash: string): Promise<void> {
  const url = `${BASE_URL}${hash}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await delay(NAV_DELAY);
}

/** Get all group links from the courses or programs listing page */
async function getGroupLinks(page: Page, type: 'courses' | 'programs'): Promise<GroupLink[]> {
  await navigateToHash(page, `#/${type}`);

  // Wait for group links to appear in DOM (aria-hidden links aren't "visible")
  await page.waitForSelector(`a[href*="#/${type}?group="]`, { timeout: RENDER_TIMEOUT, state: 'attached' });
  await delay(1000); // Extra wait for all groups to load

  const rawGroups = await page.evaluate((t) => {
    const links = document.querySelectorAll(`a[href*="#/${t}?group="]`);
    return Array.from(links).map(a => {
      const fullHref = a.getAttribute('href') || '';
      const hashIndex = fullHref.indexOf('#');
      const hashPart = hashIndex >= 0 ? fullHref.slice(hashIndex) : fullHref;

      // Extract group name from URL parameter (textContent is just an icon label)
      const groupParam = new URL(fullHref, 'https://example.com').hash.split('group=')[1] || '';
      const name = decodeURIComponent(groupParam);

      return { name, href: hashPart };
    });
  }, type);

  // Deduplicate by href
  const seen = new Set<string>();
  return rawGroups.filter(g => {
    if (g.name.length === 0) return false;
    if (seen.has(g.href)) return false;
    seen.add(g.href);
    return true;
  });
}

/** Get all item links for a specific group */
async function getItemLinksForGroup(
  page: Page,
  groupHref: string,
  type: 'courses' | 'programs',
): Promise<ItemLink[]> {
  // Navigate to the group
  const url = `${BASE_URL}${groupHref}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait for the page to render
  await delay(2000);

  // Expand collapsible sections — courses/programs are inside ReactCollapse divs
  // The expand button has textContent "keyboard_arrow_down" (Material icon)
  try {
    const expandButtons = page.locator('button:has-text("keyboard_arrow_down")');
    const count = await expandButtons.count();
    for (let i = 0; i < count; i++) {
      try {
        await expandButtons.nth(i).click();
        await delay(500);
      } catch {
        // Button might not be clickable
      }
    }
    if (count > 0) await delay(1000);
  } catch {
    // No expand buttons found
  }

  // Wait for item links
  try {
    await page.waitForSelector(`a[href*="/${type}/"]`, { timeout: RENDER_TIMEOUT, state: 'attached' });
  } catch {
    // No items in this group
    return [];
  }

  // Collect item links
  const rawLinks = await page.evaluate((t) => {
    const links = document.querySelectorAll(`a[href*="/${t}/"]`);
    return Array.from(links).map(a => ({
      name: a.textContent?.trim() || '',
      href: a.getAttribute('href') || '',
    }));
  }, type);

  // Extract kualiIds and filter valid ones
  const items: ItemLink[] = [];
  const seen = new Set<string>();
  for (const link of rawLinks) {
    const kualiId = extractKualiIdFromHref(link.href, type);
    if (kualiId && !seen.has(kualiId)) {
      seen.add(kualiId);
      items.push({ name: link.name, href: `#/${type}/${kualiId}`, kualiId });
    }
  }

  return items;
}

/** Navigate to a course page and return the HTML */
async function getCoursePage(page: Page, kualiId: string): Promise<string> {
  await navigateToHash(page, `#/courses/${kualiId}`);
  // Wait for course content to render (look for H3 elements which contain field labels)
  try {
    await page.waitForSelector('h3', { timeout: RENDER_TIMEOUT, state: 'attached' });
    await delay(1000); // Extra wait for full content
  } catch {
    // Page might not have H3s — still return what we have
  }
  return page.content();
}

/** Navigate to a degree page and return the HTML */
async function getDegreePage(page: Page, kualiId: string): Promise<string> {
  await navigateToHash(page, `#/programs/${kualiId}`);
  // Wait for degree content to render — look for noBreak metadata divs or panel headers
  try {
    await page.waitForSelector('[class*="noBreak"], [class*="itemHeaderH2"]', { timeout: RENDER_TIMEOUT, state: 'attached' });
    await delay(1500); // Extra wait for panels to load
  } catch {
    // Still return what we have
  }
  return page.content();
}

// ─── Kuali API ──────────────────────────────────────────────────────────────

const KUALI_PROGRAMS_API = 'https://uwaterloocm.kuali.co/api/v1/catalog/programs/663290e835aff7001cc62323';
const KUALI_COURSES_API = 'https://uwaterloocm.kuali.co/api/v1/catalog/courses/663290e835aff7001cc62323';

interface KualiCourseEntry {
  pid: string;
  __catalogCourseId?: string;  // e.g. "GEOG423"
  title: string;
  subjectCode?: { name: string };
}

/** Fetch course PID map from Kuali courses API.
 *  Returns a map of courseCode (e.g. "GEOG423") → kualiId (pid). */
async function fetchCoursePidMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const response = await fetch(KUALI_COURSES_API);
    if (!response.ok) {
      log.error(`Kuali courses API returned ${response.status}`);
      return map;
    }
    const courses: KualiCourseEntry[] = await response.json();
    for (const c of courses) {
      if (c.__catalogCourseId) {
        map.set(c.__catalogCourseId, c.pid);
      }
    }
    log.info(`Loaded ${map.size} course PIDs from Kuali API`);
  } catch (err) {
    log.error('Failed to fetch Kuali courses API', err);
  }
  return map;
}

interface KualiProgramEntry {
  pid: string;
  title: string;
  undergraduateCredentialType?: { name: string; id: string };
}

/** Fetch credential type map from Kuali programs API.
 *  Returns a map of kualiId (pid) → CredentialCategory. */
async function fetchCredentialTypeMap(): Promise<Map<string, CredentialCategory>> {
  const map = new Map<string, CredentialCategory>();
  try {
    const response = await fetch(KUALI_PROGRAMS_API);
    if (!response.ok) {
      log.error(`Kuali programs API returned ${response.status} — falling back to name inference`);
      return map;
    }
    const programs: KualiProgramEntry[] = await response.json();
    for (const p of programs) {
      if (p.undergraduateCredentialType?.name) {
        const category = mapKualiCredentialType(p.undergraduateCredentialType.name, p.title);
        map.set(p.pid, category);
      }
    }
    log.info(`Loaded credential types for ${map.size} programs from Kuali API`);
  } catch (err) {
    log.error('Failed to fetch Kuali programs API — falling back to name inference', err);
  }
  return map;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient();
  const db = new ScraperDb(prisma);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'WatPlan-Scraper/1.0 (academic planning tool)',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ═══════════════ PHASE 1: COURSES ═══════════════
    log.phase('Phase 1: Courses');

    const courseGroups = await getGroupLinks(page, 'courses');
    log.info(`Found ${courseGroups.length} course groups`);

    let courseSuccess = 0;
    let courseErrors = 0;

    for (let gi = 0; gi < courseGroups.length; gi++) {
      const group = courseGroups[gi];
      log.group(`Course group: ${group.name} (${gi + 1}/${courseGroups.length})`);

      try {
        const items = await getItemLinksForGroup(page, group.href, 'courses');
        log.info(`  ${items.length} courses in group`);

        for (const item of items) {
          try {
            const html = await getCoursePage(page, item.kualiId);
            const courseData = parseCoursePageHtml(html, item.kualiId);
            await db.upsertCourse(courseData, group.name);
            courseSuccess++;
            log.item(`  OK: ${courseData.code} - ${courseData.name}`);
          } catch (err) {
            courseErrors++;
            log.error(`  FAIL: ${item.name} (${item.kualiId})`, err);
          }
        }
      } catch (err) {
        log.error(`  FAIL: entire group ${group.name}`, err);
      }
    }

    log.summary('Courses', courseSuccess, courseErrors);

    // Post-Phase-1: resolve unlinked course requirements
    log.info('\nResolving unlinked course requirements...');
    const resolved = await db.resolveUnlinkedCourseRequirements();
    log.info(`Resolved ${resolved} unlinked course requirements`);

    // Post-Phase-1: scrape missing courses referenced in requirement trees
    log.info('\nChecking for missing courses referenced in requirements...');
    const missingCodes = await db.getUnlinkedCourseCodes();
    if (missingCodes.length > 0) {
      log.info(`Found ${missingCodes.length} unlinked course codes: ${missingCodes.join(', ')}`);
      const coursePidMap = await fetchCoursePidMap();
      let missingScraped = 0;
      for (const code of missingCodes) {
        const pid = coursePidMap.get(code);
        if (!pid) {
          log.info(`  ${code}: not found in Kuali API — skipping`);
          continue;
        }
        try {
          const html = await getCoursePage(page, pid);
          const courseData = parseCoursePageHtml(html, pid);
          // Derive subject group name from the code
          const subjectCode = code.match(/^[A-Z]+/)?.[0] || code;
          await db.upsertCourse(courseData, subjectCode);
          missingScraped++;
          log.item(`  OK: ${courseData.code} - ${courseData.name}`);
        } catch (err) {
          log.error(`  FAIL: ${code} (${pid})`, err);
        }
      }
      log.info(`Scraped ${missingScraped} missing courses`);

      // Re-resolve after scraping missing courses
      if (missingScraped > 0) {
        const reresolved = await db.resolveUnlinkedCourseRequirements();
        log.info(`Re-resolved ${reresolved} unlinked course requirements`);
      }
    }

    // ═══════════════ PHASE 2: DEGREES ═══════════════
    log.phase('Phase 2: Degrees');

    // Fetch credential types from Kuali API (authoritative source)
    const credentialTypeMap = await fetchCredentialTypeMap();

    const programGroups = await getGroupLinks(page, 'programs');
    log.info(`Found ${programGroups.length} program groups`);

    let degreeSuccess = 0;
    let degreeErrors = 0;

    for (let gi = 0; gi < programGroups.length; gi++) {
      const group = programGroups[gi];
      log.group(`Program group: ${group.name} (${gi + 1}/${programGroups.length})`);

      const programGroupKualiId = encodeURIComponent(group.name);

      try {
        const items = await getItemLinksForGroup(page, group.href, 'programs');
        log.info(`  ${items.length} degrees in group`);

        for (const item of items) {
          try {
            const html = await getDegreePage(page, item.kualiId);
            const credentialCategory = credentialTypeMap.get(item.kualiId);
            const degreeData = parseDegreePageHtml(
              html,
              item.kualiId,
              group.name,
              programGroupKualiId,
              credentialCategory,
            );
            await db.upsertDegree(degreeData);
            degreeSuccess++;
            log.item(`  OK: ${degreeData.name}`);
          } catch (err) {
            degreeErrors++;
            log.error(`  FAIL: ${item.name} (${item.kualiId})`, err);
          }
        }
      } catch (err) {
        log.error(`  FAIL: entire group ${group.name}`, err);
      }
    }

    log.summary('Degrees', degreeSuccess, degreeErrors);

    // Post-Phase-2: resolve Subject → Faculty mapping
    log.info('\nResolving subject faculty assignments...');
    const facultyResolved = await db.resolveSubjectFaculties();
    log.info(`Resolved ${facultyResolved} subject faculty assignments`);

  } finally {
    await browser.close();
    await db.disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
