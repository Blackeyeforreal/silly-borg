import { ResumeData } from './schema';

export const sampleResumeData: ResumeData = {
  personal_info: {
    full_name: 'Devang Srivastava',
    contact: {
      email: 'devang.srivastava@email.com',
      phone: '+1 (555) 345-6789',
      location: 'New York, NY',
      links: 'https://linkedin.com/in/devangsrivastava | https://github.com/devang'
    }
  },
  work_experience: [
    {
      company: 'CloudScale Technologies',
      dates: 'Jan 2022 – Present',
      roles: [
        {
          title: 'Senior Full-Stack Engineer',
          location: 'New York, NY',
          description: [
            'Architected and delivered high-concurrency microservices processing 3.5M+ requests per day with 99.99% uptime.',
            'Engineered real-time dashboard workflows utilizing Next.js, TypeScript, and Redis caching, cutting latency by 45%.'
          ],
          technologies_used: [
            'TypeScript',
            'Next.js',
            'Node.js',
            'PostgreSQL',
            'Docker',
            'Redis',
            'Tailwind CSS'
          ]
        }
      ]
    },
    {
      company: 'DataStream Analytics',
      dates: 'Jun 2019 – Dec 2021',
      roles: [
        {
          title: 'Full-Stack Software Engineer',
          location: 'San Francisco, CA',
          description: [
            'Developed automated ETL ingestion pipelines and customer-facing analytics dashboards for 50+ enterprise accounts.',
            'Restructured database schemas and query indexes in PostgreSQL, reducing average query execution times from 850ms to 95ms.'
          ],
          key_results: [
            'Boosted enterprise reporting throughput by 40% and lowered server resource consumption by 28%.'
          ]
        }
      ]
    },
    {
      company: 'Apex Digital Labs',
      dates: 'Jan 2018 – May 2019',
      roles: [
        {
          title: 'Software Developer',
          location: 'Remote',
          description: [
            'Collaborated in cross-functional agile squads building responsive web applications and RESTful APIs.',
            'Implemented comprehensive end-to-end automated testing suites with Jest and Playwright, elevating test coverage to 92%.'
          ]
        }
      ]
    },
    {
      company: 'Nexus Software Systems',
      dates: 'Jul 2016 – Dec 2017',
      roles: [
        {
          title: 'Associate Engineer (Promotion)',
          dates: 'Jan 2017 – Dec 2017',
          location: 'Austin, TX',
          description: [
            'Promoted to oversee core UI architecture and API integration layers for cloud management consoles.',
            'Spearheaded transition from legacy monolith views to modular component architecture.'
          ]
        },
        {
          title: 'Junior Web Developer',
          dates: 'Jul 2016 – Dec 2016',
          location: 'Austin, TX',
          description: [
            'Developed accessible UI components and maintained front-facing marketing and onboarding workflows.'
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
      honors_and_awards: [
        'Dean\'s List (All Semesters)',
        'Summa Cum Laude (GPA: 3.92/4.0)'
      ],
      activities: [
        'ACM Student Chapter Vice President',
        'Lead Organizer of TartanHacks 2015 & 2016'
      ]
    }
  ],
  skills_and_interests: {
    certifications: [
      'AWS Certified Solutions Architect – Associate',
      'Google Cloud Certified Professional Cloud Developer'
    ],
    technologies: [
      'TypeScript',
      'JavaScript',
      'React',
      'Next.js',
      'Node.js',
      'Python',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'Git'
    ],
    skills: [
      'Full-Stack Web Development',
      'Distributed Systems Architecture',
      'RESTful & GraphQL API Design',
      'Microservices Orchestration',
      'Performance Optimization'
    ],
    interests: [
      'Open Source Software',
      'Distributed Databases',
      'Competitive Chess',
      'Marathon Running'
    ]
  }
};
