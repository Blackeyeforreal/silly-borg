import type { ResumeData, Role, WorkExperience, Education, CustomSection } from '../schema';

/**
 * Strips repeated and redundant labels from strings.
 * e.g. "Role: Role: Software Engineer Intern" -> "Software Engineer Intern"
 *      "Company: Role: Software Engineer Intern" -> "Software Engineer Intern"
 *      "Company: Stripe Inc." -> "Stripe Inc."
 */
export function cleanFieldPrefix(val: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  
  // Recursively remove common leaked field prefixes
  const prefixRegex = /^(?:company|role|position|title|job title|dates?|location)\s*[:\-–—]\s*/i;
  while (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }
  
  return cleaned;
}

/**
 * Extracts raw URLs from strings formatted like:
 * "Software Development Engineer 1 [Link: https://example.com/xyz]"
 * Returns clean title and the extracted URL.
 */
export function extractEmbeddedUrl(rawTitle: string): { title: string; link?: string } {
  if (!rawTitle) return { title: '' };
  
  // Pattern 1: [Link: https://...] or [https://...]
  const linkMatch = rawTitle.match(/\[(?:Link:\s*)?(https?:\/\/[^\s\]]+)\]/i);
  if (linkMatch) {
    const link = linkMatch[1];
    const cleanTitle = rawTitle.replace(linkMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    return { title: cleanTitle || 'Project Link', link };
  }

  // Pattern 2: Markdown link [Label](url)
  const mdMatch = rawTitle.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdMatch) {
    return { title: mdMatch[1].trim(), link: mdMatch[2].trim() };
  }

  // Pattern 3: trailing raw URL
  const rawUrlMatch = rawTitle.match(/(https?:\/\/[^\s]+)$/i);
  if (rawUrlMatch && rawTitle.length > rawUrlMatch[0].length + 3) {
    const link = rawUrlMatch[0];
    const cleanTitle = rawTitle.replace(link, '').replace(/[|\-–—:]\s*$/, '').trim();
    return { title: cleanTitle, link };
  }

  return { title: rawTitle.trim() };
}

/**
 * Converts long raw URLs into human-friendly semantic labels for display.
 * Keeps full URL intact for hyperlink navigation.
 */
export function getSemanticLinkLabel(url: string, fallbackLabel = 'Link'): string {
  if (!url) return fallbackLabel;
  const lower = url.toLowerCase();
  
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('github.com')) return 'GitHub';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'Twitter';
  if (lower.includes('leetcode.com')) return 'LeetCode';
  if (lower.includes('vercel.app') || lower.includes('netlify.app') || lower.includes('demo') || lower.includes('render.com')) {
    return 'Live Demo';
  }
  
  // Extract clean domain name: e.g. "https://alexchen.dev/portfolio" -> "alexchen.dev"
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host.length <= 25) return host;
  } catch {
    // Ignore URL parse failures
  }

  return fallbackLabel;
}

/**
 * Returns formatted semantic link object with human-friendly label and valid navigation URL.
 */
export function formatSemanticLink(url: string, fallbackLabel = 'Link'): { label: string; url: string } {
  if (!url) return { label: fallbackLabel, url: '' };
  const label = getSemanticLinkLabel(url, fallbackLabel);
  const cleanUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')
    ? url
    : `https://${url}`;
  return { label, url: cleanUrl };
}

/**
 * Standardizes date range strings:
 * e.g. "August 2023 - Present" -> "August 2023 – Present"
 * e.g. "2022 to 2023" -> "2022 – 2023"
 */
export function normalizeDateRange(rawDates: string): string {
  if (!rawDates) return '';
  let dates = cleanFieldPrefix(rawDates);
  
  // Replace hyphens/words with clean en-dash
  dates = dates
    .replace(/\s*(?:–|-|—|to)\s*/gi, ' – ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Capitalize month names properly
  dates = dates.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });
  
  // Standardize "present" / "current"
  dates = dates.replace(/\b(present|current|now|ongoing|today)\b/gi, 'Present');
  
  return dates;
}

/**
 * Detects and removes duplicated bullet sentences or concatenated duplicate variants.
 * e.g. "Worked with Java 8, Spring Boot. Worked with Java 8, Spring Boot." -> "Worked with Java 8, Spring Boot."
 * e.g. "Lead: Built X with Java 8. Lead: Built X with Java 17, Go." -> "Lead: Built X with Java 17, Go."
 */
export function deduplicateBulletText(rawBullet: string): string {
  if (!rawBullet) return '';
  let bullet = rawBullet.trim();

  // Remove repeated prefixes like "Role: Key Results:"
  bullet = bullet.replace(/^(?:role|company|key results|achievement)\s*:\s*(?:(?:role|company|key results|achievement)\s*:\s*)+/i, '');

  // 1. Remove exact duplicate sentences (e.g. "Sentence A. Sentence A.")
  const sentences = bullet.split(/(?<=\.)\s+/);
  if (sentences.length >= 2) {
    const uniqueSentences: string[] = [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      const normalizedS = trimmed.replace(/\.+$/, '').toLowerCase();
      const isDuplicate = uniqueSentences.some(existing => existing.replace(/\.+$/, '').toLowerCase() === normalizedS);
      if (!isDuplicate) {
        uniqueSentences.push(trimmed);
      }
    }
    
    // Check if any two sentences share the exact same lead label/prefix
    if (uniqueSentences.length >= 2) {
      const p1 = uniqueSentences[0].match(/^([A-Za-z0-9 &/\-]+:\s*)/);
      const p2 = uniqueSentences[1].match(/^([A-Za-z0-9 &/\-]+:\s*)/);
      if (p1 && p2 && p1[1].toLowerCase() === p2[1].toLowerCase()) {
        bullet = uniqueSentences[0].length >= uniqueSentences[1].length ? uniqueSentences[0] : uniqueSentences[1];
      } else {
        bullet = uniqueSentences.join(' ');
      }
    } else {
      bullet = uniqueSentences.join(' ');
    }
  }

  // Remove trailing orphan punctuation / extra spaces
  bullet = bullet.replace(/\s+([.,;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  return bullet;
}

/**
 * Comprehensive normalizer function that runs on all ResumeData
 * before rendering in preview, PDF export, or DOCX export.
 */
export function normalizeResumeData(data: ResumeData): ResumeData {
  if (!data) return data;
  const normalized: ResumeData = JSON.parse(JSON.stringify(data));

  // 1. Normalize Personal Info
  if (normalized.personal_info) {
    normalized.personal_info.full_name = cleanFieldPrefix(normalized.personal_info.full_name || '');
    
    const contact = normalized.personal_info.contact;
    if (contact) {
      contact.email = contact.email?.trim() || '';
      contact.phone = contact.phone?.trim() || '';
      contact.location = cleanFieldPrefix(contact.location || '');
      contact.links = contact.links?.trim() || '';
      
      // Extract links if raw URLs are embedded in links string
      if (contact.portfolio !== undefined) contact.portfolio = contact.portfolio?.trim() || undefined;
      if (contact.linkedin !== undefined) contact.linkedin = contact.linkedin?.trim() || undefined;
      if (contact.github !== undefined) contact.github = contact.github?.trim() || undefined;
    }
  }

  // 2. Normalize Work Experience
  if (normalized.work_experience && Array.isArray(normalized.work_experience)) {
    const cleanedWork: WorkExperience[] = [];
    
    for (let cIdx = 0; cIdx < normalized.work_experience.length; cIdx++) {
      const exp = normalized.work_experience[cIdx];
      let companyName = cleanFieldPrefix(exp.company || '');
      let companyDates = normalizeDateRange(exp.dates || '');

      // Check for misparsed fields masquerading as company names
      const isMisparsedKeyResults = /^key results\s*[:\-–]/i.test(companyName);
      const isMisparsedTech = /^technologies(?:[\/&]skills)?(?:\s+used)?\s*[:\-–]/i.test(companyName);

      if ((isMisparsedKeyResults || isMisparsedTech) && cleanedWork.length > 0) {
        // Attach to the last valid company's last role
        const prevCompany = cleanedWork[cleanedWork.length - 1];
        const lastRole = prevCompany.roles[prevCompany.roles.length - 1];
        if (lastRole) {
          if (isMisparsedKeyResults) {
            const items = companyName.replace(/^key results\s*[:\-–]\s*/i, '').split(';').map(s => s.trim()).filter(Boolean);
            lastRole.key_results = Array.from(new Set([...(lastRole.key_results || []), ...items]));
          } else {
            const items = companyName.replace(/^technologies(?:[\/&]skills)?(?:\s+used)?\s*[:\-–]\s*/i, '').split(',').map(s => s.trim()).filter(Boolean);
            lastRole.technologies_used = Array.from(new Set([...(lastRole.technologies_used || []), ...items]));
          }
        }
        continue;
      }

      // Extract URL from company name if embedded
      const extractedCompany = extractEmbeddedUrl(companyName);
      companyName = extractedCompany.title;

      // Strip redundant trailing date parentheses from company name if present: e.g. "Company (Feb 2023 – July 2023)"
      companyName = companyName.replace(/\s*\((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[^\)]*)\)\s*$/i, '').trim();

      const cleanedRoles: Role[] = [];
      const rolesList = exp.roles || [];

      for (let rIdx = 0; rIdx < rolesList.length; rIdx++) {
        const role = rolesList[rIdx];
        let roleTitle = cleanFieldPrefix(role.title || '');
        let roleDates = normalizeDateRange(role.dates || '');
        let roleLocation = cleanFieldPrefix(role.location || '');
        let roleLink = role.link || extractedCompany.link;

        // Check for misparsed field in role title
        if (/^technologies(?:[\/&]skills)?(?:\s+used)?\s*[:\-–]/i.test(roleTitle)) {
          const items = roleTitle.replace(/^technologies(?:[\/&]skills)?(?:\s+used)?\s*[:\-–]\s*/i, '').split(',').map(s => s.trim()).filter(Boolean);
          if (cleanedRoles.length > 0) {
            const prevRole = cleanedRoles[cleanedRoles.length - 1];
            prevRole.technologies_used = Array.from(new Set([...(prevRole.technologies_used || []), ...items]));
          }
          continue;
        }

        // Extract embedded link from role title if present
        const extractedRole = extractEmbeddedUrl(roleTitle);
        roleTitle = extractedRole.title;
        if (extractedRole.link && !roleLink) {
          roleLink = extractedRole.link;
        }

        // CRITICAL: Prevent duplicate company and role representation!
        // If company and role.title are identical (e.g. "Software Development Engineer 1"),
        // the company name was likely defaulted to the role title.
        if (companyName.toLowerCase() === roleTitle.toLowerCase()) {
          // If we have a link with a domain or brand hint, or if it's a generic title:
          if (roleLink && roleLink.includes('icici')) {
            companyName = 'ICICI Bank';
          } else if (roleLink && roleLink.includes('google')) {
            companyName = 'Google';
          } else if (roleLink && roleLink.includes('amazon')) {
            companyName = 'Amazon';
          } else if (roleLink && roleLink.includes('microsoft')) {
            companyName = 'Microsoft';
          } else {
            // Keep roleTitle, and if companyName has no other identifier, give company a distinct heading
            companyName = roleTitle;
            roleTitle = ''; // Prevents rendering the exact same line twice!
          }
        }

        // Deduplicate and clean description bullets
        const seenBullets = new Set<string>();
        const cleanedBullets: string[] = [];
        
        for (const rawDesc of role.description || []) {
          if (!rawDesc || !rawDesc.trim()) continue;
          const cleaned = deduplicateBulletText(rawDesc);
          if (cleaned && !seenBullets.has(cleaned.toLowerCase())) {
            seenBullets.add(cleaned.toLowerCase());
            cleanedBullets.push(cleaned);
          }
        }

        // Clean key results & technologies
        const cleanedKeyResults = (role.key_results || [])
          .map(cleanFieldPrefix)
          .filter(Boolean);
        
        const cleanedTech = (role.technologies_used || [])
          .map(cleanFieldPrefix)
          .filter(Boolean);

        cleanedRoles.push({
          title: roleTitle || companyName, // Ensure non-empty fallback
          dates: roleDates || companyDates || undefined,
          location: roleLocation || '',
          link: roleLink || undefined,
          description: cleanedBullets,
          key_results: cleanedKeyResults.length > 0 ? Array.from(new Set(cleanedKeyResults)) : undefined,
          technologies_used: cleanedTech.length > 0 ? Array.from(new Set(cleanedTech)) : undefined
        });
      }

      if (cleanedRoles.length > 0 || companyName) {
        cleanedWork.push({
          company: companyName || (cleanedRoles[0]?.title ?? 'Professional Experience'),
          dates: companyDates || (cleanedRoles[0]?.dates ?? ''),
          roles: cleanedRoles.length > 0 ? cleanedRoles : [
            {
              title: companyName,
              location: '',
              dates: companyDates || '',
              description: []
            }
          ]
        });
      }
    }

    normalized.work_experience = cleanedWork;
  }

  // 3. Normalize Education
  if (normalized.education && Array.isArray(normalized.education)) {
    normalized.education = normalized.education.map(edu => {
      const inst = cleanFieldPrefix((edu as any).institution || edu.university || '');
      return {
        university: inst,
        graduation_date: normalizeDateRange(edu.graduation_date || ''),
        degree: cleanFieldPrefix(edu.degree || ''),
        major: cleanFieldPrefix(edu.major || ''),
        location: cleanFieldPrefix(edu.location || ''),
        honors_and_awards: edu.honors_and_awards?.map(cleanFieldPrefix).filter(Boolean),
        activities: edu.activities?.map(cleanFieldPrefix).filter(Boolean)
      };
    }).filter(edu => Boolean(edu.university || edu.degree));
  }

  // 4. Normalize Skills and Interests
  if (normalized.skills_and_interests) {
    const s = normalized.skills_and_interests;
    const cleanList = (arr?: string[]) => {
      if (!arr || !Array.isArray(arr)) return [];
      const set = new Set<string>();
      for (const item of arr) {
        const cleaned = cleanFieldPrefix(item);
        if (cleaned && cleaned.length > 1) {
          set.add(cleaned);
        }
      }
      return Array.from(set);
    };

    s.certifications = cleanList(s.certifications);
    s.technologies = cleanList(s.technologies);
    s.skills = cleanList(s.skills);
    s.interests = cleanList(s.interests);
  }

  // 5. Normalize Custom Sections (Projects, Publications, Leadership)
  if (normalized.custom_sections && Array.isArray(normalized.custom_sections)) {
    normalized.custom_sections = normalized.custom_sections.map(sec => ({
      id: sec.id,
      section_title: cleanFieldPrefix(sec.section_title || 'FEATURED PROJECTS').toUpperCase(),
      items: (sec.items || []).map(item => {
        let title = cleanFieldPrefix(item.title || '');
        let link = item.link;

        const extracted = extractEmbeddedUrl(title);
        title = extracted.title;
        if (extracted.link && !link) {
          link = extracted.link;
        }

        const seenB = new Set<string>();
        const cleanedDesc: string[] = [];
        const itemDesc: any = item.description;
        const rawDesc: string[] = Array.isArray(itemDesc)
          ? itemDesc
          : typeof itemDesc === 'string' && itemDesc.trim()
          ? [itemDesc.trim()]
          : [];
        for (const b of rawDesc) {
          const cb = deduplicateBulletText(b);
          if (cb && !seenB.has(cb.toLowerCase())) {
            seenB.add(cb.toLowerCase());
            cleanedDesc.push(cb);
          }
        }

        return {
          title,
          subtitle: cleanFieldPrefix(item.subtitle || ''),
          dates: normalizeDateRange(item.dates || ''),
          location: cleanFieldPrefix(item.location || ''),
          link: link?.trim(),
          technologies: item.technologies?.map(cleanFieldPrefix).filter(Boolean),
          description: cleanedDesc
        };
      }).filter(item => Boolean(item.title))
    })).filter(sec => sec.items.length > 0);
  }

  return normalized;
}

/**
 * Extracts a clean job role title from a job description or falls back to the resume's primary role.
 * Formats safe alphanumeric filename string, e.g. "Software_Engineer".
 */
export function extractTargetRole(jobDescription: string, fallbackRole = 'Software_Engineer'): string {
  if (!jobDescription || !jobDescription.trim()) {
    return fallbackRole.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  // 1. Direct role prefix patterns: "Job Title: Software Engineer", "Position: Senior Product Designer"
  const prefixMatch = jobDescription.match(/(?:job\s+title|role|position|title)\s*[:\-–—]\s*([A-Za-z0-9\s/+#.-]{3,45})/i);
  if (prefixMatch && prefixMatch[1]) {
    const rawRole = prefixMatch[1].trim().split(/\r?\n/)[0].trim();
    if (rawRole.length >= 3 && !/^(the|a|an|about|we|our|responsibilities|requirements)$/i.test(rawRole)) {
      return rawRole.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
  }

  // 2. Exact keyword scan for common industry roles in the text (e.g. "Senior Software Engineer")
  const rolePatterns = [
    'Staff Software Engineer',
    'Principal Software Engineer',
    'Senior Software Engineer',
    'Full Stack Software Engineer',
    'Full Stack Engineer',
    'Full Stack Developer',
    'Frontend Engineer',
    'Frontend Developer',
    'Backend Engineer',
    'Backend Developer',
    'Software Development Engineer',
    'Software Engineer',
    'Mobile Engineer',
    'iOS Developer',
    'Android Developer',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Cloud Architect',
    'Systems Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'AI Engineer',
    'Data Engineer',
    'Product Manager',
    'Technical Product Manager',
    'Project Manager',
    'Engineering Manager',
    'QA Engineer',
    'Security Engineer',
    'UI/UX Designer',
    'Product Designer'
  ];

  for (const pat of rolePatterns) {
    const regex = new RegExp(`\\b${pat.replace('/', '[/\\s]')}\\b`, 'i');
    if (regex.test(jobDescription)) {
      return pat.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
  }

  // 3. First line check (often the job post heading: "Frontend Engineer - Remote")
  const lines = jobDescription.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0].split(/[–—\-|]/)[0].trim();
    if (
      firstLine.length >= 4 &&
      firstLine.length <= 40 &&
      /(?:engineer|developer|architect|designer|manager|lead|specialist|analyst|scientist|consultant|director|administrator|coordinator|intern|fellow)/i.test(firstLine)
    ) {
      return firstLine.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
  }

  return fallbackRole.replace(/[^a-zA-Z0-9_-]/g, '_');
}


