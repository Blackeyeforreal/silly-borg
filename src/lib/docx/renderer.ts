import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { ResumeData } from '../schema';

function xmlEscape(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function renderResumeDocx(data: ResumeData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'Template', 'Devang Srivastava - Resume.docx');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template DOCX file not found at: ' + templatePath);
  }

  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);
  let xml = zip.file('word/document.xml')?.asText();

  if (!xml) {
    throw new Error('Could not extract word/document.xml from template');
  }

  // 1. Personal Info
  const fullName = xmlEscape(data.personal_info?.full_name || '');
  xml = xml.replace('[Full Name]', fullName);

  const contact = data.personal_info?.contact;
  const contactLine = [
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.links,
  ].filter(Boolean).map(s => xmlEscape(s as string)).join(' | ');

  xml = xml.replace(
    '[Email Address] | [Phone Number] | [City, State] | [Portfolio / LinkedIn / GitHub Link]',
    contactLine
  );

  // 2. Work Experience (Template accommodates up to 4 companies)
  const workExps = data.work_experience || [];

  // Company 1
  const c1 = workExps[0];
  if (c1) {
    xml = xml.replace('[Company Name 1]', xmlEscape(c1.company));
    // Match date replacement in company 1
    const role1 = c1.roles?.[0];
    xml = xml.replace('[Job Title]', xmlEscape(role1?.title || ''));
    xml = xml.replace('[Location / Remote]', xmlEscape(role1?.location || ''));
    xml = xml.replace(
      '[Brief company overview or high-level summary of responsibilities and achievements.]',
      xmlEscape(role1?.description?.[0] || '')
    );
    xml = xml.replace(
      '[Key responsibility or major project completed with quantified metrics and outcomes.]',
      xmlEscape(role1?.description?.[1] || '')
    );
    xml = xml.replace(
      '[List of relevant tools, languages, or frameworks]',
      xmlEscape(role1?.technologies_used?.join(', ') || '')
    );
  } else {
    xml = xml.replace('[Company Name 1]', '');
    xml = xml.replace('[Job Title]', '');
    xml = xml.replace('[Location / Remote]', '');
    xml = xml.replace('[Brief company overview or high-level summary of responsibilities and achievements.]', '');
    xml = xml.replace('[Key responsibility or major project completed with quantified metrics and outcomes.]', '');
    xml = xml.replace('[List of relevant tools, languages, or frameworks]', '');
  }

  // Company 2
  const c2 = workExps[1];
  if (c2) {
    xml = xml.replace('[Company Name 2]', xmlEscape(c2.company));
    const role2 = c2.roles?.[0];
    xml = xml.replace('[Job Title]', xmlEscape(role2?.title || ''));
    xml = xml.replace('[Location / Remote]', xmlEscape(role2?.location || ''));
    xml = xml.replace(
      '[Core responsibility #1 / key achievements / project leadership description.]',
      xmlEscape(role2?.description?.[0] || '')
    );
    xml = xml.replace(
      '[Core responsibility #2 / operational impact or team collaboration summary.]',
      xmlEscape(role2?.description?.[1] || '')
    );
    xml = xml.replace(
      '[Measurable impact, performance metrics, revenue growth, or efficiency gains.]',
      xmlEscape(role2?.key_results?.join('; ') || '')
    );
  } else {
    xml = xml.replace('[Company Name 2]', '');
    xml = xml.replace('[Job Title]', '');
    xml = xml.replace('[Location / Remote]', '');
    xml = xml.replace('[Core responsibility #1 / key achievements / project leadership description.]', '');
    xml = xml.replace('[Core responsibility #2 / operational impact or team collaboration summary.]', '');
    xml = xml.replace('[Measurable impact, performance metrics, revenue growth, or efficiency gains.]', '');
  }

  // Company 3
  const c3 = workExps[2];
  if (c3) {
    xml = xml.replace('[Company Name 3]', xmlEscape(c3.company));
    const role3 = c3.roles?.[0];
    xml = xml.replace('[Job Title]', xmlEscape(role3?.title || ''));
    xml = xml.replace('[Location / Remote]', xmlEscape(role3?.location || ''));
    xml = xml.replace(
      '[Core responsibility #1 / summary of key achievements.]',
      xmlEscape(role3?.description?.[0] || '')
    );
    xml = xml.replace(
      '[Core responsibility #2 / summary of role scope.]',
      xmlEscape(role3?.description?.[1] || '')
    );
  } else {
    xml = xml.replace('[Company Name 3]', '');
    xml = xml.replace('[Job Title]', '');
    xml = xml.replace('[Location / Remote]', '');
    xml = xml.replace('[Core responsibility #1 / summary of key achievements.]', '');
    xml = xml.replace('[Core responsibility #2 / summary of role scope.]', '');
  }

  // Company 4 (Multi-role support in template)
  const c4 = workExps[3];
  if (c4) {
    xml = xml.replace('[Company Name 4]', xmlEscape(c4.company));
    const recentRole = c4.roles?.[0];
    const priorRole = c4.roles?.[1] || c4.roles?.[0];

    xml = xml.replace('[Recent Job Title]', xmlEscape(recentRole?.title || ''));
    xml = xml.replace(
      '[Key responsibility or initiative managed in this role.]',
      xmlEscape(recentRole?.description?.[0] || '')
    );
    xml = xml.replace(
      '[Key achievement or outcome produced in this role.]',
      xmlEscape(recentRole?.description?.[1] || '')
    );

    xml = xml.replace('[Prior Job Title]', xmlEscape(priorRole?.title || ''));
    xml = xml.replace(
      '[Primary responsibility or achievement prior to promotion.]',
      xmlEscape(priorRole?.description?.[0] || '')
    );
  } else {
    xml = xml.replace('[Company Name 4]', '');
    xml = xml.replace('[Recent Job Title]', '');
    xml = xml.replace('[Key responsibility or initiative managed in this role.]', '');
    xml = xml.replace('[Key achievement or outcome produced in this role.]', '');
    xml = xml.replace('[Prior Job Title]', '');
    xml = xml.replace('[Primary responsibility or achievement prior to promotion.]', '');
  }

  // Dates replacement across all companies
  for (const exp of workExps) {
    if (exp.dates) {
      xml = xml.replace('[Start Date] – [End Date]', xmlEscape(exp.dates));
    }
  }
  // Clean any remaining unpopulated dates
  xml = xml.replace(/\[Start Date\] – \[End Date\]/g, '');

  // 3. Education
  const edu = data.education?.[0];
  if (edu) {
    xml = xml.replace('[University Name]', xmlEscape(edu.university || ''));
    xml = xml.replace('[Graduation Date]', xmlEscape(edu.graduation_date || ''));
    xml = xml.replace('[Degree Name]', xmlEscape(edu.degree || ''));
    xml = xml.replace('[Major]', xmlEscape(edu.major || ''));
    xml = xml.replace('[Location]', xmlEscape(edu.location || ''));
    xml = xml.replace(
      '[GPA / Honors / Dean\'s List / Academic Achievements]',
      xmlEscape(edu.honors_and_awards?.join(', ') || '')
    );
    xml = xml.replace(
      '[Relevant coursework, clubs, minor, leadership, or study abroad]',
      xmlEscape(edu.activities?.join(', ') || '')
    );
  } else {
    xml = xml.replace('[University Name]', '');
    xml = xml.replace('[Graduation Date]', '');
    xml = xml.replace('[Degree Name]', '');
    xml = xml.replace('[Major]', '');
    xml = xml.replace('[Location]', '');
    xml = xml.replace('[GPA / Honors / Dean\'s List / Academic Achievements]', '');
    xml = xml.replace('[Relevant coursework, clubs, minor, leadership, or study abroad]', '');
  }

  // 4. Skills & Interests
  const skills = data.skills_and_interests;
  xml = xml.replace(
    '[List relevant professional certifications and licenses]',
    xmlEscape(skills?.certifications?.join(', ') || '')
  );
  xml = xml.replace(
    '[List software, tools, programming languages, and technical platforms]',
    xmlEscape(skills?.technologies?.join(', ') || '')
  );
  xml = xml.replace(
    '[List core technical and domain skills]',
    xmlEscape(skills?.skills?.join(', ') || '')
  );
  xml = xml.replace(
    '[List personal interests or hobbies]',
    xmlEscape(skills?.interests?.join(', ') || '')
  );

  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer' });
}
