import { Router } from "express";
import { createCandidate, getCandidates } from "../controllers/candidate.controller";
import { validateSchema } from "../middlewares/validation.middleware";
import { CreateCandidateSchema } from "../schemas/candidate.schema";

const router = Router();

router.get("/", getCandidates);
router.post("/", validateSchema(CreateCandidateSchema), createCandidate);

export default router;
