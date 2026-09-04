import { z } from 'zod';

export const ContactSchema = z.object({
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  links: z.string()
});

export const PersonalInfoSchema = z.object({
  full_name: z.string(),
  contact: ContactSchema
});

export const RoleSchema = z.object({
  title: z.string(),
  location: z.string(),
  dates: z.optional(z.string()),
  description: z.array(z.string()),
  technologies_used: z.optional(z.array(z.string())),
  key_results: z.optional(z.array(z.string()))
});

export const WorkExperienceSchema = z.object({
  company: z.string(),
  dates: z.string(),
  roles: z.array(RoleSchema)
});

export const EducationSchema = z.object({
  university: z.string(),
  graduation_date: z.string(),
  degree: z.string(),
  major: z.string(),
  location: z.string(),
  honors_and_awards: z.optional(z.array(z.string())),
  activities: z.optional(z.array(z.string()))
});

export const SkillsAndInterestsSchema = z.object({
  certifications: z.optional(z.array(z.string())),
  technologies: z.optional(z.array(z.string())),
  skills: z.optional(z.array(z.string())),
  interests: z.optional(z.array(z.string()))
});

export const CustomSectionItemSchema = z.object({
  title: z.string(),
  subtitle: z.optional(z.string()),
  dates: z.optional(z.string()),
  location: z.optional(z.string()),
  description: z.array(z.string())
});

export const CustomSectionSchema = z.object({
  id: z.string(),
  section_title: z.string(),
  items: z.array(CustomSectionItemSchema)
});

export const ResumeDataSchema = z.object({
  personal_info: PersonalInfoSchema,
  work_experience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills_and_interests: SkillsAndInterestsSchema,
  custom_sections: z.optional(z.array(CustomSectionSchema))
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type SkillsAndInterests = z.infer<typeof SkillsAndInterestsSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type CustomSectionItem = z.infer<typeof CustomSectionItemSchema>;
export type CustomSection = z.infer<typeof CustomSectionSchema>;

function cleanSchemaForGemini(schema: any): any {
  if (typeof schema !== 'object' || schema === null) return schema;
  if (Array.isArray(schema)) return schema.map(cleanSchemaForGemini);
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === '$schema' || key === 'additionalProperties') continue;
    cleaned[key] = cleanSchemaForGemini(value);
  }
  return cleaned;
}

export function getResumeJsonSchema() {
  // @ts-ignore
  const rawSchema = z.toJSONSchema(ResumeDataSchema);
  return cleanSchemaForGemini(rawSchema);
}
