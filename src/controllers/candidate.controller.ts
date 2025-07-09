import { Request, Response } from "express";
import { PrismaClient, CandidateAvailability, Prisma } from "../generated/prisma";
import { CreateCandidate } from "../schemas/candidate.schema";

const prisma = new PrismaClient();

const mapAvailabilityToPrisma = (availability: string): CandidateAvailability => {
  const mapping: Record<string, CandidateAvailability> = {
    'immediate': 'IMMEDIATE',
    'within_week': 'WITHIN_WEEK',
    'within_month': 'WITHIN_MONTH',
    'not_available': 'NOT_AVAILABLE'
  };
  return mapping[availability] || 'IMMEDIATE';
};

const mapAvailabilityFromPrisma = (availability: CandidateAvailability): string => {
  const mapping: Record<CandidateAvailability, string> = {
    'IMMEDIATE': 'immediate',
    'WITHIN_WEEK': 'within_week',
    'WITHIN_MONTH': 'within_month',
    'NOT_AVAILABLE': 'not_available'
  };
  return mapping[availability] || 'immediate';
};

export const createCandidate = async (req: Request<{}, {}, CreateCandidate>, res: Response) => {
  try {
    const { availability, ...restData } = req.body;
    
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email: restData.email }
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: "A candidate with this email already exists",
        error: {
          field: "email",
          value: restData.email
        }
      });
    }
    
    const newCandidate = await prisma.candidate.create({
      data: {
        ...restData,
        availability: mapAvailabilityToPrisma(availability),
      },
    });

    const responseCandidate = {
      ...newCandidate,
      availability: mapAvailabilityFromPrisma(newCandidate.availability)
    };

    return res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: responseCandidate
    });
  } catch (error) {
    console.error("Error creating candidate:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = error.meta?.target as string[];
        return res.status(409).json({
          success: false,
          message: `A candidate with this ${field?.[0]} already exists`,
          error: {
            code: error.code,
            field: field?.[0],
            message: "Unique constraint violation"
          }
        });
      }
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    
    const responseCandidates = candidates.map(candidate => ({
      ...candidate,
      availability: mapAvailabilityFromPrisma(candidate.availability)
    }));
    
    return res.status(200).json({
      success: true,
      message: "Candidates fetched successfully",
      data: responseCandidates,
      count: responseCandidates.length
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
