import { z } from 'zod';

// Base Job Application schema
const BaseJobApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  candidate_id: z.string().uuid('Invalid candidate ID format'),
  job_position_id: z.string().uuid('Invalid job position ID format'),
  status: z.enum(['pending', 'reviewed', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn']).default('pending'),
  cover_letter: z.string().min(10, 'Cover letter must be at least 10 characters').optional(),
  applied_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const JobApplicationSchema = BaseJobApplicationSchema;

export const CreateJobApplicationSchema = BaseJobApplicationSchema.omit({
  id: true,
  applied_at: true,
  updated_at: true
});

export const UpdateJobApplicationSchema = BaseJobApplicationSchema.partial().omit({
  id: true,
  candidate_id: true,
  job_position_id: true,
  applied_at: true,
  updated_at: true
});

// Schema for candidate applying to a job
// Note: In production, candidate_id would typically come from authentication context
// For now, it's included in the request body for testing purposes
export const ApplyToJobSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID format'),
  job_position_id: z.string().uuid('Invalid job position ID format'),
  cover_letter: z.string().min(10, 'Cover letter must be at least 10 characters').optional()
});

// Schema for updating application status (HR/Admin use)
export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn'])
});

// Query schema for filtering applications
export const ApplicationQuerySchema = z.object({
  candidate_id: z.string().uuid().optional(),
  job_position_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'reviewed', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn']).optional()
}).partial();

export type JobApplication = z.infer<typeof JobApplicationSchema>;
export type CreateJobApplication = z.infer<typeof CreateJobApplicationSchema>;
export type UpdateJobApplication = z.infer<typeof UpdateJobApplicationSchema>;
export type ApplyToJob = z.infer<typeof ApplyToJobSchema>;
export type UpdateApplicationStatus = z.infer<typeof UpdateApplicationStatusSchema>;
export type ApplicationQuery = z.infer<typeof ApplicationQuerySchema>;
