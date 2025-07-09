import { z } from 'zod';

// Base Job Position şeması
const BaseJobPositionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  required_skills: z.array(z.string()).min(1, 'At least one required skill is needed'),
  preferred_skills: z.array(z.string()).optional(),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead']),
  location: z.string().min(2, 'Location is required'),
  remote_ok: z.boolean().default(false),
  salary_min: z.number().min(0, 'Minimum salary cannot be negative').optional(),
  salary_max: z.number().min(0, 'Maximum salary cannot be negative').optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  status: z.enum(['active', 'inactive', 'filled']).default('active'),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const JobPositionSchema = BaseJobPositionSchema.refine(data => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salary_max"]
});

export const CreateJobPositionSchema = BaseJobPositionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).refine(data => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salary_max"]
});

export const UpdateJobPositionSchema = BaseJobPositionSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
}).refine(data => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salary_max"]
});

export type JobPosition = z.infer<typeof JobPositionSchema>;
export type CreateJobPosition = z.infer<typeof CreateJobPositionSchema>;
export type UpdateJobPosition = z.infer<typeof UpdateJobPositionSchema>;
