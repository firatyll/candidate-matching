import { Router } from "express";
import { 
  createJobApplication,
  applyToJob,
  getJobApplications, 
  getJobApplicationById, 
  updateJobApplication,
  updateApplicationStatus,
  withdrawApplication,
  deleteJobApplication,
  getCandidateApplications,
  getJobPositionApplications
} from "../controllers/application.controller";
import { validateSchema, validateParams, validateQuery } from "../middlewares/validation.middleware";
import { 
  CreateJobApplicationSchema, 
  UpdateJobApplicationSchema,
  ApplyToJobSchema,
  UpdateApplicationStatusSchema,
  ApplicationQuerySchema
} from "../schemas/application.schema";
import { IdParamSchema, CandidateIdParamSchema, JobIdParamSchema } from "../schemas/common.schema";

const router = Router();

// GET /api/applications - Get all job applications with filtering
router.get("/", 
  getJobApplications
);

// POST /api/applications - Create new job application (admin/system use)
router.post("/", 
  validateSchema(CreateJobApplicationSchema), 
  createJobApplication
);

// POST /api/applications/apply - Apply to a job (candidate use)
router.post("/apply", 
  validateSchema(ApplyToJobSchema), 
  applyToJob
);

// GET /api/applications/:id - Get job application by ID
router.get("/:id", 
  validateParams(IdParamSchema), 
  getJobApplicationById
);

// PUT /api/applications/:id - Update job application
router.put("/:id", 
  validateParams(IdParamSchema),
  validateSchema(UpdateJobApplicationSchema),
  updateJobApplication
);

// PATCH /api/applications/:id/status - Update application status (HR/Admin)
router.patch("/:id/status", 
  validateParams(IdParamSchema),
  validateSchema(UpdateApplicationStatusSchema),
  updateApplicationStatus
);

// PATCH /api/applications/:id/withdraw - Withdraw application (candidate)
router.patch("/:id/withdraw", 
  validateParams(IdParamSchema),
  withdrawApplication
);

// DELETE /api/applications/:id - Delete job application
router.delete("/:id", 
  validateParams(IdParamSchema), 
  deleteJobApplication
);

// GET /api/applications/candidate/:candidateId - Get all applications for a candidate
router.get("/candidate/:candidateId", 
  validateParams(CandidateIdParamSchema),
  getCandidateApplications
);

// GET /api/applications/job/:jobId - Get all applications for a job position
router.get("/job/:jobId", 
  validateParams(JobIdParamSchema),
  getJobPositionApplications
);

export default router;
