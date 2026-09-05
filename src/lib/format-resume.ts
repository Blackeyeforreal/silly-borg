import type { ResumeData } from './schema';

/**
 * Pure utility to format structured ResumeData into clean plain-text
 * for prompts, serializations, and baseline resume descriptions.
 * This file is shared between server routes and client components (NO 'use client' directive).
 */
export function formatResumeDataToText(data: ResumeData): string {
  const parts: string[] = [];

  if (data.personal_info?.full_name) {
    parts.push(`FULL NAME: ${data.personal_info.full_name}`);
  }

  const c = data.personal_info?.contact;
  if (c) {
    const contactParts = [c.email, c.phone, c.location, c.links].filter(Boolean);
    if (contactParts.length) {
      parts.push(`CONTACT: ${contactParts.join(' | ')}`);
    }
  }

  if (data.work_experience && data.work_experience.length > 0) {
    parts.push('\nWORK EXPERIENCE:');
    for (const exp of data.work_experience) {
      parts.push(`- Company: ${exp.company} (${exp.dates})`);
      for (const r of exp.roles) {
        parts.push(`  Role: ${r.title}${r.location ? ` | ${r.location}` : ''}${r.dates ? ` | ${r.dates}` : ''}`);
        for (const d of r.description || []) {
          parts.push(`    * ${d}`);
        }
        if (r.key_results && r.key_results.length > 0) {
          parts.push(`    Key Results: ${r.key_results.join('; ')}`);
        }
        if (r.technologies_used && r.technologies_used.length > 0) {
          parts.push(`    Technologies Used: ${r.technologies_used.join(', ')}`);
        }
      }
    }
  }

  if (data.education && data.education.length > 0) {
    parts.push('\nEDUCATION:');
    for (const edu of data.education) {
      parts.push(`- ${edu.university} | ${edu.degree}${edu.major ? `, ${edu.major}` : ''} (${edu.graduation_date})${edu.location ? ` | ${edu.location}` : ''}`);
      if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
        parts.push(`  Honors & Awards: ${edu.honors_and_awards.join(', ')}`);
      }
      if (edu.activities && edu.activities.length > 0) {
        parts.push(`  Activities: ${edu.activities.join(', ')}`);
      }
    }
  }

  if (data.skills_and_interests) {
    const s = data.skills_and_interests;
    parts.push('\nCERTIFICATIONS, SKILLS & INTERESTS:');
    if (s.certifications && s.certifications.length > 0) {
      parts.push(`- Certifications: ${s.certifications.join(', ')}`);
    }
    if (s.technologies && s.technologies.length > 0) {
      parts.push(`- Technologies: ${s.technologies.join(', ')}`);
    }
    if (s.skills && s.skills.length > 0) {
      parts.push(`- Skills: ${s.skills.join(', ')}`);
    }
    if (s.interests && s.interests.length > 0) {
      parts.push(`- Interests: ${s.interests.join(', ')}`);
    }
  }

  if (data.custom_sections && data.custom_sections.length > 0) {
    for (const sec of data.custom_sections) {
      parts.push(`\n${sec.section_title}:`);
      for (const item of sec.items) {
        parts.push(`- ${item.title}${item.subtitle ? ` (${item.subtitle})` : ''}${item.dates ? ` [${item.dates}]` : ''}${item.location ? ` [${item.location}]` : ''}`);
        for (const b of item.description || []) {
          parts.push(`    * ${b}`);
        }
      }
    }
  }

  return parts.join('\n');
}

/**
 * Fallback synthesizer that gracefully tailors a baseline ResumeData to a job description
 * when Gemini API network connectivity is temporarily unavailable (e.g. ENOTFOUND DNS issues).
 */
export function synthesizeTailoredResumeOffline(baseResume: ResumeData, jobDescription: string): ResumeData {
  const tailored: ResumeData = JSON.parse(JSON.stringify(baseResume));
  const jdLower = jobDescription.toLowerCase();

  // Extract key technology and competency keywords present in job description
  const keywordsBank = [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Golang',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'CI/CD', 'GraphQL', 'REST APIs', 'Microservices', 'Tailwind CSS', 'Redux', 'Zustand',
    'Agile', 'Scrum', 'System Design', 'Performance Optimization', 'Full-Stack Development'
  ];

  const matchedKeywords = keywordsBank.filter(kw => jdLower.includes(kw.toLowerCase()));

  if (!tailored.skills_and_interests) {
    tailored.skills_and_interests = { skills: [], technologies: [] };
  }

  const existingSkills = new Set(tailored.skills_and_interests.skills || []);
  const existingTech = new Set(tailored.skills_and_interests.technologies || []);

  for (const kw of matchedKeywords) {
    if (kw.length > 2) {
      existingTech.add(kw);
      existingSkills.add(kw);
    }
  }

  tailored.skills_and_interests.skills = Array.from(existingSkills);
  tailored.skills_and_interests.technologies = Array.from(existingTech);

  // If work experience exists, highlight matching keywords in technologies_used of the most recent role
  if (tailored.work_experience && tailored.work_experience.length > 0) {
    const firstRole = tailored.work_experience[0]?.roles?.[0];
    if (firstRole) {
      const roleTech = new Set(firstRole.technologies_used || []);
      for (const kw of matchedKeywords.slice(0, 5)) {
        roleTech.add(kw);
      }
      firstRole.technologies_used = Array.from(roleTech);
    }
  }

  return tailored;
}

