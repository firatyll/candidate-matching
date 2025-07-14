import { Request, Response } from "express";
import { PrismaClient, CandidateAvailability, Prisma } from "../generated/prisma";
import { CreateCandidate, UpdateCandidate } from "../schemas/candidate.schema";
import { IdParam } from "../schemas/common.schema";

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

export const getCandidateById = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const responseCandidate = {
      ...candidate,
      availability: mapAvailabilityFromPrisma(candidate.availability)
    };

    return res.status(200).json({
      success: true,
      message: "Candidate fetched successfully",
      data: responseCandidate
    });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const updateCandidate = async (req: Request<IdParam, {}, UpdateCandidate>, res: Response) => {
  try {
    const { id } = req.params;
    const { availability, ...restData } = req.body;
    
    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    // Check for email uniqueness if email is being updated
    if (restData.email && restData.email !== existingCandidate.email) {
      const candidateWithSameEmail = await prisma.candidate.findUnique({
        where: { email: restData.email }
      });

      if (candidateWithSameEmail) {
        return res.status(409).json({
          success: false,
          message: "A candidate with this email already exists",
          error: {
            field: "email",
            value: restData.email
          }
        });
      }
    }

    // Prepare update data
    const updateData: any = { ...restData };
    if (availability) {
      updateData.availability = mapAvailabilityToPrisma(availability);
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: updateData
    });

    const responseCandidate = {
      ...updatedCandidate,
      availability: mapAvailabilityFromPrisma(updatedCandidate.availability)
    };

    return res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: responseCandidate
    });
  } catch (error) {
    console.error("Error updating candidate:", error);
    
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
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Candidate not found"
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

export const deleteCandidate = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    await prisma.candidate.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Candidate not found"
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
