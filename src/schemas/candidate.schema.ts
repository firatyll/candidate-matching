import { z } from 'zod';

// Candidate şeması
export const CandidateSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  experience: z.number().min(0, 'Experience cannot be negative'),
  location: z.string().min(2, 'Location is required'),
  availability: z.enum(['immediate', 'within_week', 'within_month', 'not_available']),
  salary_expectation: z.number().min(0, 'Salary expectation cannot be negative').optional(),
  resume_url: z.string().url('Invalid resume URL').optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const CreateCandidateSchema = CandidateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateCandidateSchema = CandidateSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

export type Candidate = z.infer<typeof CandidateSchema>;
export type CreateCandidate = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidate = z.infer<typeof UpdateCandidateSchema>;
