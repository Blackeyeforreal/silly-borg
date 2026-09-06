import assert from 'assert';
import { normalizeResumeData, formatSemanticLink } from '../src/lib/normalization/resume-normalizer';
import { calculateResumePagination } from '../src/lib/pagination/pagination-engine';
import { renderResumeDocx } from '../src/lib/docx/renderer';
import type { ResumeData } from '../src/lib/schema';

// -------------------------------------------------------------
// Test Archetypes
// -------------------------------------------------------------

// 1. Very Short Resume
const archetype1VeryShort: any = {
  personal_info: {
    full_name: 'Alex Mercer',
    contact: {
      email: 'alex@example.com',
      phone: '+1 555-0100',
      location: 'Seattle, WA',
      links: 'alexmercer.dev'
    }
  },
  work_experience: [
    {
      company: 'Northwest Cloud Labs',
      dates: '2023 – Present',
      roles: [
        {
          title: 'Junior Cloud Developer',
          dates: '2023 – Present',
          location: 'Seattle, WA',
          description: [
            'Maintained Terraform modules for serverless AWS Lambda workloads.',
            'Monitored cloud infrastructure health using Datadog and AWS CloudWatch.'
          ],
          technologies_used: ['AWS', 'Terraform', 'TypeScript']
        }
      ]
    }
  ],
  education: [
    {
      institution: 'University of Washington',
      degree: 'B.S. in Computer Science',
      graduation_date: '2023',
      location: 'Seattle, WA'
    }
  ],
  skills_and_interests: {
    skills: ['TypeScript', 'Python', 'AWS', 'Docker', 'Git']
  }
};

// 2. Normal 1-Page Resume
const archetype2Normal1P: any = {
  personal_info: {
    full_name: 'Sarah Connor',
    contact: {
      email: 'sarah.connor@cyberdyne.io',
      phone: '+1 (415) 555-2671',
      location: 'San Francisco, CA',
      links: 'github.com/sconnor'
    }
  },
  work_experience: [
    {
      company: 'Apex Systems',
      dates: '2021 – Present',
      roles: [
        {
          title: 'Senior Software Engineer',
          dates: '2021 – Present',
          location: 'San Francisco, CA',
          description: [
            'Architected microservices processing over 5M API requests daily with 99.99% uptime.',
            'Spearheaded transition from monolith to containerized Kubernetes deployment.',
            'Mentored 6 associate developers on engineering best practices and clean architecture.'
          ],
          technologies_used: ['Go', 'Kubernetes', 'PostgreSQL', 'Redis', 'gRPC']
        }
      ]
    },
    {
      company: 'Helios Data Corp',
      dates: '2018 – 2021',
      roles: [
        {
          title: 'Software Engineer',
          dates: '2018 – 2021',
          location: 'San Jose, CA',
          description: [
            'Built real-time telemetry processing pipeline reducing ingestion lag by 45%.',
            'Implemented automated regression test suites increasing CI/CD release confidence.'
          ],
          technologies_used: ['Python', 'Kafka', 'Docker', 'AWS']
        }
      ]
    }
  ],
  education: [
    {
      institution: 'UC Berkeley',
      degree: 'B.S. Electrical Engineering & Computer Science',
      graduation_date: '2018',
      location: 'Berkeley, CA'
    }
  ],
  skills_and_interests: {
    skills: ['Go', 'Python', 'TypeScript', 'Kubernetes', 'AWS', 'PostgreSQL', 'Docker', 'Kafka']
  }
};

// 3. Dense 1-Page Resume (Candidate with multiple roles, custom section)
const archetype3Dense1P: any = {
  personal_info: {
    full_name: 'Marcus Vance',
    contact: {
      email: 'marcus@vance.tech',
      phone: '+1 617-555-8833',
      location: 'Boston, MA',
      links: 'marcusvance.com | linkedin.com/in/marcusvance'
    }
  },
  work_experience: [
    {
      company: 'Boston Quant Technologies',
      dates: '2022 – Present',
      roles: [
        {
          title: 'Lead Distributed Systems Engineer',
          dates: '2022 – Present',
          location: 'Boston, MA',
          description: [
            'Engineered sub-millisecond market feed handler capturing L2 order book data.',
            'Refactored memory management routines decreasing P99 tail latency from 8ms to 1.2ms.',
            'Directed quarterly disaster recovery simulation exercises across three AWS availability zones.'
          ],
          technologies_used: ['C++', 'Rust', 'Linux Kernel', 'ZeroMQ']
        }
      ]
    },
    {
      company: 'Beacon Financial Software',
      dates: '2019 – 2022',
      roles: [
        {
          title: 'Systems Developer',
          dates: '2019 – 2022',
          location: 'Cambridge, MA',
          description: [
            'Designed high-throughput ledger reconciliation engine processing $200M+ in daily settlement volumes.',
            'Migrated core storage tier from Oracle RDBMS to CockroachDB with zero downtime.'
          ],
          technologies_used: ['Go', 'PostgreSQL', 'CockroachDB', 'Docker']
        }
      ]
    },
    {
      company: 'Krypton Labs',
      dates: '2017 – 2019',
      roles: [
        {
          title: 'Backend Developer',
          dates: '2017 – 2019',
          location: 'Boston, MA',
          description: [
            'Created secure RESTful APIs for cryptographic key escrow service.',
            'Automated integration test suites using Docker Compose in GitLab CI.'
          ]
        }
      ]
    }
  ],
  education: [
    {
      institution: 'MIT',
      degree: 'M.Eng. Computer Science',
      graduation_date: '2017',
      location: 'Cambridge, MA'
    }
  ],
  skills_and_interests: {
    skills: ['C++', 'Rust', 'Go', 'Python', 'Distributed Systems', 'Linux Perf', 'Docker', 'Kubernetes']
  },
  custom_sections: [
    {
      id: 'certifications',
      name: 'Certifications',
      items: [
        {
          title: 'AWS Certified Solutions Architect – Professional',
          date: '2023',
          description: 'Validation of advanced technical skills and experience in designing distributed applications.'
        }
      ]
    }
  ]
};

// 4. 2-Page Senior Engineer Resume (Comprehensive 10+ years career)
const archetype4Senior2P: any = {
  personal_info: {
    full_name: 'Dr. Elena Rostova',
    contact: {
      email: 'elena.rostova@stanfordalumni.org',
      phone: '+1 650-555-9012',
      location: 'Palo Alto, CA',
      links: 'elenarostova.net | github.com/erostova'
    }
  },
  work_experience: [
    {
      company: 'Autonomous Robotics Inc',
      dates: '2021 – Present',
      roles: [
        {
          title: 'VP of Platform Engineering',
          dates: '2021 – Present',
          location: 'Palo Alto, CA',
          description: [
            'Lead organization of 45+ engineers developing perception, sensor fusion, and cloud simulation pipelines for autonomous fleet.',
            'Oversaw migration of 10PB perception dataset to multi-region object storage, reducing inference compute cost by $1.8M annually.',
            'Instituted company-wide RFC technical design review framework, elevating deployment velocity and reducing production incidents by 54%.'
          ],
          technologies_used: ['C++', 'Python', 'CUDA', 'Kubernetes', 'TensorFlow', 'ROS 2']
        }
      ]
    },
    {
      company: 'DeepStream AI',
      dates: '2017 – 2021',
      roles: [
        {
          title: 'Principal Software Architect',
          dates: '2019 – 2021',
          location: 'Sunnyvale, CA',
          description: [
            'Designed distributed inference serving architecture supporting 250,000 queries per second across edge devices.',
            'Collaborated with hardware team to optimize model quantization for proprietary NPU accelerator chip.'
          ],
          technologies_used: ['C++', 'TensorRT', 'ONNX', 'gRPC']
        },
        {
          title: 'Staff Engineer',
          dates: '2017 – 2019',
          location: 'Sunnyvale, CA',
          description: [
            'Engineered real-time video streaming pipeline handling 4K 60FPS multi-camera ingest over WebRTC.',
            'Reduced end-to-end video streaming glass-to-glass latency from 180ms to 42ms.'
          ],
          technologies_used: ['C++', 'WebRTC', 'FFmpeg', 'H.265']
        }
      ]
    },
    {
      company: 'Vector Cloud Systems',
      dates: '2014 – 2017',
      roles: [
        {
          title: 'Senior Systems Engineer',
          dates: '2014 – 2017',
          location: 'Mountain View, CA',
          description: [
            'Built distributed file system metadata caching layer in Go, reducing NVMe read IOPS pressure by 60%.',
            'Implemented Raft consensus protocol for high-availability cluster coordination service.'
          ],
          technologies_used: ['Go', 'Raft', 'RocksDB', 'Linux Kernel']
        }
      ]
    },
    {
      company: 'Silicon Graphics Research',
      dates: '2011 – 2014',
      roles: [
        {
          title: 'Research Engineer',
          dates: '2011 – 2014',
          location: 'Menlo Park, CA',
          description: [
            'Conducted research in GPU-accelerated parallel raytracing algorithms.',
            'Published 3 peer-reviewed papers at ACM SIGGRAPH and IEEE Transactions on Visualization.'
          ],
          technologies_used: ['C++', 'OpenGL', 'CUDA', 'OpenCL']
        }
      ]
    }
  ],
  education: [
    {
      institution: 'Stanford University',
      degree: 'Ph.D. in Computer Science (Computer Systems & Graphics)',
      graduation_date: '2011',
      location: 'Stanford, CA'
    },
    {
      institution: 'Carnegie Mellon University',
      degree: 'B.S. in Computer Science with University Honors',
      graduation_date: '2006',
      location: 'Pittsburgh, PA'
    }
  ],
  skills_and_interests: {
    skills: ['Distributed Systems', 'C++', 'Go', 'Python', 'CUDA', 'Kubernetes', 'Linux Kernel', 'Computer Vision', 'System Architecture']
  },
  custom_sections: [
    {
      id: 'patents',
      name: 'Patents & Publications',
      items: [
        {
          title: 'US Patent 10,482,910: Low-latency consensus algorithm for heterogeneous edge compute clusters',
          date: 'Issued 2020',
          description: 'Inventor: Dr. Elena Rostova. Assignee: DeepStream AI.'
        },
        {
          title: 'US Patent 9,871,204: Method and apparatus for hardware-accelerated volumetric streaming',
          date: 'Issued 2016',
          description: 'Inventor: Dr. Elena Rostova. Assignee: Silicon Graphics Research.'
        }
      ]
    }
  ]
};

// 5. Long Project Names & Titles (Collision test)
const archetype5LongProjectNames: any = {
  personal_info: {
    full_name: 'Devon Takahashi',
    contact: {
      email: 'devon@takahashi.io',
      phone: '+1 206-555-4499',
      location: 'Seattle, WA'
    }
  },
  work_experience: [
    {
      company: 'Global Enterprise Solutions Infrastructure Corp',
      dates: 'Jan 2022 – Present',
      roles: [
        {
          title: 'Principal Director of Scalable Multi-Tenant High-Availability Cloud Infrastructure Platforms',
          dates: 'Jan 2022 – Present',
          location: 'Seattle, WA',
          description: [
            'Spearheaded enterprise modernization initiative across 4 continents and 200+ distinct microservices.'
          ]
        }
      ]
    }
  ],
  custom_sections: [
    {
      id: 'projects',
      name: 'Projects',
      items: [
        {
          title: 'Distributed Asynchronous Multi-Region Real-Time High-Throughput Event Broker and Telemetry Engine',
          date: '2023 – 2024',
          description: 'Engineered open-source message broker benchmarked at 10M messages per second.'
        }
      ]
    }
  ],
  skills_and_interests: {
    skills: ['Distributed Systems', 'Go', 'Kafka', 'Rust']
  }
};

// 6. Many Skills Categories
const archetype6ManySkills: any = {
  personal_info: {
    full_name: 'Jordan Lee',
    contact: {
      email: 'jordan.lee@dev.net',
      phone: '+1 312-555-7711',
      location: 'Chicago, IL'
    }
  },
  work_experience: [
    {
      company: 'Nexus Software',
      dates: '2022 – Present',
      roles: [
        {
          title: 'Full Stack Engineer',
          dates: '2022 – Present',
          description: ['Building high quality modern enterprise web applications.']
        }
      ]
    }
  ],
  skills_and_interests: {
    skills: [
      'Languages: TypeScript, JavaScript, Python, Go, Java, SQL, HTML5, CSS3, Rust, C#',
      'Frameworks: React, Next.js, Node.js, Express, FastAPI, Django, Spring Boot, Vue.js, Angular, Svelte',
      'Cloud & DevOps: AWS (EC2, S3, RDS, Lambda), GCP, Azure, Docker, Kubernetes, Terraform, GitHub Actions, GitLab CI, ArgoCD',
      'Databases: PostgreSQL, MySQL, MongoDB, Redis, Cassandra, Elasticsearch, SQLite, DynamoDB',
      'Tools & Methodologies: Git, Jira, Agile Scrum, Test-Driven Development (TDD), Domain-Driven Design (DDD), CI/CD pipelines'
    ]
  }
};

// 7. Long Raw URLs & Duplicate Content (Benchmark PDF reproduction)
const archetype7LongUrlsAndDuplicates: any = {
  personal_info: {
    full_name: 'Benchmark Engineer',
    contact: {
      email: 'benchmark.engineer@test.org',
      phone: '+1 408-555-1122',
      location: 'San Jose, CA',
      links: 'https://projects-for-portfoliios.s3.us-east-1.amazonaws.com/production/demo/app-v2/index.html?ref=linkedin_profile_showcase_2026'
    }
  },
  work_experience: [
    {
      company: 'Role: Software Development Engineer 1 [Link: https://www.icici.bank.in/careers/open-positions/software-development-engineer-1-job-id-9948271]',
      dates: 'Dec 2021 – Present',
      roles: [
        {
          title: 'Role: Software Development Engineer 1 [Link: https://www.icici.bank.in/careers/open-positions/software-development-engineer-1-job-id-9948271]',
          dates: 'Dec 2021 – Present',
          location: 'San Jose, CA',
          description: [
            'Worked with Java 8, Spring Boot, and PostgreSQL. Worked with Java 8, Spring Boot, and PostgreSQL.',
            'Role: Key Results: Automated reconciliation reducing cycle time by 40%.'
          ],
          technologies_used: ['Java', 'Spring Boot']
        }
      ]
    }
  ],
  custom_sections: [
    {
      id: 'projects',
      name: 'Projects',
      items: [
        {
          title: 'Real-Time Portfolio Analyzer [Link: https://github.com/my-super-long-organization-name/super-deep-monorepo-path/tree/main/packages/portfolio-analyzer-service]',
          date: '2023',
          description: 'Interactive portfolio risk analyzer.'
        }
      ]
    }
  ],
  skills_and_interests: {
    skills: ['Java', 'Spring Boot', 'SQL']
  }
};

// 8. Missing Optional Fields
const archetype8MissingOptionalFields: any = {
  personal_info: {
    full_name: 'Jane Doe',
    contact: {
      email: 'jane@example.com'
      // phone, location, links omitted
    }
  },
  work_experience: [
    {
      company: 'Solo Ventures',
      roles: [
        {
          title: 'Consultant',
          description: ['Independent technical advisor for early stage tech startups.']
          // dates, location, technologies_used, key_results omitted
        }
      ]
    }
  ],
  education: [
    {
      institution: 'University of Michigan',
      degree: 'B.S.'
      // graduation_date, location, gpa omitted
    }
  ]
};

// -------------------------------------------------------------
// Quality Verification Suite
// -------------------------------------------------------------

async function runQualitySuite() {
  console.log('====================================================');
  console.log('RUNNING COMPREHENSIVE RESUME QUALITY VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function runTest(testName: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${testName}`);
      console.error(`    Error: ${err.message}`);
      if (err.stack) {
        console.error(`    ${err.stack.split('\n').slice(1, 4).join('\n    ')}`);
      }
    }
  }

  // TEST 1: Normalizer eliminates duplicate role/company titles & prefixes
  await runTest('Normalizer sanitizes duplicate headers and leaked prefixes', () => {
    const normalized = normalizeResumeData(archetype7LongUrlsAndDuplicates);

    assert.ok(normalized.work_experience && normalized.work_experience.length > 0);
    const exp = normalized.work_experience[0];
    const role = exp.roles[0];

    // Check that leaked prefixes "Role:" were stripped
    assert.strictEqual(role.title.includes('Role:'), false, 'Role title should not contain "Role:" prefix');
    assert.strictEqual(exp.company.includes('Role:'), false, 'Company name should not contain "Role:" prefix');

    // Check that raw URL was extracted from role title
    assert.strictEqual(role.title.includes('https://'), false, 'Role title should not contain raw URL');
    assert.ok(role.link, 'Role should have extracted link');
    assert.ok(role.link.includes('icici.bank.in'), 'Role link should be preserved in semantic link field');

    // Check that duplicated sentences in bullet description were merged
    const desc = role.description[0];
    const occurrences = (desc.match(/Worked with Java 8/g) || []).length;
    assert.strictEqual(occurrences, 1, `Bullet description should not duplicate sentences: "${desc}"`);

    // Check that custom section project link was extracted
    const project = normalized.custom_sections?.[0]?.items[0];
    assert.ok(project);
    assert.strictEqual(project.title.includes('https://'), false, 'Project title should not contain raw URL');
    assert.ok(project.link, 'Project should have extracted link');
  });

  // TEST 2: Semantic link formatting creates concise human badges
  await runTest('formatSemanticLink produces concise, non-overflowing labels', () => {
    const longAmazonUrl = 'https://projects-for-portfoliios.s3.us-east-1.amazonaws.com/production/demo/app-v2/index.html';
    const githubUrl = 'https://github.com/my-super-long-organization-name/super-deep-monorepo-path';
    const linkedinUrl = 'https://linkedin.com/in/marcusvance?utm_source=share';

    const s1 = formatSemanticLink(longAmazonUrl);
    const s2 = formatSemanticLink(githubUrl);
    const s3 = formatSemanticLink(linkedinUrl);

    assert.ok(s1.label.length <= 25, `Label too long: ${s1.label}`);
    assert.strictEqual(s2.label, 'GitHub', `Expected GitHub label, got: ${s2.label}`);
    assert.strictEqual(s3.label, 'LinkedIn', `Expected LinkedIn label, got: ${s3.label}`);
  });

  // TEST 3: Pagination Engine fits Archetype 1 (Very Short) onto 1 page
  await runTest('Pagination Engine: Archetype 1 fits onto 1 page without artificial bloat', () => {
    const normalized = normalizeResumeData(archetype1VeryShort);
    const result = calculateResumePagination(normalized);

    assert.strictEqual(result.totalPages, 1, `Expected 1 page, got ${result.totalPages}`);
    assert.ok(result.fillRatio < 0.65, `Expected short resume to fill < 65% of page, got ${result.fillRatio}`);
  });

  // TEST 4: Pagination Engine fits Archetype 2 (Normal 1-Page) onto exactly 1 page
  await runTest('Pagination Engine: Archetype 2 fits onto 1 page with balanced fill', () => {
    const normalized = normalizeResumeData(archetype2Normal1P);
    const result = calculateResumePagination(normalized);

    assert.strictEqual(result.totalPages, 1, `Expected 1 page, got ${result.totalPages}`);
    assert.ok(result.fillRatio >= 0.50 && result.fillRatio <= 1.0, `Expected fill between 50% and 100%, got ${result.fillRatio}`);
  });

  // TEST 5: Pagination Engine fits Archetype 3 (Dense 1-Page) without awkward spill
  await runTest('Pagination Engine: Archetype 3 fits onto 1 page with compact preset tuning', () => {
    const normalized = normalizeResumeData(archetype3Dense1P);
    const result = calculateResumePagination(normalized, {
      marginSize: 'compact',
      fontSize: 'compact',
      lineSpacing: 'tight',
      autoTuneToSinglePage: true
    });

    assert.strictEqual(result.totalPages, 1, `Expected 1 page after compact tuning, got ${result.totalPages}`);
  });

  // TEST 6: Pagination Engine balances Archetype 4 (Senior 2-Page) naturally
  await runTest('Pagination Engine: Archetype 4 produces balanced 2-page layout (Page 2 >= 35% fill)', () => {
    const normalized = normalizeResumeData(archetype4Senior2P);
    const result = calculateResumePagination(normalized);

    assert.strictEqual(result.totalPages, 2, `Expected 2 pages for senior resume, got ${result.totalPages}`);
    
    // Page 2 should have at least 35% content fill, never lonely 5-15% spillover
    const page2 = result.pages[1];
    assert.ok(page2.fillPercentage >= 35, `Page 2 content fill should be >= 35%, got ${page2.fillPercentage}%`);

    // Verify neither page has orphaned section headers
    for (const page of result.pages) {
      for (const section of page.sections) {
        if (section.sectionId === 'work_experience') {
          assert.ok(section.items && section.items.length > 0, `Section ${section.sectionId} on page ${page.pageNumber} must have items`);
        }
      }
    }
  });

  // TEST 7: Archetype 5 long project and role titles wrap cleanly without crashing
  await runTest('Archetype 5: Long project names and role titles normalize cleanly', () => {
    const normalized = normalizeResumeData(archetype5LongProjectNames);
    const role = normalized.work_experience![0].roles[0];
    const project = normalized.custom_sections![0].items[0];

    assert.ok(role.title.length > 50, 'Preserved substantive long title');
    assert.ok(project.title.length > 50, 'Preserved substantive project title');
    
    // Test pagination with long titles
    const result = calculateResumePagination(normalized);
    assert.strictEqual(result.totalPages, 1);
  });

  // TEST 8: Archetype 6 many skills categories formats cleanly
  await runTest('Archetype 6: Many skills categories paginate without page overflow', () => {
    const normalized = normalizeResumeData(archetype6ManySkills);
    assert.strictEqual(normalized.skills_and_interests?.skills?.length, 5);

    const result = calculateResumePagination(normalized);
    assert.strictEqual(result.totalPages, 1);
  });

  // TEST 9: Archetype 8 missing optional fields normalizes without undefined/null strings
  await runTest('Archetype 8: Missing optional fields render cleanly without artifacts', () => {
    const normalized = normalizeResumeData(archetype8MissingOptionalFields);
    
    assert.strictEqual(normalized.personal_info.contact.phone, '');
    assert.strictEqual(normalized.personal_info.contact.location, '');
    assert.strictEqual(normalized.personal_info.contact.links, '');

    const exp = normalized.work_experience![0];
    assert.strictEqual(exp.dates, '');
    assert.strictEqual(exp.roles[0].location, '');

    // Ensure pagination calculation handles missing fields without NaN
    const result = calculateResumePagination(normalized);
    assert.strictEqual(result.totalPages, 1);
    assert.ok(!isNaN(result.fillRatio), 'Fill ratio must not be NaN');
  });

  // TEST 10: DOCX Exporter generates valid document for all 8 archetypes
  await runTest('DOCX Exporter successfully compiles all 8 archetypes without errors', async () => {
    const archetypes = [
      archetype1VeryShort,
      archetype2Normal1P,
      archetype3Dense1P,
      archetype4Senior2P,
      archetype5LongProjectNames,
      archetype6ManySkills,
      archetype7LongUrlsAndDuplicates,
      archetype8MissingOptionalFields
    ];

    for (let i = 0; i < archetypes.length; i++) {
      const docxBlob = await renderResumeDocx(archetypes[i], {
        fontSize: 'standard',
        lineSpacing: 'normal',
        fontFamily: 'Calibri',
        accentColor: '#141413'
      });
      assert.ok(docxBlob, `Archetype ${i + 1} should produce a valid document buffer`);
      const docxSize = (docxBlob as any).length ?? (docxBlob as any).size;
      assert.ok(docxSize > 1000, `Archetype ${i + 1} buffer size too small: ${docxSize}`);
    }
  });

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runQualitySuite().catch((err) => {
  console.error('Fatal error during quality suite execution:', err);
  process.exit(1);
});
