import { z } from 'zod';

export const CoverLetterDataSchema = z.object({
  recipient_name: z.string().default('Hiring Team'),
  recipient_title: z.string().optional().default('Hiring Manager'),
  company_name: z.string().default('Target Company'),
  job_title: z.string().default('Candidate Position'),
  date: z.string().default('October 15, 2024'),
  opening_paragraph: z.string().default(''),
  body_paragraphs: z.array(z.string()).default([]),
  closing_paragraph: z.string().default(''),
  sign_off: z.string().default('Sincerely,')
});

export type CoverLetterData = z.infer<typeof CoverLetterDataSchema>;

export function getCoverLetterJsonSchema() {
  return {
    type: 'object',
    properties: {
      recipient_name: { type: 'string', description: 'Name of the recipient or Hiring Team' },
      recipient_title: { type: 'string', description: 'Title such as Hiring Manager or Department Lead' },
      company_name: { type: 'string', description: 'Name of the hiring company mentioned in the job description' },
      job_title: { type: 'string', description: 'Title of the position being applied for' },
      date: { type: 'string', description: 'Current formatted date, e.g. October 15, 2024' },
      opening_paragraph: { type: 'string', description: 'Enthusiastic 2-3 sentence introduction stating the role, why you are drawn to the company, and your immediate value proposition.' },
      body_paragraphs: { 
        type: 'array', 
        items: { type: 'string' },
        description: '2 focused paragraphs connecting your specific past accomplishments and technical skills to the core responsibilities of this job.' 
      },
      closing_paragraph: { type: 'string', description: 'Polite concluding sentence expressing interest in discussing how you can contribute, thanking the reader for their consideration.' },
      sign_off: { type: 'string', description: 'Formal sign-off phrase like Sincerely, or Best regards,' }
    },
    required: ['company_name', 'job_title', 'opening_paragraph', 'body_paragraphs', 'closing_paragraph']
  };
}
