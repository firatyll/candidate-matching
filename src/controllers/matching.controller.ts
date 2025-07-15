import { Request, Response } from 'express';
import { vectorMatchingService } from '../services/matching/vector-matching.service';
import { IdParam } from '../schemas/common.schema';

interface MatchingJobsQuery {
  limit?: string;
  location?: string;
  remote_ok?: string;
  experience_level?: string;
  employment_type?: string;
  salary_min?: string;
  salary_max?: string;
}

interface MatchingCandidatesQuery {
  limit?: string;
  location?: string;
  availability?: string;
  min_experience?: string;
  max_experience?: string;
  max_salary_expectation?: string;
}

interface SyncRequest {
  type: 'candidates' | 'jobs' | 'all';
}

/**
 * Find matching jobs for a candidate
 */
export const findMatchingJobs = async (
  req: Request<IdParam, {}, {}, MatchingJobsQuery>, 
  res: Response
) => {
  try {
    const { id: candidateId } = req.params;
    const { 
      limit = '10',
      location,
      remote_ok,
      experience_level,
      employment_type,
      salary_min,
      salary_max
    } = req.query;

    // Initialize vector matching service if not already done
    try {
      await vectorMatchingService.initialize();
    } catch (initError) {
      console.warn('Vector service initialization warning:', initError);
    }

    // Build filters
    const filters: any = {};
    
    if (location) filters.location = location;
    if (remote_ok !== undefined) filters.remoteOk = remote_ok === 'true';
    if (experience_level) filters.experienceLevel = experience_level;
    if (employment_type) filters.employmentType = employment_type;
    if (salary_min) filters.salaryMin = parseInt(salary_min);
    if (salary_max) filters.salaryMax = parseInt(salary_max);

    const matches = await vectorMatchingService.findMatchingJobs(
      candidateId,
      parseInt(limit),
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return res.status(200).json({
      success: true,
      message: 'Matching jobs found successfully',
      data: matches,
      count: matches.length,
      candidateId
    });

  } catch (error) {
    console.error('Error finding matching jobs:', error);
    
    if ((error as Error).message.includes('not found in vector database')) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found in matching system. Please sync the candidate first.',
        error: 'CANDIDATE_NOT_SYNCED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Find matching candidates for a job
 */
export const findMatchingCandidates = async (
  req: Request<IdParam, {}, {}, MatchingCandidatesQuery>, 
  res: Response
) => {
  try {
    const { id: jobId } = req.params;
    const { 
      limit = '10',
      location,
      availability,
      min_experience,
      max_experience,
      max_salary_expectation
    } = req.query;

    // Initialize vector matching service if not already done
    try {
      await vectorMatchingService.initialize();
    } catch (initError) {
      console.warn('Vector service initialization warning:', initError);
    }

    // Build filters
    const filters: any = {};
    
    if (location) filters.location = location;
    if (availability) filters.availability = availability;
    if (min_experience) filters.minExperience = parseInt(min_experience);
    if (max_experience) filters.maxExperience = parseInt(max_experience);
    if (max_salary_expectation) filters.maxSalaryExpectation = parseInt(max_salary_expectation);

    const matches = await vectorMatchingService.findMatchingCandidates(
      jobId,
      parseInt(limit),
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return res.status(200).json({
      success: true,
      message: 'Matching candidates found successfully',
      data: matches,
      count: matches.length,
      jobId
    });

  } catch (error) {
    console.error('Error finding matching candidates:', error);
    
    if ((error as Error).message.includes('not found in vector database')) {
      return res.status(404).json({
        success: false,
        message: 'Job not found in matching system. Please sync the job first.',
        error: 'JOB_NOT_SYNCED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Sync candidate to vector database
 */
export const syncCandidate = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id: candidateId } = req.params;

    await vectorMatchingService.initialize();
    await vectorMatchingService.upsertCandidate(candidateId);

    return res.status(200).json({
      success: true,
      message: 'Candidate synced to matching system successfully',
      candidateId
    });

  } catch (error) {
    console.error('Error syncing candidate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Sync job to vector database
 */
export const syncJob = async (req: Request<IdParam>, res: Response) => {
  try {
    const { id: jobId } = req.params;

    await vectorMatchingService.initialize();
    await vectorMatchingService.upsertJob(jobId);

    return res.status(200).json({
      success: true,
      message: 'Job synced to matching system successfully',
      jobId
    });

  } catch (error) {
    console.error('Error syncing job:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Bulk sync data to vector database
 */
export const syncData = async (req: Request<{}, {}, SyncRequest>, res: Response) => {
  try {
    const { type } = req.body;

    await vectorMatchingService.initialize();

    let syncResult = '';
    
    switch (type) {
      case 'candidates':
        await vectorMatchingService.syncAllCandidates();
        syncResult = 'All candidates synced successfully';
        break;
      
      case 'jobs':
        await vectorMatchingService.syncAllJobs();
        syncResult = 'All jobs synced successfully';
        break;
      
      case 'all':
        await vectorMatchingService.syncAllCandidates();
        await vectorMatchingService.syncAllJobs();
        syncResult = 'All candidates and jobs synced successfully';
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid sync type. Use "candidates", "jobs", or "all"'
        });
    }

    return res.status(200).json({
      success: true,
      message: syncResult,
      type
    });

  } catch (error) {
    console.error('Error syncing data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Get matching system health status
 */
export const getMatchingHealth = async (req: Request, res: Response) => {
  try {
    // Try to initialize the service to check health
    await vectorMatchingService.initialize();

    return res.status(200).json({
      success: true,
      message: 'Matching system is healthy',
      status: 'online',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Matching system health check failed:', error);
    return res.status(503).json({
      success: false,
      message: 'Matching system is unhealthy',
      status: 'offline',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
