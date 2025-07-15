import { Router } from 'express';
import { 
  findMatchingJobs,
  findMatchingCandidates,
  syncCandidate,
  syncJob,
  syncData,
  getMatchingHealth
} from '../controllers/matching.controller';
import { validateSchema, validateParams } from '../middlewares/validation.middleware';
import { IdParamSchema } from '../schemas/common.schema';
import { z } from 'zod';

const router = Router();

// Sync data schema
const SyncDataSchema = z.object({
  type: z.enum(['candidates', 'jobs', 'all'])
});

// Health check
router.get('/health', getMatchingHealth);

// Find matching jobs for a candidate
router.get('/candidates/:id/jobs', 
  validateParams(IdParamSchema),
  findMatchingJobs
);

// Find matching candidates for a job
router.get('/jobs/:id/candidates', 
  validateParams(IdParamSchema),
  findMatchingCandidates
);

// Sync individual candidate
router.post('/sync/candidates/:id',
  validateParams(IdParamSchema),
  syncCandidate
);

// Sync individual job
router.post('/sync/jobs/:id',
  validateParams(IdParamSchema),
  syncJob
);

// Bulk sync data
router.post('/sync',
  validateSchema(SyncDataSchema),
  syncData
);

export default router;
