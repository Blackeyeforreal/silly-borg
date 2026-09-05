import { ResumeData } from '../schema';
import { CoverLetterData } from './schema';

export type CoverLetterTone = 'professional' | 'confident' | 'technical';

function extractCompanyFromJD(jd: string): string {
  const patterns = [
    /(?:company|organization|employer):\s*([A-Za-z0-9&., -]{2,40})/i,
    /(?:at|join|welcome to)\s+([A-Z][A-Za-z0-9&., -]{2,30}?)(?:\s+is|\s+we|\s+in|\s+as|\s+team|[.,\n])/i,
    /(?:About|Welcome to)\s+([A-Z][A-Za-z0-9&., -]{2,30})/i,
  ];

  for (const pat of patterns) {
    const match = jd.match(pat);
    if (match && match[1]) {
      const clean = match[1].trim().replace(/[.,;]$/, '');
      if (clean.length > 1 && !['The', 'Our', 'A', 'An', 'This'].includes(clean)) {
        return clean;
      }
    }
  }

  return 'your company';
}

function extractJobTitleFromJD(jd: string): string {
  const patterns = [
    /(?:role|position|job title|opening):\s*([A-Za-z0-9&/., -]{3,50})/i,
    /(?:looking for|hiring|seeking)\s+(?:an?|the)\s+([A-Za-z0-9&/., -]{3,40}?)(?:\s+to|\s+who|\s+in|[.,\n])/i,
    /((?:Senior|Lead|Staff|Principal|Junior)?\s*(?:Software|Frontend|Backend|Full-Stack|DevOps|Site Reliability|Cloud|Systems|Data|AI|ML)\s*(?:Engineer|Developer|Architect|Specialist))/i,
    /((?:Product|Engineering|Technical|Project)\s*Manager)/i
  ];

  for (const pat of patterns) {
    const match = jd.match(pat);
    if (match && match[1]) {
      const clean = match[1].trim().replace(/[.,;]$/, '');
      if (clean.length > 2) {
        return clean;
      }
    }
  }

  return 'this role';
}

export function synthesizeCoverLetterOffline(
  resume: ResumeData,
  jobDescription: string,
  tone: CoverLetterTone = 'professional'
): CoverLetterData {
  const candidateName = resume.personal_info?.full_name || 'Candidate';
  const companyName = extractCompanyFromJD(jobDescription);
  const jobTitle = extractJobTitleFromJD(jobDescription);

  // Extract candidate top skills
  const skillsList = [
    ...(resume.skills_and_interests?.technologies || []),
    ...(resume.skills_and_interests?.skills || [])
  ];
  const topSkills = skillsList.slice(0, 4).join(', ') || 'modern software engineering best practices';

  // Extract top work experience & achievement
  let recentCompany = 'my previous position';
  let recentRole = 'Engineer';
  let bestBullet = 'designed and delivered robust software solutions that enhanced team velocity and user satisfaction';

  if (resume.work_experience && resume.work_experience.length > 0) {
    const exp = resume.work_experience[0];
    recentCompany = exp.company || recentCompany;
    if (exp.roles && exp.roles.length > 0) {
      const r = exp.roles[0];
      recentRole = r.title || recentRole;
      if (r.description && r.description.length > 0) {
        // Pick bullet with metrics or the first bullet
        const metricBullet = r.description.find(b => /\d+%|\d+x|\$\d+|\b\d+\b/.test(b));
        bestBullet = metricBullet || r.description[0];
        // Ensure lowercase start if stitching into sentence
        bestBullet = bestBullet.replace(/^[•\-\*\s]+/, '');
        bestBullet = bestBullet.charAt(0).toLowerCase() + bestBullet.slice(1);
        if (!bestBullet.endsWith('.')) bestBullet += '.';
      }
    }
  }

  // Pick secondary achievement if available
  let secondaryDetail = '';
  if (resume.work_experience && (resume.work_experience.length > 1 || (resume.work_experience[0].roles?.length || 0) > 1)) {
    const secondExp = resume.work_experience[1] || resume.work_experience[0];
    const secondRole = secondExp.roles?.[1] || secondExp.roles?.[0];
    if (secondRole?.description?.[1]) {
      secondaryDetail = ` In addition, while working with ${secondRole.technologies_used?.slice(0, 3).join(', ') || 'cross-functional teams'}, I ${secondRole.description[1].replace(/^[•\-\*\s]+/, '').charAt(0).toLowerCase() + secondRole.description[1].replace(/^[•\-\*\s]+/, '').slice(1)}`;
      if (!secondaryDetail.endsWith('.')) secondaryDetail += '.';
    }
  }

  // Formulate paragraphs according to tone
  let opening = '';
  let body1 = '';
  let body2 = '';
  let closing = '';

  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (tone === 'confident') {
    opening = `I am writing to express my strong candidacy for the ${jobTitle} position at ${companyName}. With extensive hands-on expertise spanning ${topSkills}, I have consistently built high-throughput, mission-critical systems and led initiatives that generated measurable organizational impact. I am confident that my background aligns directly with the ambitious targets of your team.`;
    
    body1 = `In my tenure as ${recentRole} at ${recentCompany}, I spearheaded critical initiatives where I ${bestBullet}${secondaryDetail} My approach centers on rapid iteration, robust architectural design, and delivering production-ready features that balance speed with long-term reliability.`;
    
    body2 = `What distinguishes ${companyName} for me is your dedication to engineering excellence and scalable innovation. I thrive in challenging environments where complex technical hurdles require creative, structured solutions. With my strong foundation in ${topSkills}, I am prepared to hit the ground running and make immediate contributions to your core engineering objectives.`;
    
    closing = `Thank you for your time and review. I look forward to discussing how my experience, leadership, and technical capabilities will drive continuous success for ${companyName}.`;
  } else if (tone === 'technical') {
    opening = `I am writing to apply for the ${jobTitle} opportunity at ${companyName}. With demonstrated proficiency in ${topSkills}, my engineering background focuses on building scalable, performant distributed systems and clean, maintainable codebases. I am eager to leverage this expertise toward ${companyName}'s technical vision.`;
    
    body1 = `As ${recentRole} at ${recentCompany}, I focused heavily on system architecture and code optimization. During this period, I ${bestBullet}${secondaryDetail} Furthermore, my experience configuring robust CI/CD pipelines, automated testing, and cloud environments ensures high reliability and seamless deployments across our development lifecycle.`;
    
    body2 = `Reviewing the requirements for ${companyName}, I noticed a strong emphasis on scalable engineering, system reliability, and cross-functional execution. Having tackled similar engineering challenges with technologies like ${topSkills}, I am excited about the prospect of applying these methodologies to accelerate your development milestones.`;
    
    closing = `I appreciate your consideration and welcome the opportunity to discuss how my technical qualifications and engineering problem-solving can support ${companyName}'s engineering goals.`;
  } else {
    // Standard 'professional' tone
    opening = `I am writing to express my enthusiastic interest in the ${jobTitle} role at ${companyName}. Given my background in ${topSkills} and a proven track record of delivering high-impact software solutions, I am excited about the opportunity to contribute meaningfully to your team's upcoming initiatives.`;
    
    body1 = `During my time as ${recentRole} at ${recentCompany}, I led key projects that directly advanced product quality and operational efficiency. Notably, I ${bestBullet}${secondaryDetail} Working across the entire software development lifecycle, I take pride in crafting maintainable architectures and collaborating effectively with product managers, designers, and fellow engineers.`;
    
    body2 = `I have long admired ${companyName}'s commitment to quality and forward-thinking problem solving. The opportunity to bring my experience in ${topSkills} to an organization with such a strong reputation for excellence is especially compelling. I am confident that my work ethic, adaptability, and proactive mindset will make me a strong asset to your team.`;
    
    closing = `Thank you for considering my application. I would welcome the opportunity to discuss how my skills, experiences, and dedication align with the goals of ${companyName}.`;
  }

  return {
    recipient_name: 'Hiring Team',
    recipient_title: 'Hiring Manager',
    company_name: companyName === 'your company' ? 'Hiring Company' : companyName,
    job_title: jobTitle === 'this role' ? 'Software Engineer' : jobTitle,
    date: todayFormatted,
    opening_paragraph: opening,
    body_paragraphs: [body1, body2],
    closing_paragraph: closing,
    sign_off: 'Sincerely,'
  };
}
