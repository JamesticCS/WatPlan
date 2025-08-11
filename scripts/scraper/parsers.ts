import { JSDOM } from 'jsdom';
import { CredentialCategory } from '@prisma/client';
import { RequirementNode, CourseData, DegreeData, SectionData } from './types';

// ─── Constants ──────────────────────────────────────────────────────────────

const N_OF_PATTERN = /(?:complete|completed|enrolled in)\s+(?:at least\s+)?(\d+)\s+of/i;
const N_MAX_PATTERN = /(?:no more than|at most|maximum of)\s+(\d+)\s+(?:from|of)/i;
const UNITS_PATTERN = /(?:complete|earned at least)\s+([\d.]+)\s+unit/i;
const MIN_GRADE_PATTERN = /minimum grade of (\d+)/i;
const COURSE_LINK_SELECTOR = 'a[href*="/courses/"]';

// LI text patterns to filter out (not real course requirements)
const FILTER_PATTERNS = [
  /must be in level/i,
  /students must be in level/i,
  /enrolled in H-/i,
  /enrolled in Honours/i,
  /advanced standing/i,
];

// Degree panel labels to skip (metadata, not requirement trees)
const SKIP_PANEL_LABELS = [
  /minimum average/i,
  /graduation requirements/i,
  /notes$/i,
  /admission requirements/i,
  /specializations/i,
  /co-operative education program requirements/i,
  /additional information/i,
  /student audience/i,
];

// ─── Utilities ──────────────────────────────────────────────────────────────

/** Extract kualiId from an href like "#/courses/Skb6pOVmKh" or "#/courses/view/67aa2902d9e5f885cf6d24e0"
 *  Prereq/degree links use /courses/view/{mongoId} format; navigation links use /courses/{pid} format.
 *  Both are valid kualiIds we need to accept. */
export function extractKualiIdFromHref(href: string, type: 'courses' | 'programs'): string | null {
  const parts = href.split(`/${type}/`);
  if (parts.length < 2) return null;
  let remainder = parts[1].split('?')[0].split('#')[0];
  // Handle /courses/view/{mongoId} format used in prereq and degree requirement links
  if (remainder.startsWith('view/')) {
    remainder = remainder.slice(5);
  }
  const id = remainder.split('/')[0];
  if (!id || id.length === 0) return null;
  return id;
}

/** Get the direct text content of an element, excluding text from child elements */
function getDirectText(el: Element): string {
  let text = '';
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3) { // TEXT_NODE
      text += node.textContent || '';
    }
  }
  return text.trim();
}

/** Get the text of the trigger span/div in an LI (not including nested UL text) */
function getTriggerText(li: Element): string {
  // Standard pattern: LI > SPAN("trigger text") + UL
  const directSpan = li.querySelector(':scope > span');
  if (directSpan) return directSpan.textContent?.trim() || '';

  // Kuali DIV[TEXT_NODE + SPAN? + TEXT_NODE? + DIV(children)] pattern:
  // The trigger text lives inside a direct child DIV as text nodes (and optional SPANs),
  // with the actual course list in a nested DIV > UL.
  // e.g. "Choose any of the following:" or "Complete no more than 2 from the following:"
  // Collect inline content (text nodes + spans), skipping block DIV children.
  const directDiv = li.querySelector(':scope > div');
  if (directDiv) {
    let text = '';
    for (const node of Array.from(directDiv.childNodes)) {
      if (node.nodeType === 3) { // TEXT_NODE
        text += node.textContent || '';
      } else if (node.nodeType === 1) {
        const el = node as Element;
        if (el.tagName === 'SPAN') {
          text += el.textContent || '';
        }
        // Skip DIV children (they contain the nested UL)
      }
    }
    const trimmed = text.trim();
    if (trimmed) return trimmed;
  }

  // Fallback: get first text node of the LI itself
  return getDirectText(li);
}

/** Get the display text from a leaf LI — full text content for proper filter matching */
function getLeafText(li: Element): string {
  // Use full text of the LI (minus nested ULs) so filter patterns can match
  // context like "Students must be in level 1A" and "Enrolled in H-..."
  const clone = li.cloneNode(true) as Element;
  const nestedUl = clone.querySelector('ul');
  if (nestedUl) nestedUl.remove();
  return clone.textContent?.trim() || '';
}

/** Check if an LI should be filtered out */
export function shouldFilterLi(text: string): boolean {
  // Check against filter patterns
  if (FILTER_PATTERNS.some(p => p.test(text))) return true;
  // Filter enrollment restrictions that don't contain course-related language
  if (/enrolled in\s+[A-Z]/i.test(text) && !/complete|course|unit/i.test(text)) return true;
  return false;
}

// ─── Requirement Tree Parser ────────────────────────────────────────────────

/** Get child LI elements from a UL, handling DIV.rules_groupHeader wrappers.
 *  Kuali wraps some LIs in a DIV with an empty SPAN separator:
 *    <DIV><SPAN class="rules_groupHeader_37"/><LI>...</LI></DIV>
 *  This function unwraps those DIVs so the parser sees all rule nodes. */
function getChildLIs(ul: Element): Element[] {
  const result: Element[] = [];
  for (const child of Array.from(ul.children)) {
    if (child.tagName === 'LI') {
      result.push(child);
    } else if (child.tagName === 'DIV') {
      const wrappedLI = child.querySelector(':scope > li');
      if (wrappedLI) result.push(wrappedLI);
    }
  }
  return result;
}

/**
 * Parse an HTML string containing requirement list items into a RequirementNode tree.
 * This is the heart of the scraper — used for course prereqs/coreqs AND degree sections.
 */
export function parseRequirementTree(html: string): RequirementNode | null {
  const dom = new JSDOM(`<div>${html}</div>`);
  const doc = dom.window.document;
  const container = doc.querySelector('div')!;

  // Find the top-level UL
  const topUl = container.querySelector('ul');
  if (!topUl) {
    // No UL found — might be a single text rule
    const text = container.textContent?.trim();
    if (text) {
      return {
        logicType: 'TEXT_RULE',
        text,
        children: [],
        displayOrder: 0,
      };
    }
    return null;
  }

  // Get top-level LIs (handles DIV.rules_groupHeader wrappers)
  const topLIs = getChildLIs(topUl);
  if (topLIs.length === 0) return null;

  // If there's only one top-level LI, it IS the root
  if (topLIs.length === 1) {
    return parseLiNode(topLIs[0], 0);
  }

  // Multiple top-level LIs: wrap in an ALL node
  const children: RequirementNode[] = [];
  topLIs.forEach((li, i) => {
    const node = parseLiNode(li, i);
    if (node) children.push(node);
  });

  if (children.length === 0) return null;
  if (children.length === 1) return children[0];

  // If the first child is a "Choose any of the following" TEXT_RULE (flat sibling pattern),
  // convert the whole group to N_OF(1) and drop the text node
  if (
    children[0].logicType === 'TEXT_RULE' &&
    /choose any of/i.test(children[0].text || '')
  ) {
    const label = children[0].text || 'Choose any of the following';
    children.shift();
    if (children.length === 0) return null;
    return {
      logicType: 'N_OF',
      label,
      n: 1,
      children,
      displayOrder: 0,
    };
  }

  return {
    logicType: 'ALL',
    children,
    displayOrder: 0,
  };
}

/** Parse a single LI element into a RequirementNode */
function parseLiNode(li: Element, displayOrder: number): RequirementNode | null {
  const hasNestedUl = !!li.querySelector('ul');

  if (!hasNestedUl) {
    return parseLeafNode(li, displayOrder);
  }

  return parseGroupNode(li, displayOrder);
}

/** Parse a leaf LI (no nested UL) into a COURSE, UNITS, or TEXT_RULE node */
function parseLeafNode(li: Element, displayOrder: number): RequirementNode | null {
  const text = getLeafText(li);
  if (shouldFilterLi(text)) return null;

  // Check for course link
  const courseLink = li.querySelector(COURSE_LINK_SELECTOR);
  if (courseLink) {
    const href = courseLink.getAttribute('href') || '';
    const kualiId = extractKualiIdFromHref(href, 'courses');
    if (kualiId) {
      const courseCode = courseLink.textContent?.trim().replace(/\s+/g, '') || '';
      const gradeMatch = text.match(MIN_GRADE_PATTERN);
      return {
        logicType: 'COURSE',
        courseCode,
        courseKualiId: kualiId,
        minGradeRequired: gradeMatch ? parseInt(gradeMatch[1], 10) : undefined,
        children: [],
        displayOrder,
      };
    }
  }

  // Check for units rule
  const unitsMatch = text.match(UNITS_PATTERN);
  if (unitsMatch) {
    return {
      logicType: 'UNITS',
      unitsRequired: parseFloat(unitsMatch[1]),
      text,
      children: [],
      displayOrder,
    };
  }

  // Fallback: TEXT_RULE
  if (!text) return null;
  return {
    logicType: 'TEXT_RULE',
    text,
    children: [],
    displayOrder,
  };
}

/** Parse a group LI (has nested UL) into an ALL or N_OF node */
function parseGroupNode(li: Element, displayOrder: number): RequirementNode | null {
  const triggerText = getTriggerText(li);
  if (shouldFilterLi(triggerText)) return null;

  // Get child LIs from the nested UL
  const childUl = li.querySelector('ul');
  if (!childUl) return null;

  const childLIs = getChildLIs(childUl);
  const children: RequirementNode[] = [];

  childLIs.forEach((childLi, i) => {
    const node = parseLiNode(childLi, i);
    if (node) children.push(node);
  });

  // If all children were filtered out, drop this node
  if (children.length === 0) return null;

  // "Choose any of the following" = pick 1+ from this list → N_OF(1)
  if (/choose any of/i.test(triggerText)) {
    return {
      logicType: 'N_OF',
      label: triggerText,
      n: 1,
      children,
      displayOrder,
    };
  }

  // "No more than N from the following" = max constraint → N_OF(N)
  // Progress tracks correctly (100% at N courses); max enforcement is informational via label
  const nMaxMatch = triggerText.match(N_MAX_PATTERN);
  if (nMaxMatch) {
    return {
      logicType: 'N_OF',
      label: triggerText,
      n: parseInt(nMaxMatch[1], 10),
      children,
      displayOrder,
    };
  }

  // Determine ALL vs N_OF
  const nOfMatch = triggerText.match(N_OF_PATTERN);
  if (nOfMatch) {
    return {
      logicType: 'N_OF',
      label: triggerText,
      n: parseInt(nOfMatch[1], 10),
      children,
      displayOrder,
    };
  }

  // Kuali numbered sub-groups: trigger text is just a number (e.g. "1", "2")
  // These mean "complete N of the following" — treat as N_OF
  const numberedMatch = triggerText.match(/^(\d+)$/);
  if (numberedMatch) {
    return {
      logicType: 'N_OF',
      label: triggerText,
      n: parseInt(numberedMatch[1], 10),
      children,
      displayOrder,
    };
  }

  // Kuali grade threshold groups: trigger text is a percentage (e.g. "60%", "70%")
  // Propagate as minGradeRequired on child COURSE nodes
  const gradeMatch = triggerText.match(/^(\d+)%$/);
  if (gradeMatch) {
    const grade = parseInt(gradeMatch[1], 10);
    for (const child of children) {
      if (child.logicType === 'COURSE') {
        child.minGradeRequired = grade;
      }
    }
    // Flatten: if single child, return it directly
    if (children.length === 1) return children[0];
    // Multiple children with a grade threshold: wrap as ALL
    return { logicType: 'ALL', children, displayOrder };
  }

  return {
    logicType: 'ALL',
    label: triggerText || undefined,
    children,
    displayOrder,
  };
}

// ─── Course Page Parser ─────────────────────────────────────────────────────

/**
 * Parse the full HTML of a course detail page into a CourseData object.
 */
export function parseCoursePageHtml(html: string, kualiId: string): CourseData {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Extract course code and name from <title> or Kuali SPA <h2>
  // Format: "CODE - Title" e.g. "CS 341 - Algorithms"
  // Note: <h1> is the CMS page header ("Undergraduate studies"), not the course title
  const titleEl = doc.querySelector('title') || doc.querySelector('#__KUALI_TLP h2');
  const titleText = titleEl?.textContent?.trim() || '';
  const titleParts = titleText.split(' - ');
  const rawCode = titleParts[0]?.trim() || '';
  const name = titleParts.slice(1).join(' - ').trim() || rawCode;

  // Normalize code: remove spaces ("CS 341" -> "CS341")
  const code = rawCode.replace(/\s+/g, '');
  // Subject code: leading alpha chars
  const subjectMatch = code.match(/^([A-Z]+)/);
  const subjectCode = subjectMatch ? subjectMatch[1] : '';
  // Number: everything after subject code
  const number = code.slice(subjectCode.length);

  // Helper: find content after an H3 with matching text
  function findH3Content(labelPattern: RegExp): Element | null {
    const h3s = doc.querySelectorAll('h3');
    for (const h3 of Array.from(h3s)) {
      if (labelPattern.test(h3.textContent?.trim() || '')) {
        // Content is typically the next sibling or parent's next sibling
        const parent = h3.parentElement;
        if (parent) {
          const nextSibling = parent.nextElementSibling;
          if (nextSibling) return nextSibling;
        }
        return h3.nextElementSibling;
      }
    }
    return null;
  }

  function findH3Text(labelPattern: RegExp): string | null {
    const el = findH3Content(labelPattern);
    const text = el?.textContent?.trim();
    return text || null;
  }

  // Units
  const unitsText = findH3Text(/^Units$/i);
  const units = unitsText ? parseFloat(unitsText) : 0.5;

  // Description
  const description = findH3Text(/^Description$/i);

  // Prerequisites
  let prerequisiteTree: RequirementNode | null = null;
  const prereqEl = findH3Content(/^Prerequisite/i);
  if (prereqEl) {
    try {
      prerequisiteTree = parseRequirementTree(prereqEl.innerHTML);
    } catch {
      // Failed to parse prereqs — leave as null
    }
  }

  // Corequisites
  let corequisiteTree: RequirementNode | null = null;
  const coreqEl = findH3Content(/^Corequisite/i);
  if (coreqEl) {
    try {
      corequisiteTree = parseRequirementTree(coreqEl.innerHTML);
    } catch {
      // Failed to parse coreqs — leave as null
    }
  }

  // Antirequisites (plain text — extract only leaf LIs to avoid parent text duplication)
  let antiRequisiteText: string | null = null;
  const antiReqEl = findH3Content(/^Antirequisite/i);
  if (antiReqEl) {
    const lis = antiReqEl.querySelectorAll('li');
    if (lis.length > 0) {
      // Only use leaf LIs (no nested UL) to avoid parent LI text duplicating children
      const leafLis = Array.from(lis).filter(li => !li.querySelector('ul'));
      if (leafLis.length > 0) {
        antiRequisiteText = leafLis
          .map(li => li.textContent?.trim())
          .filter(Boolean)
          .join('\n');
      } else {
        // All LIs have nested ULs — fall back to full text
        antiRequisiteText = antiReqEl.textContent?.trim() || null;
      }
    } else {
      antiRequisiteText = antiReqEl.textContent?.trim() || null;
    }
  }

  // Special fields
  const specialCourseGrading = findH3Text(/^Special Course Grading$/i);
  const specialConsentToAdd = findH3Text(/^Special Consent Required to Add$/i);
  const specialConsentToDrop = findH3Text(/^Special Consent Required to Drop$/i);

  // Cross-listed courses — store course codes (e.g. "AFM127"), not kualiIds
  const crossListedWith: string[] = [];
  const crossListedEl = findH3Content(/^Cross-Listed/i);
  if (crossListedEl) {
    const links = crossListedEl.querySelectorAll(COURSE_LINK_SELECTOR);
    for (const link of Array.from(links)) {
      const courseCode = link.textContent?.trim().replace(/\s+/g, '') || '';
      if (courseCode) crossListedWith.push(courseCode);
    }
  }

  return {
    kualiId,
    code,
    subjectCode,
    number,
    name,
    description,
    units: isNaN(units) ? 0.5 : units,
    antiRequisiteText,
    specialCourseGrading,
    specialConsentToAdd,
    specialConsentToDrop,
    crossListedWith,
    prerequisiteTree,
    corequisiteTree,
  };
}

// ─── Degree Page Parser ─────────────────────────────────────────────────────

/** Infer CredentialCategory from the degree name (fallback when API data unavailable) */
export function inferCredentialCategory(name: string): CredentialCategory {
  const lower = name.toLowerCase();
  if (lower.includes('diploma')) return 'DIPLOMA';
  if (lower.includes('certificate')) return 'CERTIFICATE';
  if (lower.includes('degree requirements')) return 'DEGREE_REQUIREMENTS';
  if (lower.includes('minor')) return 'MINOR';
  if (lower.includes('joint honours')) return 'JOINT_HONOURS';
  if (lower.includes('double degree')) return 'DOUBLE_DEGREE';
  if (lower.includes('option')) return 'OPTION';
  if (lower.includes('specialization')) return 'SPECIALIZATION';
  if (lower.includes('general')) return 'GENERAL';
  if (lower.includes('honours')) return 'HONOURS';
  return 'HONOURS'; // default
}

/** Map Kuali API undergraduateCredentialType.name + degree name to CredentialCategory.
 *  The API gives us the broad type (Major, Minor, Specialization, etc.),
 *  but for "Major" we need to further distinguish Honours/Joint/General/Double from the name. */
export function mapKualiCredentialType(apiTypeName: string, degreeName: string): CredentialCategory {
  switch (apiTypeName) {
    case 'Minor': return 'MINOR';
    case 'Specialization': return 'SPECIALIZATION';
    case 'Option': return 'OPTION';
    case 'Diploma': return 'DIPLOMA';
    case 'Certificate': return 'CERTIFICATE';
    case 'Degree Requirements': return 'DEGREE_REQUIREMENTS';
    case 'Major': {
      // Distinguish between Honours, Joint Honours, General, Double Degree
      const lower = degreeName.toLowerCase();
      if (lower.includes('double degree')) return 'DOUBLE_DEGREE';
      if (lower.includes('joint honours')) return 'JOINT_HONOURS';
      if (lower.includes('general')) return 'GENERAL';
      return 'HONOURS';
    }
    default:
      return inferCredentialCategory(degreeName);
  }
}

/** Infer credentialType from the degree name (e.g. "Bachelor of Computer Science") */
function inferCredentialType(name: string): string {
  // Common patterns: "X (Bachelor of Y - Honours)"
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1].trim();
  return name;
}

/**
 * Parse the full HTML of a degree detail page into a DegreeData object.
 */
export function parseDegreePageHtml(
  html: string,
  kualiId: string,
  programGroupName: string,
  programGroupKualiId: string,
  credentialCategoryOverride?: CredentialCategory,
): DegreeData {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Name from <title> or Kuali SPA <h2> (h1 is the CMS page header)
  const titleEl = doc.querySelector('title') || doc.querySelector('#__KUALI_TLP h2');
  const name = titleEl?.textContent?.trim() || programGroupName;

  // Extract metadata from noBreak divs
  const metadata = extractDegreeMetadata(doc);

  // Extract requirement sections
  const sections = extractRequirementSections(doc);

  return {
    kualiId,
    programGroupName,
    programGroupKualiId,
    name,
    credentialType: inferCredentialType(name),
    credentialCategory: credentialCategoryOverride || inferCredentialCategory(name),
    systemsOfStudy: metadata['Systems of Study'] || null,
    declarationRequirements: metadata['Declaration Requirements'] || null,
    minimumAverages: metadata['Minimum Average(s) Required'] || metadata['Minimum Average'] || metadata['Minimum Averages'] || null,
    graduationRequirements: metadata['Graduation Requirements'] || null,
    additionalConstraints: metadata['Additional Constraints'] || null,
    studentAudience: metadata['Student Audience'] || null,
    notes: metadata['Notes'] || null,
    offeredBy: metadata['Offered by Faculty(ies)'] || metadata['Offered by Faculty'] || metadata['Offered by'] || null,
    sections,
  };
}

/** Extract metadata from [class*="noBreak"] divs */
function extractDegreeMetadata(doc: Document): Record<string, string> {
  const result: Record<string, string> = {};
  const noBreakDivs = doc.querySelectorAll('[class*="noBreak"]');

  for (const div of Array.from(noBreakDivs)) {
    const h3 = div.querySelector('h3');
    if (!h3) continue;
    const label = h3.textContent?.trim() || '';
    // Get text content excluding the H3 itself
    // Values like "Co-operative" and "Regular" are in separate child <div>s
    // whose textContent concatenates without separator — iterate children instead
    const clone = div.cloneNode(true) as Element;
    const h3Clone = clone.querySelector('h3');
    if (h3Clone) h3Clone.remove();

    // Try to find leaf divs with text content and join with newlines
    const leafDivs = clone.querySelectorAll('div');
    const leafTexts: string[] = [];
    for (const ld of Array.from(leafDivs)) {
      // Only use divs with no child divs (leaf divs)
      if (ld.querySelector('div')) continue;
      const text = ld.textContent?.trim();
      if (text) leafTexts.push(text);
    }

    const value = leafTexts.length > 0 ? leafTexts.join('\n') : (clone.textContent?.trim() || '');
    if (label && value) {
      result[label] = value;
    }
  }

  return result;
}

/** Count the section nesting depth of an element */
function getSectionDepth(el: Element): number {
  let depth = 0;
  let current = el.parentElement;
  while (current) {
    if (current.tagName === 'SECTION') depth++;
    current = current.parentElement;
  }
  return depth;
}

/** Check if a panel is a container-only (has child sections but no direct LIs) */
function isContainerOnly(section: Element): boolean {
  const childSections = section.querySelectorAll(':scope > div > div > section, :scope > div > section, :scope section');
  if (childSections.length === 0) return false;

  // Count LIs not inside child sections
  const allLIs = section.querySelectorAll('li');
  let childSectionLIs = 0;
  for (const cs of Array.from(childSections)) {
    childSectionLIs += cs.querySelectorAll('li').length;
  }
  const directLIs = allLIs.length - childSectionLIs;
  return directLIs === 0;
}

/** Find the parent noBreak container's H3 label for a section element.
 *  Kuali wraps requirement panels inside noBreak divs with an H3 label. */
function getParentNoBreakLabel(el: Element): string | null {
  let current = el.parentElement;
  while (current) {
    const cls = current.getAttribute('class') || '';
    if (cls.includes('noBreak')) {
      const h3 = current.querySelector('h3');
      return h3?.textContent?.trim() || null;
    }
    current = current.parentElement;
  }
  return null;
}

/** Extract requirement sections from degree page panels */
function extractRequirementSections(doc: Document): SectionData[] {
  const sections: SectionData[] = [];
  let displayOrder = 0;

  // Find all panel headers
  const headers = doc.querySelectorAll('[class*="itemHeaderH2"]');
  const headerArr = Array.from(headers);
  if (headerArr.length === 0) return sections;

  // Calculate base depth — the Kuali SPA may wrap content in parent <section> elements,
  // so we use relative depth instead of absolute depth
  const baseDepth = Math.min(...headerArr.map(h => getSectionDepth(h)));

  // Collect raw sections first, then disambiguate duplicate labels
  const rawSections: { label: string; parentContext: string | null; tree: RequirementNode | null }[] = [];

  for (const header of headerArr) {
    const label = header.textContent?.trim() || '';

    // Skip metadata panels
    if (SKIP_PANEL_LABELS.some(p => p.test(label))) continue;

    const relativeDepth = getSectionDepth(header) - baseDepth;
    // We only handle top-level (0) and one level of nesting (1)
    if (relativeDepth > 1) continue;

    // Find the parent section element
    const section = header.closest('section');
    if (!section) continue;

    // Check if this section has any LI elements at all
    const hasLIs = section.querySelector('li') !== null;
    if (!hasLIs) continue;

    // Get parent noBreak context for disambiguation
    const parentContext = getParentNoBreakLabel(section);

    if (relativeDepth === 0) {
      const hasChildSections = section.querySelector(':scope section [class*="itemHeaderH2"]') !== null;

      if (hasChildSections) {
        // Has child sections — process direct content (if any) as the parent section
        if (!isContainerOnly(section)) {
          const tree = parseRequirementTreeFromSection(section);
          rawSections.push({ label, parentContext, tree });
        }
        // Also process child sections with flattened labels
        const childHeaders = section.querySelectorAll(':scope section [class*="itemHeaderH2"]');
        for (const childHeader of Array.from(childHeaders)) {
          const childLabel = childHeader.textContent?.trim() || '';
          if (SKIP_PANEL_LABELS.some(p => p.test(childLabel))) continue;

          const childSection = childHeader.closest('section');
          if (!childSection || !childSection.querySelector('li')) continue;

          const flatLabel = `${label} - ${childLabel}`;
          const childParentContext = getParentNoBreakLabel(childSection);
          const tree = parseRequirementTreeFromSection(childSection);
          rawSections.push({ label: flatLabel, parentContext: childParentContext, tree });
        }
      } else {
        // Simple panel with direct content only
        const tree = parseRequirementTreeFromSection(section);
        rawSections.push({ label, parentContext, tree });
      }
    }
    // relativeDepth === 1 panels are handled by the parent's child section logic above
  }

  // Disambiguate duplicate labels using parent noBreak context
  const labelCounts = new Map<string, number>();
  for (const s of rawSections) {
    labelCounts.set(s.label, (labelCounts.get(s.label) || 0) + 1);
  }

  for (const s of rawSections) {
    let finalLabel = s.label;
    if ((labelCounts.get(s.label) || 0) > 1 && s.parentContext && s.parentContext !== s.label) {
      finalLabel = `${s.parentContext} - ${s.label}`;
    }
    sections.push({ label: finalLabel, displayOrder: displayOrder++, requirementTree: s.tree });
  }

  return sections;
}

/** Parse requirement tree from a section element's UL content */
function parseRequirementTreeFromSection(section: Element): RequirementNode | null {
  // Find the UL that contains the actual requirement list items
  // Exclude ULs that are inside nested sections
  const uls = section.querySelectorAll('ul');
  for (const ul of Array.from(uls)) {
    // Skip ULs inside nested sections (they belong to child panels)
    const parentSection = ul.closest('section');
    if (parentSection !== section) continue;

    const lis = getChildLIs(ul);
    if (lis.length > 0) {
      try {
        return parseRequirementTree(ul.outerHTML);
      } catch {
        return null;
      }
    }
  }
  return null;
}
