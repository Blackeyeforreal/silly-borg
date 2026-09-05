import nlp from 'compromise';
import type { ResumeData } from '@/lib/schema';

/**
 * High-speed local NLP-driven Resume Parser powered by compromise.
 * 
 * Features:
 * - 100% Local / Zero API keys / Zero external network latency (< 30ms execution)
 * - Named Entity Recognition (NER) for People, Places, and Organizations
 * - POS & Action verb chunking for achievement bullets
 * - Line unwrapping & continuation stitching for PDF streams
 * - Multi-format date extraction (months, seasons, numeric MM/YYYY, ongoing)
 * - High-recall link & URL extractor (GitHub, LinkedIn, Portfolios, Live Demos)
 */

// Universal date range matcher supporting months, seasons, MM/YYYY, short years, and ongoing terms
const MONTH_NAMES = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December';
const SEASONS = 'Spring|Summer|Fall|Autumn|Winter';
const DATE_PARTS = `\\d{1,2}[\\/\\.-]\\d{2,4}|(?:(?:${MONTH_NAMES}|${SEASONS})\\.?\\s+)?(?:19|20)?\\d{2}|(?:(?:${MONTH_NAMES}|${SEASONS})\\.?\\s+)'?\\d{2}`;
const PRESENT_WORDS = 'Present|Current|Now|Ongoing|Till Date|Today';
const dateRangeRegex = new RegExp(
  `(?:${DATE_PARTS})\\s*(?:–|-|—|to)\\s*(?:${PRESENT_WORDS}|${DATE_PARTS})|(?:(?:${MONTH_NAMES}|${SEASONS})\\.?\\s+)?(?:19|20)\\d{2}`,
  'i'
);

const isBulletLine = (str: string): boolean => {
  return /^[•\-\*o\+]\s+/.test(str) || /^\d+\.\s+/.test(str) || /^[•\-\*o\+]/.test(str);
};

const cleanBulletText = (str: string): string => {
  return str.replace(/^[•\-\*o\+]\s*/, '').replace(/^\d+\.\s*/, '').trim();
};

export function parseResumeWithNLP(rawText: string, fallback?: ResumeData): ResumeData {
  const base: ResumeData = fallback ? JSON.parse(JSON.stringify(fallback)) : {
    personal_info: {
      full_name: 'Applicant',
      contact: {
        email: '',
        phone: '',
        location: '',
        links: '',
        portfolio: '',
        linkedin: '',
        github: ''
      }
    },
    work_experience: [],
    education: [],
    skills_and_interests: { skills: [], technologies: [] },
    custom_sections: []
  };

  if (!rawText || !rawText.trim()) return base;

  const defaultContact = { email: '', phone: '', location: '', links: '', portfolio: '', linkedin: '', github: '' };
  if (!base.personal_info) base.personal_info = { full_name: 'Applicant', contact: { ...defaultContact } };
  if (!base.personal_info.contact) base.personal_info.contact = { ...defaultContact };

  // 1. CONTACT DETAILS & SOCIAL / PORTFOLIO URLS
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    base.personal_info.contact.email = emailMatch[0];
  }

  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,4}[-.\s]?\d{9,12}/);
  if (phoneMatch) {
    base.personal_info.contact.phone = phoneMatch[0].trim();
  }

  // Check for explicit portfolio label in resume (e.g. portfolio: alex.dev, website: https://...)
  const explicitPortfolio = rawText.match(/(?:portfolio|website|site|web|blog)\s*[:\-–]\s*([^\s,;"'|<>]+)/i);
  if (explicitPortfolio && explicitPortfolio[1]) {
    const rawP = explicitPortfolio[1].trim().replace(/[.,;)]+$/, '');
    base.personal_info.contact.portfolio = rawP.startsWith('http') ? rawP : `https://${rawP.replace(/^www\./, '')}`;
  }

  // Header lines for candidate contact URLs
  const headerLines = rawText.split(/\r?\n/).slice(0, 15).join('\n');
  const headerUrlMatches = headerLines.match(/(?:https?:\/\/|www\.)[^\s,;"'|<>]+|(?:linkedin\.com\/in\/|github\.com\/)[^\s,;"'|<>]+/gi) || [];
  for (const rawUrl of headerUrlMatches) {
    const cleanUrl = rawUrl.replace(/[.,;)]+$/, '');
    const url = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl.replace(/^www\./, '')}`;
    if (url.toLowerCase().includes('linkedin.com')) {
      if (!base.personal_info.contact.linkedin) base.personal_info.contact.linkedin = url;
    } else if (url.toLowerCase().includes('github.com')) {
      if (!base.personal_info.contact.github) base.personal_info.contact.github = url;
    } else if (!base.personal_info.contact.portfolio) {
      base.personal_info.contact.portfolio = url;
    }
  }

  // Global search for LinkedIn and GitHub if not found in header
  if (!base.personal_info.contact.linkedin) {
    const liMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s,;"'|<>]+/i);
    if (liMatch) {
      const u = liMatch[0].replace(/[.,;)]+$/, '');
      base.personal_info.contact.linkedin = u.startsWith('http') ? u : `https://${u}`;
    }
  }
  if (!base.personal_info.contact.github) {
    const ghMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,;"'|<>]+/i);
    if (ghMatch) {
      const u = ghMatch[0].replace(/[.,;)]+$/, '');
      base.personal_info.contact.github = u.startsWith('http') ? u : `https://${u}`;
    }
  }

  // 2. NORMALIZE & UNWRAP UNICODE BULLETS
  const normalizedRaw = rawText
    .replace(/[\u2022\u2023\u25cf\u25aa\u25ab\u25cb\u25c6\u25e6\u2219\u00b7\u25a0\u25a1\u25fe\u25fd\u25fc\u25fb\u2043\u203a\u00bb\u25ba]/g, '•')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const rawLines = normalizedRaw.split('\n').map(l => l.trim()).filter(Boolean);

  // 3. CANDIDATE NAME EXTRACTION (NLP + Positional)
  const headerBlock = rawLines.slice(0, 6).join('\n');
  const headerDoc = nlp(headerBlock);
  const nlpPeople = headerDoc.people().out('array');

  let detectedName = '';
  if (nlpPeople.length > 0 && nlpPeople[0].length >= 3 && !nlpPeople[0].includes('@')) {
    detectedName = nlpPeople[0];
  }

  // Positional fallback / refinement: First non-contact, non-header line
  for (const line of rawLines.slice(0, 6)) {
    if (
      !line.includes('@') &&
      !line.toLowerCase().includes('http') &&
      !line.toLowerCase().includes('www.') &&
      !line.toLowerCase().includes('linkedin') &&
      !line.toLowerCase().includes('github') &&
      line.length >= 3 &&
      line.length <= 40 &&
      !/^(resume|curriculum|cv|contact|profile|page\s+\d)/i.test(line) &&
      !/^(experience|education|skills|projects|summary)/i.test(line)
    ) {
      const clean = line.replace(/^(full\s+name|name):\s*/i, '').trim();
      const firstSegment = clean.includes('|') ? clean.split('|')[0].trim() : clean;
      if (firstSegment) {
        detectedName = firstSegment;
        break;
      }
    }
  }

  if (detectedName) {
    base.personal_info.full_name = detectedName;
  }

  // 4. CANDIDATE LOCATION EXTRACTION (NLP Places + Regex)
  const nlpPlaces = headerDoc.places().out('array');
  if (nlpPlaces.length > 0) {
    base.personal_info.contact.location = nlpPlaces[0];
  } else {
    for (const line of rawLines.slice(0, 8)) {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        for (const p of parts) {
          if (/(?:[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|Remote|USA|United States|India|Canada|UK|London|San Francisco|New York|Seattle|Austin)/i.test(p) && !p.includes('@') && !p.includes('http')) {
            base.personal_info.contact.location = p;
            break;
          }
        }
      }
    }
  }

  // 5. FUZZY SECTION CLASSIFICATION
  type SectionType = 'experience' | 'education' | 'projects' | 'skills' | 'certifications' | 'unknown';
  interface SectionBlock {
    type: SectionType;
    title: string;
    lines: string[];
  }

  const isSectionHeader = (line: string): { isHead: boolean; type: SectionType; title: string } => {
    const clean = line.replace(/^[#*•·\-]+\s*/, '').replace(/[:\-_]+$/, '').trim();
    if (clean.length > 55 || clean.length < 3) return { isHead: false, type: 'unknown', title: clean };

    // If line has dates, it is content (job, school, or project), NEVER a section header
    if (dateRangeRegex.test(clean)) return { isHead: false, type: 'unknown', title: clean };

    // If line contains @, it's contact info, not a section header
    if (clean.includes('@') || clean.includes('http')) {
      return { isHead: false, type: 'unknown', title: clean };
    }

    // ALL-CAPS short line is very likely a section header - detect first
    const isAllCaps = clean === clean.toUpperCase() && /[A-Z]/.test(clean) && clean.length <= 45;

    // Experience patterns
    if (/(?:work|professional|career|relevant|selected|technical|industry)?\s*(?:experience|history|employment|background|positions|engagements)/i.test(clean)) {
      return { isHead: true, type: 'experience', title: clean };
    }
    // Education patterns
    if (/(?:education|academic|qualifications|degrees?|educational|academics?|studies)(?:\s|$)/i.test(clean) && !/^(?:university\s+of|institute\s+of)/i.test(clean)) {
      return { isHead: true, type: 'education', title: clean };
    }
    // Projects patterns
    if (/(?:featured|personal|technical|key|selected|open\s*source|academic|side)?\s*(?:projects?|portfolio|applications?|hackathons?)(?:\s|$)/i.test(clean)) {
      return { isHead: true, type: 'projects', title: clean };
    }
    // Skills patterns - broadened significantly
    if (/(?:technical|core|key|professional|software|programming)?\s*(?:skills|competencies|technologies|tools|proficiencies|stack|expertise|technical\s+summary|toolkit)(?:\s|$)/i.test(clean)) {
      return { isHead: true, type: 'skills', title: clean };
    }
    // Languages & Frameworks combined header
    if (/^(?:languages|frameworks|libraries|databases|devops|cloud|platforms)/i.test(clean) && clean.length < 40) {
      return { isHead: true, type: 'skills', title: clean };
    }
    // Certifications patterns
    if (/(?:certifications?|licenses?|credentials?|accreditations?)/i.test(clean)) {
      return { isHead: true, type: 'certifications', title: clean };
    }
    // Summary/Objective patterns (treat as unknown but mark as header to segment)
    if (/(?:summary|objective|profile|about\s*me|professional\s+summary|career\s+summary|career\s+objective)/i.test(clean) && clean.length < 35) {
      return { isHead: true, type: 'unknown', title: clean };
    }
    // Awards/Honors/Achievements patterns
    if (/(?:awards?|honors?|achievements?|accomplishments?|recognition)/i.test(clean) && clean.length < 35) {
      return { isHead: true, type: 'unknown', title: clean };
    }
    // Volunteer/Leadership/Extracurricular patterns
    if (/(?:volunteer|leadership|extracurricular|activities|involvement|community)/i.test(clean) && clean.length < 35) {
      return { isHead: true, type: 'unknown', title: clean };
    }
    // Publications/Research patterns
    if (/(?:publications?|research|papers?|presentations?)/i.test(clean) && clean.length < 35) {
      return { isHead: true, type: 'unknown', title: clean };
    }

    // ALL-CAPS fallback: if we haven't matched any pattern but it's all caps, short, and doesn't look like content
    if (isAllCaps && !clean.includes(',') && !clean.includes('|') && clean.split(/\s+/).length <= 5) {
      // Could be an unrecognized section - mark as unknown header to at least segment properly
      return { isHead: true, type: 'unknown', title: clean };
    }

    return { isHead: false, type: 'unknown', title: clean };
  };

  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock = { type: 'unknown', title: 'HEADER', lines: [] };

  for (const line of rawLines) {
    const headCheck = isSectionHeader(line);
    if (headCheck.isHead) {
      sections.push(currentSection);
      currentSection = { type: headCheck.type, title: headCheck.title, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  sections.push(currentSection);

  // Helper: Stitch multiline bullets
  const stitchBullets = (rawSectionLines: string[]): string[] => {
    const result: string[] = [];
    for (let i = 0; i < rawSectionLines.length; i++) {
      const l = rawSectionLines[i];
      if (isBulletLine(l)) {
        result.push(l);
      } else if (result.length > 0 && isBulletLine(result[result.length - 1])) {
        const prev = result[result.length - 1].trim();
        const prevEndsWithPunct = /[.!?;:]$/.test(prev);
        const nextLine = rawSectionLines[i + 1] || '';
        const isUrlLine = /(?:https?:\/\/|www\.|github\.com)/i.test(l);
        const isNextUrlLine = /(?:https?:\/\/|www\.|github\.com)/i.test(nextLine);

        const startsWithLower = /^[a-z0-9$%]/.test(l);
        const isPotentialContinuation = !prevEndsWithPunct || startsWithLower;

        if (
          isPotentialContinuation &&
          !isUrlLine &&
          !isNextUrlLine &&
          !dateRangeRegex.test(l) &&
          !l.includes('|') &&
          l.length > 2
        ) {
          result[result.length - 1] += ' ' + l;
        } else {
          result.push(l);
        }
      } else {
        result.push(l);
      }
    }
    return result;
  };

  // 6. PARSE WORK EXPERIENCE
  const expSections = sections.filter(s => s.type === 'experience');
  if (expSections.length > 0) {
    const workExperienceList: typeof base.work_experience = [];

    for (const expSec of expSections) {
      const stitchedLines = stitchBullets(expSec.lines);
      let currentCompany: { company: string; dates: string; roles: any[] } | null = null;
      let currentRole: any = null;

      for (let i = 0; i < stitchedLines.length; i++) {
        const line = stitchedLines[i];
        const isBullet = isBulletLine(line);
        const dateMatch = line.match(dateRangeRegex);
        const dates = dateMatch ? dateMatch[0] : '';
        const lineWithoutDates = dates
          ? line.replace(dates, '').replace(/^[|•·,\s\-–—]+|[|•·,\s\-–—]+$/g, '').trim()
          : line;

        if (isBullet) {
          const bullet = cleanBulletText(line);
          if (bullet.length > 3) {
            if (currentRole) {
              currentRole.description.push(bullet);
            } else if (currentCompany && currentCompany.roles.length > 0) {
              currentCompany.roles[currentCompany.roles.length - 1].description.push(bullet);
            } else {
              currentRole = { title: 'Software Professional', location: '', dates: dates || '2022 – Present', description: [bullet] };
              currentCompany = { company: 'Professional Experience', dates: dates || '2022 – Present', roles: [currentRole] };
              workExperienceList.push(currentCompany);
            }
          }
        } else if (dateMatch && lineWithoutDates.length === 0) {
          // Standalone date range line
          if (currentRole) {
            currentRole.dates = dates;
          }
          if (currentCompany && (!currentCompany.dates || currentCompany.dates === '2022 – Present')) {
            currentCompany.dates = dates;
          }
        } else if (lineWithoutDates.length > 0 && !line.endsWith('.')) {
          // Company / Job Title header line
          const parts = lineWithoutDates.split(/[|•·]|\s+[-–—]\s+/).map(p => p.trim()).filter(Boolean);
          const titleOrCompany = parts[0] || 'Company';
          const locationOrRole = parts[1] || '';

          // NLP Organization check
          const nlpOrgs = nlp(titleOrCompany).organizations().out('array');
          const isOrg = nlpOrgs.length > 0;

          // Look ahead to see if next line is a role title
          const nextLine = stitchedLines[i + 1] || '';
          const isNextLineRole = !isBulletLine(nextLine) &&
            nextLine.length > 0 &&
            nextLine.length < 65 &&
            !dateRangeRegex.test(nextLine) &&
            !nextLine.includes('|');

          if (!currentCompany || dateMatch || isNextLineRole || isOrg) {
            currentCompany = {
              company: titleOrCompany,
              dates: dates || '2022 – Present',
              roles: []
            };
            currentRole = {
              title: isNextLineRole ? nextLine : (locationOrRole || titleOrCompany),
              location: isNextLineRole ? locationOrRole : (parts[2] || ''),
              dates: dates,
              description: []
            };
            currentCompany.roles.push(currentRole);
            workExperienceList.push(currentCompany);
            if (isNextLineRole) i++; // consume role title line
          } else {
            currentRole = {
              title: titleOrCompany,
              location: locationOrRole,
              dates: dates || currentCompany.dates,
              description: []
            };
            currentCompany.roles.push(currentRole);
          }
        }
      }
    }

    if (workExperienceList.length > 0) {
      base.work_experience = workExperienceList;
    }
  }

  // 7. PARSE EDUCATION
  const eduSections = sections.filter(s => s.type === 'education');
  if (eduSections.length > 0) {
    const educationList: typeof base.education = [];

    for (const eduSec of eduSections) {
      const stitchedLines = stitchBullets(eduSec.lines);
      let currentEdu: typeof educationList[0] | null = null;

      for (let i = 0; i < stitchedLines.length; i++) {
        const line = stitchedLines[i];
        if (isBulletLine(line) && line.length < 15) continue;
        const dateMatch = line.match(dateRangeRegex);
        const gradDate = dateMatch ? dateMatch[0] : '';
        const cleanLine = gradDate ? line.replace(gradDate, '').replace(/[()]/g, '').trim() : line;

        const isDegreeLine = /(?:bachelor|master|phd|doctor|associate|b\.?s\.?c?|m\.?s\.?c?|b\.?a\.?|m\.?a\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|b\.?com|m\.?com|b\.?sc|m\.?sc|mba|mca|bca|degree|diploma|major|minor|bachelor'?s?|master'?s?)/i.test(line);
        const isSchoolLine = /(?:university|college|institute|school|academy|polytechnic|iit|nit|iiit|bits|vit|manipal|amity|srm)/i.test(line);
        const isHonorsLine = /(?:gpa|cgpa|cum laude|magna|summa|dean'?s|honors?|award|distinction|scholar|percentage|grade|rank|topper)/i.test(line);

        if (isHonorsLine && currentEdu) {
          if (!currentEdu.honors_and_awards) currentEdu.honors_and_awards = [];
          currentEdu.honors_and_awards.push(line.replace(/^[•\-\*o\+]\s*/, '').trim());
        } else if (isBulletLine(line) && currentEdu) {
          // Bullet points under education go to activities
          if (!currentEdu.activities) currentEdu.activities = [];
          currentEdu.activities.push(cleanBulletText(line));
        } else if (isSchoolLine || (isDegreeLine && !currentEdu)) {
          // Start a new education entry - could be school name or degree line first
          const parts = cleanLine.split(/[|•·]|\s+[-–—]\s+/).map(p => p.trim()).filter(Boolean);
          const firstPart = parts[0] || 'University';
          const secondPart = parts[1] || '';

          let school = firstPart;
          let degree = '';
          let major = '';

          if (isSchoolLine) {
            school = firstPart;
            if (secondPart) {
              if (/(?:bachelor|master|phd|doctor|b\.?s|m\.?s|b\.?a|m\.?a|b\.?tech|m\.?tech|mba|diploma)/i.test(secondPart)) {
                if (secondPart.toLowerCase().includes(' in ')) {
                  const degParts = secondPart.split(/\s+in\s+/i);
                  degree = degParts[0].trim();
                  major = degParts[1]?.replace(gradDate, '').trim() || '';
                } else {
                  degree = secondPart;
                }
              } else {
                major = secondPart;
              }
            }
          } else {
            // Degree line without school yet
            if (firstPart.toLowerCase().includes(' in ')) {
              const degParts = firstPart.split(/\s+in\s+/i);
              degree = degParts[0].trim();
              major = degParts[1]?.replace(gradDate, '').trim() || '';
              school = '';
            } else {
              degree = firstPart;
            }
          }

          currentEdu = {
            university: school.replace(/[()]/g, '').trim(),
            graduation_date: gradDate || '',
            degree: degree || '',
            major: major || '',
            location: parts[2] || '',
            honors_and_awards: [],
            activities: []
          };
          educationList.push(currentEdu);
        } else if (isDegreeLine && currentEdu) {
          // Degree line following a school entry
          let degree = '';
          let major = cleanLine;
          if (cleanLine.toLowerCase().includes(' in ')) {
            const degParts = cleanLine.split(/\s+in\s+/i);
            degree = degParts[0].trim();
            major = degParts[1]?.trim() || '';
          } else if (cleanLine.toLowerCase().includes(' of ')) {
            degree = cleanLine;
            major = '';
          } else {
            degree = cleanLine;
          }
          currentEdu.degree = degree || currentEdu.degree;
          currentEdu.major = major || currentEdu.major;
          if (gradDate && !currentEdu.graduation_date) currentEdu.graduation_date = gradDate;
        } else if (cleanLine.length > 3 && !currentEdu) {
          // Fallback: treat as school name if nothing else matched
          currentEdu = {
            university: cleanLine.replace(/[()]/g, '').trim(),
            graduation_date: gradDate || '',
            degree: '',
            major: '',
            location: '',
            honors_and_awards: [],
            activities: []
          };
          educationList.push(currentEdu);
        }
      }
    }

    if (educationList.length > 0) {
      base.education = educationList;
    }
  }

  // 8. PARSE PROJECTS & PORTFOLIO LINKS
  const projectSections = sections.filter(s => s.type === 'projects');
  if (projectSections.length > 0) {
    const projectItems: Array<{
      title: string;
      subtitle?: string;
      dates?: string;
      location?: string;
      link?: string;
      technologies?: string[];
      description: string[];
    }> = [];

    for (const pSec of projectSections) {
      const stitchedLines = stitchBullets(pSec.lines);
      let currentItem: typeof projectItems[0] | null = null;

      for (const line of stitchedLines) {
        const isBullet = isBulletLine(line);
        const lineUrl = line.match(/(?:https?:\/\/|www\.)[^\s,;"'<>]+|(?:github\.com\/)[^\s,;"'<>]+/i);

        if (isBullet) {
          const bullet = cleanBulletText(line);
          if (currentItem) {
            currentItem.description.push(bullet);
          } else {
            currentItem = { title: 'Featured Project', description: [bullet] };
            projectItems.push(currentItem);
          }
        } else if (line.trim().length > 0) {
          if (
            currentItem &&
            currentItem.description.length === 0 &&
            (lineUrl || line.includes('github.com') || line.includes('http') || line.includes('demo') || line.includes('|'))
          ) {
            if (lineUrl && !currentItem.link) {
              currentItem.link = lineUrl[0].startsWith('http') ? lineUrl[0] : `https://${lineUrl[0]}`;
            }
            continue;
          }

          const linkUrl = lineUrl ? (lineUrl[0].startsWith('http') ? lineUrl[0] : `https://${lineUrl[0]}`) : undefined;
          const cleanLine = lineUrl ? line.replace(lineUrl[0], '').replace(/[|[\]()]/g, ' ').trim() : line;
          const parts = cleanLine.split(/[|–—:]/).map(p => p.trim()).filter(Boolean);

          const title = parts[0] || 'Project';
          const subtitle = parts[1] || '';

          currentItem = {
            title,
            subtitle,
            link: linkUrl,
            description: []
          };
          projectItems.push(currentItem);
        }
      }
    }

    if (projectItems.length > 0) {
      if (!base.custom_sections) base.custom_sections = [];
      const existingProjectsSec = base.custom_sections.find(s => s.section_title.toUpperCase().includes('PROJECT'));
      if (existingProjectsSec) {
        existingProjectsSec.items = projectItems;
      } else {
        base.custom_sections.push({
          id: 'custom_section_projects',
          section_title: 'PROJECTS',
          items: projectItems
        });
      }
    }
  }

  // 9. PARSE SKILLS, TECHNOLOGIES & CERTIFICATIONS (with compromise Acronyms + Tech Vocabulary)
  const skillSections = sections.filter(s => s.type === 'skills' || s.type === 'certifications');
  if (skillSections.length > 0) {
    const allSkills: string[] = [];
    const allTech: string[] = [];
    const allCerts: string[] = [];

    for (const sSec of skillSections) {
      for (const line of sSec.lines) {
        if (sSec.type === 'certifications' || /certif/i.test(line)) {
          const certClean = line.replace(/^[•\-\*o\+]\s*/, '').replace(/^certifications?:\s*/i, '');
          allCerts.push(...certClean.split(/[,;|•]/).map(t => t.trim()).filter(Boolean));
          continue;
        }

        // Strip common label prefixes like "Languages:", "Frameworks:", "Tools:"
        const cleaned = line
          .replace(/^[•\-\*o\+]\s*/, '')
          .replace(/^(Technologies|Languages|Frameworks|Tools|Skills|Core Competencies|Databases|DevOps|Cloud|Platforms|Libraries|Programming|Backend|Frontend|Operating Systems|Testing|CI\/CD|Infrastructure|Other|Familiar with|Proficient in|Expert in)\s*[:\-–]\s*/i, '');
        const tokens = cleaned.split(/[,;|•·]/).map(t => t.trim()).filter(t => t.length >= 1 && t.length < 50);

        for (const tok of tokens) {
          // Broad tech detection - common programming languages, frameworks, tools, cloud services
          if (/^(react|next\.?js|node\.?js|python|java|javascript|typescript|aws|gcp|azure|docker|sql|mysql|postgres|postgresql|mongodb|mongo|redis|c\+\+|c#|css|html|git|vue|angular|fastapi|django|flask|rust|golang|go|kafka|terraform|kubernetes|k8s|clickhouse|express|spring|ruby|rails|php|laravel|swift|kotlin|flutter|dart|figma|tailwind|sass|less|webpack|vite|jest|mocha|cypress|selenium|graphql|rest|grpc|linux|unix|bash|powershell|nginx|apache|jenkins|travis|circleci|github|gitlab|bitbucket|jira|confluence|slack|vercel|netlify|heroku|firebase|supabase|prisma|drizzle|sequelize|mongoose|redux|zustand|mobx|svelte|nuxt|gatsby|remix|astro|deno|bun|npm|yarn|pnpm|pip|conda|maven|gradle|sbt|cmake|makefile|webpack|rollup|parcel|esbuild|swc|babel|eslint|prettier|docker|podman|helm|argo|ansible|chef|puppet|datadog|grafana|prometheus|splunk|elasticsearch|kibana|logstash|rabbitmq|nats|pulsar|celery|airflow|spark|hadoop|hive|snowflake|redshift|bigquery|dynamodb|cassandra|couchdb|neo4j|influxdb|timescaledb|sqlite|oracle|mssql|mariadb|cockroachdb|planetscale|neon|opencv|tensorflow|pytorch|keras|scikit|pandas|numpy|scipy|matplotlib|seaborn|plotly|d3\.?js|three\.?js|unity|unreal|godot|blender|photoshop|illustrator|sketch|xd|canva|storybook|chromatic|playwright|puppeteer|appium|postman|insomnia|swagger|openapi|grpc|protobuf|thrift|avro|json|xml|yaml|toml|csv|parquet|orc|arrow|dbt|looker|tableau|power\s*bi|excel|word|latex|markdown|notion|obsidian|roam|trello|asana|linear|monday|clickup|airtable)$/i.test(tok.replace(/\s+/g, ''))) {
            allTech.push(tok);
          } else if (/[A-Z]{2,}/.test(tok) || /\d/.test(tok) || /\.js|\.py|\.ts|\.go|\.rs|\.rb/i.test(tok)) {
            // Acronyms (AWS, GCP, CI/CD) or versioned tools (Python 3.x, ES6)
            allTech.push(tok);
          } else {
            allSkills.push(tok);
          }
        }
      }
    }

    // Extract tech acronyms across the resume using compromise
    const fullDoc = nlp(rawText);
    const acronyms = fullDoc.acronyms().out('array');
    for (const acr of acronyms) {
      if (/^(AWS|GCP|SQL|CSS|HTML|API|REST|CI\/CD|JSON|XML|HTTP|DNS|TCP|IP|CLI|GUI|SDK|OOP|MVC|MVVM|TDD|BDD|DDD|SaaS|PaaS|IaaS|IoT|ML|AI|NLP|CV|AR|VR|XR|UI|UX|SEO|CDN|SSR|SSG|CSR|SPA|PWA|CMS|ERP|CRM|ETL|ELT)$/i.test(acr)) {
        allTech.push(acr.toUpperCase());
      }
    }

    base.skills_and_interests = {
      skills: Array.from(new Set(allSkills.length ? allSkills : allTech)).slice(0, 30),
      technologies: Array.from(new Set(allTech.length ? allTech : allSkills)).slice(0, 30),
      certifications: Array.from(new Set(allCerts)).slice(0, 10)
    };
  }

  return base;
}
