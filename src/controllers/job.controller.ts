import { Request, Response } from "express";
import { PrismaClient, ExperienceLevel, EmploymentType, JobStatus, Prisma } from "../generated/prisma";
import { CreateJobPosition, UpdateJobPosition } from "../schemas/job.schema";
import { IdParam } from "../schemas/common.schema";

const prisma = new PrismaClient();

// Mapping functions for enums
const mapExperienceLevelToPrisma = (level: string): ExperienceLevel => {
  const mapping: Record<string, ExperienceLevel> = {
    'entry': 'ENTRY',
    'mid': 'MID',
    'senior': 'SENIOR',
    'lead': 'LEAD'
  };
  return mapping[level] || 'ENTRY';
};

const mapExperienceLevelFromPrisma = (level: ExperienceLevel): string => {
  const mapping: Record<ExperienceLevel, string> = {
    'ENTRY': 'entry',
    'MID': 'mid',
    'SENIOR': 'senior',
    'LEAD': 'lead'
  };
  return mapping[level] || 'entry';
};

const mapEmploymentTypeToPrisma = (type: string): EmploymentType => {
  const mapping: Record<string, EmploymentType> = {
    'full_time': 'FULL_TIME',
    'part_time': 'PART_TIME',
    'contract': 'CONTRACT',
    'internship': 'INTERNSHIP'
  };
  return mapping[type] || 'FULL_TIME';
};

const mapEmploymentTypeFromPrisma = (type: EmploymentType): string => {
  const mapping: Record<EmploymentType, string> = {
    'FULL_TIME': 'full_time',
    'PART_TIME': 'part_time',
    'CONTRACT': 'contract',
    'INTERNSHIP': 'internship'
  };
  return mapping[type] || 'full_time';
};

const mapJobStatusToPrisma = (status: string): JobStatus => {
  const mapping: Record<string, JobStatus> = {
    'active': 'ACTIVE',
    'inactive': 'INACTIVE',
    'filled': 'FILLED'
  };
  return mapping[status] || 'ACTIVE';
};

const mapJobStatusFromPrisma = (status: JobStatus): string => {
  const mapping: Record<JobStatus, string> = {
    'ACTIVE': 'active',
    'INACTIVE': 'inactive',
    'FILLED': 'filled'
  };
  return mapping[status] || 'active';
};

const transformJobPositionForResponse = (jobPosition: any) => ({
  ...jobPosition,
  experience_level: mapExperienceLevelFromPrisma(jobPosition.experience_level),
  employment_type: mapEmploymentTypeFromPrisma(jobPosition.employment_type),
  status: mapJobStatusFromPrisma(jobPosition.status)
});

export const createJobPosition = async (req: Request<{}, {}, CreateJobPosition>, res: Response) => {
  try {
    const { experience_level, employment_type, status = 'active', ...restData } = req.body;
    
    const newJobPosition = await prisma.jobPosition.create({
      data: {
        ...restData,
        experience_level: mapExperienceLevelToPrisma(experience_level),
        employment_type: mapEmploymentTypeToPrisma(employment_type),
        status: mapJobStatusToPrisma(status),
      },
    });

    const responseJobPosition = transformJobPositionForResponse(newJobPosition);

    return res.status(201).json({
      success: true,
      message: "Job position created successfully",
      data: responseJobPosition
    });
  } catch (error) {
    console.error("Error creating job position:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = error.meta?.target as string[];
        return res.status(409).json({
          success: false,
          message: `A job position with this ${field?.[0]} already exists`,
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

export const getJobPositions = async (req: Request, res: Response) => {
  try {
    const { status, location, experience_level, employment_type, remote_ok } = req.query;
    
    // Build filter object
    const where: any = {};
    
    if (status) {
      where.status = mapJobStatusToPrisma(status as string);
    }
    
    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }
    
    if (experience_level) {
      where.experience_level = mapExperienceLevelToPrisma(experience_level as string);
    }
    
    if (employment_type) {
      where.employment_type = mapEmploymentTypeToPrisma(employment_type as string);
    }
    
    if (remote_ok !== undefined) {
      where.remote_ok = remote_ok === 'true';
    }

    const jobPositions = await prisma.jobPosition.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    const responseJobPositions = jobPositions.map(transformJobPositionForResponse);
    
    return res.status(200).json({
      success: true,
      message: "Job positions fetched successfully",
      data: responseJobPositions,
      count: responseJobPositions.length
    });
  } catch (error) {
    console.error("Error fetching job positions:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getJobPositionById = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id }
    });

    if (!jobPosition) {
      return res.status(404).json({
        success: false,
        message: "Job position not found"
      });
    }

    const responseJobPosition = transformJobPositionForResponse(jobPosition);

    return res.status(200).json({
      success: true,
      message: "Job position fetched successfully",
      data: responseJobPosition
    });
  } catch (error) {
    console.error("Error fetching job position:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const updateJobPosition = async (req: Request<IdParam, {}, UpdateJobPosition>, res: Response) => {
  try {
    const { id } = req.params;
    const { experience_level, employment_type, status, ...restData } = req.body;
    
    // Check if job position exists
    const existingJobPosition = await prisma.jobPosition.findUnique({
      where: { id }
    });

    if (!existingJobPosition) {
      return res.status(404).json({
        success: false,
        message: "Job position not found"
      });
    }

    // Prepare update data
    const updateData: any = { ...restData };
    
    if (experience_level) {
      updateData.experience_level = mapExperienceLevelToPrisma(experience_level);
    }
    
    if (employment_type) {
      updateData.employment_type = mapEmploymentTypeToPrisma(employment_type);
    }
    
    if (status) {
      updateData.status = mapJobStatusToPrisma(status);
    }

    const updatedJobPosition = await prisma.jobPosition.update({
      where: { id },
      data: updateData
    });

    const responseJobPosition = transformJobPositionForResponse(updatedJobPosition);

    return res.status(200).json({
      success: true,
      message: "Job position updated successfully",
      data: responseJobPosition
    });
  } catch (error) {
    console.error("Error updating job position:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = error.meta?.target as string[];
        return res.status(409).json({
          success: false,
          message: `A job position with this ${field?.[0]} already exists`,
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
          message: "Job position not found"
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

export const deleteJobPosition = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if job position exists
    const existingJobPosition = await prisma.jobPosition.findUnique({
      where: { id }
    });

    if (!existingJobPosition) {
      return res.status(404).json({
        success: false,
        message: "Job position not found"
      });
    }

    await prisma.jobPosition.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Job position deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job position:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Job position not found"
        });
      }
      
      // Check for foreign key constraint (if there are related job applications)
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: "Cannot delete job position because it has related job applications"
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
