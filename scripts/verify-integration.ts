import PizZip from 'pizzip';
import { ResumeDataSchema, type ResumeData } from '../src/lib/schema';
import { setNestedValue, getNestedValue, addToArray, removeFromArray } from '../src/store/resume-store';
import { renderResumeDocx } from '../src/lib/docx/renderer';

const sampleResume: ResumeData = {
  personal_info: {
    full_name: 'Devang Srivastava',
    contact: {
      email: 'devang@example.com',
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
      links: 'https://linkedin.com/in/devang'
    }
  },
  work_experience: [
    {
      company: 'TechCorp Solutions',
      dates: 'Jan 2022 – Present',
      roles: [
        {
          title: 'Senior Software Engineer',
          location: 'New York, NY',
          description: [
            'Architected and deployed high-throughput microservices handling 2M+ requests daily.',
            'Spearheaded performance tuning efforts reducing latency by 42% across core endpoints.'
          ],
          technologies_used: ['TypeScript', 'Next.js', 'Go', 'PostgreSQL', 'Docker']
        }
      ]
    },
    {
      company: 'DataFlow Systems',
      dates: 'Jun 2019 – Dec 2021',
      roles: [
        {
          title: 'Software Engineer',
          location: 'San Francisco, CA',
          description: [
            'Engineered real-time analytics pipelines processing telemetry data for enterprise clients.',
            'Collaborated with product teams to design and implement intuitive reporting dashboards.'
          ],
          key_results: ['Increased client data processing throughput by 35%']
        }
      ]
    },
    {
      company: 'Innovate Labs',
      dates: 'Jan 2018 – May 2019',
      roles: [
        {
          title: 'Junior Developer',
          location: 'Remote',
          description: [
            'Built responsive web interfaces and integrated RESTful APIs.',
            'Maintained unit and integration test coverage across multiple client repositories.'
          ]
        }
      ]
    },
    {
      company: 'Apex Digital',
      dates: '2016 – 2017',
      roles: [
        {
          title: 'Lead Frontend Specialist',
          dates: '2017 – 2017',
          location: 'Austin, TX',
          description: [
            'Led UI refactor to React resulting in 50% faster page render times.',
            'Mentored junior engineers and instituted code review standards.'
          ]
        },
        {
          title: 'Frontend Developer',
          dates: '2016 – 2017',
          location: 'Austin, TX',
          description: [
            'Developed modular UI components for customer-facing web portals.'
          ]
        }
      ]
    }
  ],
  education: [
    {
      university: 'Carnegie Mellon University',
      graduation_date: 'May 2016',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      location: 'Pittsburgh, PA',
      honors_and_awards: ["Dean's List", 'Summa Cum Laude'],
      activities: ['ACM Student Chapter', 'Hackathon Lead Organizer']
    }
  ],
  skills_and_interests: {
    certifications: ['AWS Certified Solutions Architect'],
    technologies: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
    skills: ['Full-Stack Development', 'Distributed Systems', 'System Architecture', 'API Design'],
    interests: ['Open Source', 'Algorithmic Trading', 'Chess']
  }
};

async function runTests() {
  console.log('--- Step 1: Testing Schema Validation ---');
  const parsed = ResumeDataSchema.parse(sampleResume);
  if (!parsed || parsed.personal_info.full_name !== 'Devang Srivastava') {
    throw new Error('Schema validation failed to parse data correctly');
  }
  console.log('✓ Schema Validation passed!');

  console.log('--- Step 2: Testing Store Path Operations ---');
  let cloned = JSON.parse(JSON.stringify(sampleResume));
  cloned = setNestedValue(cloned, 'personal_info.full_name', 'Jane Doe');
  if (getNestedValue(cloned, 'personal_info.full_name') !== 'Jane Doe') {
    throw new Error('setNestedValue failed on top-level nested field');
  }

  cloned = setNestedValue(cloned, 'work_experience[0].roles[0].description[0]', 'Updated description bullet');
  if (getNestedValue(cloned, 'work_experience[0].roles[0].description[0]') !== 'Updated description bullet') {
    throw new Error('deep setNestedValue failed on array item');
  }

  cloned = addToArray(cloned, 'work_experience[0].roles[0].description', 'Added bullet');
  const bullets = getNestedValue(cloned, 'work_experience[0].roles[0].description');
  if (bullets.length !== 3 || bullets[2] !== 'Added bullet') {
    throw new Error('addToArray failed');
  }

  cloned = removeFromArray(cloned, 'work_experience[0].roles[0].description', 1);
  const bulletsAfterRemove = getNestedValue(cloned, 'work_experience[0].roles[0].description');
  if (bulletsAfterRemove.length !== 2) {
    throw new Error('removeFromArray failed');
  }
  console.log('✓ Store path operations passed!');

  console.log('--- Step 3: Testing DOCX Template Rendering ---');
  const buf = await renderResumeDocx(sampleResume);
  if (!buf || buf.length < 1000) {
    throw new Error('DOCX buffer is unexpectedly small or empty');
  }
  const zip = new PizZip(buf);
  const xml = zip.file('word/document.xml')?.asText() || '';

  if (!xml.includes('Devang Srivastava')) throw new Error('Full name missing in generated docx');
  if (!xml.includes('TechCorp Solutions')) throw new Error('Company missing in generated docx');
  if (!xml.includes('Senior Software Engineer')) throw new Error('Role missing in generated docx');
  if (!xml.includes('Carnegie Mellon University')) throw new Error('Education missing in generated docx');
  if (!xml.includes('AWS Certified Solutions Architect')) throw new Error('Certifications missing in generated docx');
  if (xml.includes('[Full Name]')) throw new Error('Unreplaced placeholder [Full Name] found!');
  if (xml.includes('[Company Name 1]')) throw new Error('Unreplaced placeholder [Company Name 1] found!');

  console.log(`✓ DOCX template rendering passed! Size: ${buf.length} bytes`);

  console.log('--- Step 4: Testing Dynamic Paragraph Pruning (Partial Resume) ---');
  const minimalResume: ResumeData = {
    personal_info: {
      full_name: 'Alex Johnson',
      contact: {
        email: 'alex@example.com',
        phone: '123-456-7890',
        location: 'San Francisco, CA',
        links: 'github.com/alex'
      }
    },
    work_experience: [
      {
        company: 'Solo Co',
        dates: '2023 - Present',
        roles: [
          {
            title: 'Staff Engineer',
            location: 'Remote',
            description: ['Built scalable systems end-to-end.']
          }
        ]
      }
    ],
    education: [
      {
        university: 'State University',
        graduation_date: '2020',
        degree: 'BS',
        major: 'SE',
        location: 'CA'
      }
    ],
    skills_and_interests: {
      skills: ['TypeScript', 'Node.js']
    }
  };

  const minBuf = await renderResumeDocx(minimalResume);
  const minZip = new PizZip(minBuf);
  const minXml = minZip.file('word/document.xml')?.asText() || '';

  if (!minXml.includes('Alex Johnson')) throw new Error('Alex Johnson missing in minimal docx');
  if (!minXml.includes('Solo Co')) throw new Error('Solo Co missing in minimal docx');
  if (minXml.includes('Key Results:')) throw new Error('Key Results should NOT be present in minimal docx');
  if (minXml.includes('Technologies/Skills Used:')) throw new Error('Technologies/Skills Used should NOT be present');
  if (minXml.includes('Certifications:')) throw new Error('Certifications should NOT be present');
  if (minXml.includes('Honors &amp; Awards:')) throw new Error('Honors & Awards should NOT be present');
  if (minXml.includes('[Company Name')) throw new Error('Placeholder Company Name found');
  console.log('✓ Dynamic paragraph pruning verified with 0 orphan labels and 0 unreplaced placeholders!');

  console.log('--- Step 5: Testing Rich Text Formatting Parser ---');
  const { parseFormattedRuns } = await import('../src/lib/format-text');
  const formattedSample = 'Engineered **10+ microservices** with *low latency* and <u>high throughput</u>.';
  const runs = parseFormattedRuns(formattedSample);
  if (runs.length !== 7) {
    throw new Error(`Expected 7 runs, got ${runs.length}`);
  }
  if (!runs[1].bold || runs[1].text !== '10+ microservices') {
    throw new Error('Bold formatting run not extracted correctly');
  }
  if (!runs[3].italic || runs[3].text !== 'low latency') {
    throw new Error('Italic formatting run not extracted correctly');
  }
  if (!runs[5].underline || runs[5].text !== 'high throughput') {
    throw new Error('Underline formatting run not extracted correctly');
  }
  console.log('✓ Rich text formatting parser verified!');

  console.log('--- Step 6: Testing Custom Sections in Schema and DOCX ---');
  const customResume: ResumeData = {
    ...sampleResume,
    custom_sections: [
      {
        id: 'sec_1',
        section_title: 'FEATURED PROJECTS',
        items: [
          {
            title: 'AI Resume Builder',
            subtitle: 'Next.js 15, TypeScript, Gemini 3.6 Flash',
            dates: '2024',
            location: 'github.com/project',
            description: [
              'Implemented **interactive preview** with <u>instant formatting</u> and *Garamond parity*.'
            ]
          }
        ]
      }
    ]
  };

  const customBuf = await renderResumeDocx(customResume);
  const customZip = new PizZip(customBuf);
  const customXml = customZip.file('word/document.xml')?.asText() || '';

  if (!customXml.includes('FEATURED PROJECTS')) throw new Error('FEATURED PROJECTS section header missing');
  if (!customXml.includes('AI Resume Builder')) throw new Error('Project title missing');
  if (!customXml.includes('<w:b w:val="1"/>')) throw new Error('Bold run XML missing in custom section');
  if (!customXml.includes('<w:u w:val="single"/>')) throw new Error('Underline run XML missing in custom section');
  console.log('✓ Custom sections with native OpenXML rich-text runs verified!');

  console.log('--- Step 7: Testing Hyperlink Parsing and DOCX Hyperlink Styling ---');
  const { insertHyperlink } = await import('../src/lib/format-text');
  const linkText = 'Portfolio: [Devang Srivastava](https://github.com/Blackeyeforreal) | [LinkedIn](https://linkedin.com)';
  const linkRuns = parseFormattedRuns(linkText);
  if (linkRuns.length !== 4) {
    throw new Error(`Expected 4 runs for linkText, got ${linkRuns.length}`);
  }
  if (!linkRuns[1].linkUrl || linkRuns[1].linkUrl !== 'https://github.com/Blackeyeforreal' || linkRuns[1].text !== 'Devang Srivastava') {
    throw new Error('Hyperlink 1 was not extracted properly');
  }
  if (!linkRuns[3].linkUrl || linkRuns[3].linkUrl !== 'https://linkedin.com' || linkRuns[3].text !== 'LinkedIn') {
    throw new Error('Hyperlink 2 was not extracted properly');
  }

  // Test insertHyperlink helper
  const inserted = insertHyperlink('Hello world', 6, 11, 'https://world.com');
  if (inserted.newText !== 'Hello [world](https://world.com)') {
    throw new Error(`insertHyperlink failed: got "${inserted.newText}"`);
  }

  // Test DOCX rendering with hyperlinks
  const resumeWithLink: ResumeData = {
    ...sampleResume,
    personal_info: {
      ...sampleResume.personal_info,
      contact: {
        ...sampleResume.personal_info.contact,
        links: '[GitHub Profile](https://github.com/Blackeyeforreal)'
      }
    }
  };
  const linkBuf = await renderResumeDocx(resumeWithLink);
  const linkZip = new PizZip(linkBuf);
  const linkXml = linkZip.file('word/document.xml')?.asText() || '';
  if (!linkXml.includes('<w:color w:val="0563C1"/>') || !linkXml.includes('GitHub Profile')) {
    throw new Error('DOCX XML missing blue hyperlink run styling');
  }
  console.log('✓ Hyperlink parsing and DOCX styling verified!');

  console.log('--- Step 8: Testing Template Customization in DOCX ---');
  const customTemplateSettings = {
    fontFamily: 'Calibri' as const,
    accentColor: '#1E3A8A',
    marginSize: 'compact' as const,
    lineSpacing: 'tight' as const,
    fontSize: 'compact' as const,
  };

  const customTmplBuf = await renderResumeDocx(sampleResume, customTemplateSettings);
  const customTmplZip = new PizZip(customTmplBuf);
  const customTmplXml = customTmplZip.file('word/document.xml')?.asText() || '';

  if (!customTmplXml.includes('w:ascii="Calibri"')) {
    throw new Error('Calibri font was not applied to document XML runs');
  }
  if (!customTmplXml.includes('w:bottom w:color="1E3A8A"')) {
    throw new Error('Accent color 1E3A8A was not applied to borders');
  }
  if (!customTmplXml.includes('w:left="504"') || !customTmplXml.includes('w:right="504"')) {
    throw new Error('Compact margin twips (504) was not applied to w:pgMar');
  }
  if (!customTmplXml.includes('w:line="220"')) {
    throw new Error('Tight line spacing (220) was not applied to paragraphs');
  }
  console.log('✓ Template customization (Calibri font, Navy accent color, compact margins) verified in DOCX!');

  console.log('--- Step 9: Testing Single Active Editing State ---');
  const { useResumeStore } = await import('../src/store/resume-store');
  const store = useResumeStore.getState();
  store.setActiveEditingPath('personal_info.full_name');
  if (useResumeStore.getState().activeEditingPath !== 'personal_info.full_name') {
    throw new Error('setActiveEditingPath failed to set active editing path');
  }
  store.setActiveEditingPath('work_experience[0].company');
  if (useResumeStore.getState().activeEditingPath !== 'work_experience[0].company') {
    throw new Error('setActiveEditingPath failed to switch active editing path to new field');
  }
  store.setActiveEditingPath(null);
  if (useResumeStore.getState().activeEditingPath !== null) {
    throw new Error('setActiveEditingPath failed to clear active editing path');
  }
  console.log('✓ Single active editing state verified in resume store!');

  console.log('=============================================');
  console.log('🎉 ALL INTEGRATION VERIFICATION TESTS PASSED!');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});

