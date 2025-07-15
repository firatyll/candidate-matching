import { Router } from "express";
import { 
  createCandidate, 
  getCandidates, 
  getCandidateById, 
  updateCandidate, 
  deleteCandidate 
} from "../controllers/candidate.controller";
import { validateSchema, validateParams } from "../middlewares/validation.middleware";
import { CreateCandidateSchema, UpdateCandidateSchema } from "../schemas/candidate.schema";
import { IdParamSchema } from "../schemas/common.schema";

const router = Router();

// GET /api/candidates - Get all candidates
router.get("/", getCandidates);

// POST /api/candidates - Create new candidate
router.post("/", validateSchema(CreateCandidateSchema), createCandidate);

// GET /api/candidates/:id - Get candidate by ID
router.get("/:id", validateParams(IdParamSchema), getCandidateById);

// PUT /api/candidates/:id - Update candidate
router.put("/:id", 
  validateParams(IdParamSchema),
  validateSchema(UpdateCandidateSchema),
  updateCandidate
);

// DELETE /api/candidates/:id - Delete candidate
router.delete("/:id", validateParams(IdParamSchema), deleteCandidate);

export default router;
