import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

export const CandidateIdParamSchema = z.object({
  candidateId: z.string().uuid('Invalid candidate ID format')
});

export const JobIdParamSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format')
});

export const PaginationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val)).refine(val => val > 0, 'Page must be greater than 0').optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').optional(),
  skills: z.string().transform(val => val.split(',')).optional(),
  location: z.string().optional(),
  experience_min: z.string().transform(val => parseInt(val)).optional(),
  experience_max: z.string().transform(val => parseInt(val)).optional()
}).merge(PaginationQuerySchema);

export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  message: z.string(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string()
  })).optional()
});

export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
  data: z.any().optional()
});

export type IdParam = z.infer<typeof IdParamSchema>;
export type CandidateIdParam = z.infer<typeof CandidateIdParamSchema>;
export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
