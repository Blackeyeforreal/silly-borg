import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, TabStopPosition, BorderStyle } from 'docx';
import { ResumeData } from '@/lib/schema';

import { renderResumeDocx } from '@/lib/docx/renderer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resumeData: ResumeData = body.resumeData || body.resume;
    const templateSettings = body.templateSettings;

    if (!resumeData) {
      return NextResponse.json({ error: 'Missing resume data' }, { status: 400 });
    }

    const candidateName = (resumeData.personal_info?.full_name || 'Candidate')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const roleTitle = (resumeData.work_experience?.[0]?.roles?.[0]?.title || 'Software_Engineer')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${candidateName}_resume_${roleTitle}.docx`;

    try {
      const templateBuffer = await renderResumeDocx(resumeData, templateSettings);
      return new NextResponse(new Uint8Array(templateBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (tmplErr) {
      console.warn('Template population failed, falling back to programmatic docx generation:', tmplErr);
    }

    const children = [];

    // Header: Name
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: resumeData.personal_info?.full_name || '',
            bold: true,
            size: 48, // 24pt
            font: 'Garamond',
          }),
        ],
      })
    );

    // Contact info
    const contactParts = [
      resumeData.personal_info?.contact?.email,
      resumeData.personal_info?.contact?.phone,
      resumeData.personal_info?.contact?.location,
      resumeData.personal_info?.contact?.links
    ].filter(Boolean);

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 200 },
        children: [
          new TextRun({
            text: contactParts.join(' | '),
            size: 32, // 16pt
            font: 'Garamond',
          }),
        ],
      })
    );

    // Work Experience Section
    if (resumeData.work_experience && resumeData.work_experience.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'WORK EXPERIENCE', bold: true, size: 24, font: 'Garamond' })
          ],
          border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { before: 200, after: 100 }
        })
      );

      for (const exp of resumeData.work_experience) {
        children.push(
          new Paragraph({
            tabStops: [
              { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
            ],
            children: [
              new TextRun({ text: exp.company, bold: true, font: 'Garamond' }),
              new TextRun({ text: '\t' + (exp.dates || ''), font: 'Garamond' }),
            ],
          })
        );
        
        if (exp.roles) {
          for (const role of exp.roles) {
            children.push(
              new Paragraph({
                tabStops: [
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                children: [
                  new TextRun({ text: role.title, italics: true, font: 'Garamond' }),
                  new TextRun({ text: '\t' + (role.location || ''), italics: true, font: 'Garamond' }),
                ],
              })
            );

            if (role.description) {
              for (const desc of role.description) {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: desc, font: 'Garamond' })
                    ],
                    bullet: { level: 0 },
                  })
                );
              }
            }

            if (role.technologies_used && role.technologies_used.length > 0) {
              children.push(
                new Paragraph({
                  bullet: { level: 1 },
                  children: [
                    new TextRun({ text: 'Technologies: ', bold: true, font: 'Garamond' }),
                    new TextRun({ text: role.technologies_used.join(', '), font: 'Garamond' }),
                  ]
                })
              );
            }

            if (role.key_results && role.key_results.length > 0) {
              children.push(
                new Paragraph({
                  bullet: { level: 1 },
                  children: [
                    new TextRun({ text: 'Key Results: ', bold: true, font: 'Garamond' }),
                    new TextRun({ text: role.key_results.join('; '), font: 'Garamond' }),
                  ]
                })
              );
            }
          }
        }
      }
    }

    // Education Section
    if (resumeData.education && resumeData.education.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'EDUCATION', bold: true, size: 24, font: 'Garamond' })
          ],
          border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { before: 200, after: 100 }
        })
      );

      for (const edu of resumeData.education) {
        children.push(
          new Paragraph({
            tabStops: [
              { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
            ],
            children: [
              new TextRun({ text: edu.university, bold: true, font: 'Garamond' }),
              new TextRun({ text: '\t' + (edu.graduation_date || ''), font: 'Garamond' }),
            ],
          })
        );
        children.push(
          new Paragraph({
            tabStops: [
              { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
            ],
            children: [
              new TextRun({ text: (edu.degree ? edu.degree + ' in ' : '') + (edu.major || ''), italics: true, font: 'Garamond' }),
              new TextRun({ text: '\t' + (edu.location || ''), italics: true, font: 'Garamond' }),
            ],
          })
        );
        
        if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Honors: ${edu.honors_and_awards.join(', ')}`, font: 'Garamond' }),
              ]
            })
          );
        }
        
        if (edu.activities && edu.activities.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Activities: ${edu.activities.join(', ')}`, font: 'Garamond' }),
              ]
            })
          );
        }
      }
    }

    // Skills & Interests
    if (resumeData.skills_and_interests) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'CERTIFICATIONS, SKILLS & INTERESTS', bold: true, size: 24, font: 'Garamond' })
          ],
          border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { before: 200, after: 100 }
        })
      );

      const skills = resumeData.skills_and_interests;
      const categories = [
        { label: 'Certifications', items: skills.certifications },
        { label: 'Technologies', items: skills.technologies },
        { label: 'Skills', items: skills.skills },
        { label: 'Interests', items: skills.interests },
      ];

      for (const category of categories) {
        if (category.items && category.items.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${category.label}: `, bold: true, font: 'Garamond' }),
                new TextRun({ text: category.items.join(', '), font: 'Garamond' }),
              ],
              bullet: { level: 0 },
            })
          );
        }
      }
    }

    const doc = new Document({
      creator: 'AI Resume Builder',
      title: 'Resume',
      description: 'Generated Resume',
      styles: {
        default: {
          document: {
            run: { font: 'Garamond' }
          }
        }
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 180, // 0.125in
                bottom: 414, // ~0.29in
                left: 720, // 0.5in
                right: 720, // 0.5in
              },
            },
          },
          children,
        },
      ],
    });

    const b64string = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64string, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="resume.docx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate DOCX' }, { status: 500 });
  }
}
