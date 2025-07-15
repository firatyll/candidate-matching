import { Router } from "express";
import { 
  createJobPosition, 
  getJobPositions, 
  getJobPositionById, 
  updateJobPosition, 
  deleteJobPosition 
} from "../controllers/job.controller";
import { validateSchema, validateParams } from "../middlewares/validation.middleware";
import { CreateJobPositionSchema, UpdateJobPositionSchema } from "../schemas/job.schema";
import { IdParamSchema } from "../schemas/common.schema";

const router = Router();

// GET /api/jobs - Get all job positions
router.get("/", getJobPositions);

// POST /api/jobs - Create new job position
router.post("/", validateSchema(CreateJobPositionSchema), createJobPosition);

// GET /api/jobs/:id - Get job position by ID
router.get("/:id", validateParams(IdParamSchema), getJobPositionById);

// PUT /api/jobs/:id - Update job position
router.put("/:id", 
  validateParams(IdParamSchema),
  validateSchema(UpdateJobPositionSchema),
  updateJobPosition
);

// DELETE /api/jobs/:id - Delete job position
router.delete("/:id", validateParams(IdParamSchema), deleteJobPosition);

export default router;
