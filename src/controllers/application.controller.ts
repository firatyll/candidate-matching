import { Request, Response } from "express";
import { PrismaClient, ApplicationStatus, Prisma } from "../generated/prisma";
import { CreateJobApplication, UpdateJobApplication, ApplyToJob, UpdateApplicationStatus, ApplicationQuery } from "../schemas/application.schema";
import { IdParam, CandidateIdParam, JobIdParam } from "../schemas/common.schema";

const prisma = new PrismaClient();

// Mapping functions for application status enum
const mapApplicationStatusToPrisma = (status: string): ApplicationStatus => {
  const mapping: Record<string, ApplicationStatus> = {
    'pending': 'PENDING',
    'reviewed': 'REVIEWED',
    'interviewed': 'INTERVIEWED',
    'offered': 'OFFERED',
    'accepted': 'ACCEPTED',
    'rejected': 'REJECTED',
    'withdrawn': 'WITHDRAWN'
  };
  return mapping[status] || 'PENDING';
};

const mapApplicationStatusFromPrisma = (status: ApplicationStatus): string => {
  const mapping: Record<ApplicationStatus, string> = {
    'PENDING': 'pending',
    'REVIEWED': 'reviewed',
    'INTERVIEWED': 'interviewed',
    'OFFERED': 'offered',
    'ACCEPTED': 'accepted',
    'REJECTED': 'rejected',
    'WITHDRAWN': 'withdrawn'
  };
  return mapping[status] || 'pending';
};

const transformApplicationForResponse = (application: any) => ({
  ...application,
  status: mapApplicationStatusFromPrisma(application.status)
});

// Create a new job application
export const createJobApplication = async (req: Request<{}, {}, CreateJobApplication>, res: Response) => {
  try {
    const { candidate_id, job_position_id, status = 'pending', cover_letter } = req.body;
    
    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id }
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }
    
    // Check if job position exists and is active
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: job_position_id }
    });
    
    if (!jobPosition) {
      return res.status(404).json({
        success: false,
        message: "Job position not found"
      });
    }
    
    if (jobPosition.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: "Cannot apply to inactive or filled job positions"
      });
    }
    
    // Check if application already exists
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        candidate_id_job_position_id: {
          candidate_id,
          job_position_id
        }
      }
    });
    
    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "Application already exists for this candidate and job position"
      });
    }
    
    const newApplication = await prisma.jobApplication.create({
      data: {
        candidate_id,
        job_position_id,
        status: mapApplicationStatusToPrisma(status),
        cover_letter
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        job_position: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      }
    });

    const responseApplication = transformApplicationForResponse(newApplication);

    return res.status(201).json({
      success: true,
      message: "Job application created successfully",
      data: responseApplication
    });
  } catch (error) {
    console.error("Error creating job application:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: "Application already exists for this candidate and job position"
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

// Apply to a job (simplified endpoint for candidates)
export const applyToJob = async (req: Request<{}, {}, ApplyToJob>, res: Response) => {
  try {
    const { candidate_id, job_position_id, cover_letter } = req.body;
    
    // Use the createJobApplication logic
    const applicationData: CreateJobApplication = {
      candidate_id,
      job_position_id,
      cover_letter,
      status: 'pending'
    };
    
    // Reuse the creation logic
    req.body = applicationData;
    return createJobApplication(req as Request<{}, {}, CreateJobApplication>, res);
  } catch (error) {
    console.error("Error applying to job:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Get all job applications with filtering
export const getJobApplications = async (req: Request<{}, {}, {}, any>, res: Response) => {
  try {
    const { candidate_id, job_position_id, status, applied_after, applied_before } = req.query;
    
    // Build filter object
    const where: any = {};
    
    if (candidate_id) {
      where.candidate_id = candidate_id;
    }
    
    if (job_position_id) {
      where.job_position_id = job_position_id;
    }
    
    if (status) {
      where.status = mapApplicationStatusToPrisma(status);
    }
    
    if (applied_after || applied_before) {
      where.applied_at = {};
      if (applied_after) {
        where.applied_at.gte = new Date(applied_after);
      }
      if (applied_before) {
        where.applied_at.lte = new Date(applied_before);
      }
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            skills: true,
            experience: true
          }
        },
        job_position: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            employment_type: true
          }
        }
      },
      orderBy: {
        applied_at: 'desc'
      }
    });
    
    const responseApplications = applications.map(transformApplicationForResponse);
    
    return res.status(200).json({
      success: true,
      message: "Job applications fetched successfully",
      data: responseApplications,
      count: responseApplications.length
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Get job application by ID
export const getJobApplicationById = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            skills: true,
            experience: true,
            location: true,
            availability: true,
            salary_expectation: true,
            resume_url: true
          }
        },
        job_position: {
          select: {
            id: true,
            title: true,
            company: true,
            description: true,
            required_skills: true,
            preferred_skills: true,
            experience_level: true,
            location: true,
            remote_ok: true,
            salary_min: true,
            salary_max: true,
            employment_type: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Job application not found"
      });
    }

    const responseApplication = transformApplicationForResponse(application);

    return res.status(200).json({
      success: true,
      message: "Job application fetched successfully",
      data: responseApplication
    });
  } catch (error) {
    console.error("Error fetching job application:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Update job application
export const updateJobApplication = async (req: Request<IdParam, {}, UpdateJobApplication>, res: Response) => {
  try {
    const { id } = req.params;
    const { status, cover_letter } = req.body;
    
    // Check if application exists
    const existingApplication = await prisma.jobApplication.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: "Job application not found"
      });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = mapApplicationStatusToPrisma(status);
    }
    
    if (cover_letter !== undefined) {
      updateData.cover_letter = cover_letter;
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        job_position: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      }
    });

    const responseApplication = transformApplicationForResponse(updatedApplication);

    return res.status(200).json({
      success: true,
      message: "Job application updated successfully",
      data: responseApplication
    });
  } catch (error) {
    console.error("Error updating job application:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Job application not found"
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

// Update application status (for HR/Admin)
export const updateApplicationStatus = async (req: Request<IdParam, {}, UpdateApplicationStatus>, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: {
        status: mapApplicationStatusToPrisma(status)
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        job_position: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      }
    });

    const responseApplication = transformApplicationForResponse(updatedApplication);

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: responseApplication
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Job application not found"
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

// Withdraw application (for candidates)
export const withdrawApplication = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    const application = await prisma.jobApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Job application not found"
      });
    }

    // Check if application can be withdrawn
    if (application.status === 'ACCEPTED' || application.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw an application that has been accepted or rejected"
      });
    }

    const withdrawnApplication = await prisma.jobApplication.update({
      where: { id },
      data: {
        status: 'WITHDRAWN'
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        job_position: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      }
    });

    const responseApplication = transformApplicationForResponse(withdrawnApplication);

    return res.status(200).json({
      success: true,
      message: "Job application withdrawn successfully",
      data: responseApplication
    });
  } catch (error) {
    console.error("Error withdrawing job application:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Job application not found"
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

// Delete job application
export const deleteJobApplication = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if application exists
    const existingApplication = await prisma.jobApplication.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: "Job application not found"
      });
    }

    await prisma.jobApplication.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Job application deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job application:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Job application not found"
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

// Get applications for a specific candidate
export const getCandidateApplications = async (req: Request<CandidateIdParam>, res: Response) => {
  try {
    const { candidateId } = req.params;
    
    const applications = await prisma.jobApplication.findMany({
      where: {
        candidate_id: candidateId
      },
      include: {
        job_position: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            employment_type: true,
            salary_min: true,
            salary_max: true
          }
        }
      },
      orderBy: {
        applied_at: 'desc'
      }
    });
    
    const responseApplications = applications.map(transformApplicationForResponse);
    
    return res.status(200).json({
      success: true,
      message: "Candidate applications fetched successfully",
      data: responseApplications,
      count: responseApplications.length
    });
  } catch (error) {
    console.error("Error fetching candidate applications:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Get applications for a specific job position
export const getJobPositionApplications = async (req: Request<JobIdParam>, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const applications = await prisma.jobApplication.findMany({
      where: {
        job_position_id: jobId
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            skills: true,
            experience: true,
            location: true,
            availability: true,
            salary_expectation: true
          }
        }
      },
      orderBy: {
        applied_at: 'desc'
      }
    });
    
    const responseApplications = applications.map(transformApplicationForResponse);
    
    return res.status(200).json({
      success: true,
      message: "Job position applications fetched successfully",
      data: responseApplications,
      count: responseApplications.length
    });
  } catch (error) {
    console.error("Error fetching job position applications:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
