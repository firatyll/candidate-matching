import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import OpenAI from 'openai';
import { getMatchingConfig, createOpenAIClient, createChromaClient } from '../../config/matching.config';
import { PrismaClient } from '../../generated/prisma';

export interface CandidateVector {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  skills: string[];
  experience: number;
  location: string;
  availability: string;
  salaryExpectation?: number;
  combinedText: string;
}

export interface JobVector {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  location: string;
  remoteOk: boolean;
  salaryMin?: number;
  salaryMax?: number;
  employmentType: string;
  combinedText: string;
}

export interface MatchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  distance: number;
}

export interface CandidateMatch extends MatchResult {
  candidate: CandidateVector;
}

export interface JobMatch extends MatchResult {
  job: JobVector;
}

export class VectorMatchingService {
  private chromaClient: ChromaClient;
  private openaiClient: OpenAI;
  private prisma: PrismaClient;
  private candidatesCollection: Collection | null = null;
  private jobsCollection: Collection | null = null;

  constructor() {
    const config = getMatchingConfig();
    this.chromaClient = createChromaClient(config.chromaHost, config.chromaPort);
    this.openaiClient = createOpenAIClient(config.openaiApiKey);
    this.prisma = new PrismaClient();
  }

  /**
   * Initialize ChromaDB collections
   */
  async initialize(): Promise<void> {
    try {
      // Create or get candidates collection
      this.candidatesCollection = await this.chromaClient.getOrCreateCollection({
        name: "candidates",
        metadata: { description: "Candidate profiles for job matching" }
      });

      // Create or get jobs collection
      this.jobsCollection = await this.chromaClient.getOrCreateCollection({
        name: "jobs",
        metadata: { description: "Job positions for candidate matching" }
      });

      console.log('Vector collections initialized successfully');
    } catch (error) {
      console.error('Failed to initialize vector collections:', error);
      throw error;
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Create combined text for candidate
   */
  private createCandidateText(candidate: CandidateVector): string {
    const skillsText = candidate.skills.join(', ');
    return `${candidate.firstName} ${candidate.lastName} - Skills: ${skillsText} - Experience: ${candidate.experience} years - Location: ${candidate.location} - Availability: ${candidate.availability}`;
  }

  /**
   * Create combined text for job
   */
  private createJobText(job: JobVector): string {
    const requiredSkillsText = job.requiredSkills.join(', ');
    const preferredSkillsText = job.preferredSkills.join(', ');
    const remoteText = job.remoteOk ? 'Remote work available' : 'On-site work';
    
    return `${job.title} at ${job.company} - ${job.description} - Required skills: ${requiredSkillsText} - Preferred skills: ${preferredSkillsText} - Experience level: ${job.experienceLevel} - Location: ${job.location} - ${remoteText} - Employment type: ${job.employmentType}`;
  }

  /**
   * Add or update candidate in vector database
   */
  async upsertCandidate(candidateId: string): Promise<void> {
    if (!this.candidatesCollection) {
      throw new Error('Candidates collection not initialized');
    }

    try {
      // Fetch candidate from database
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate) {
        throw new Error(`Candidate with id ${candidateId} not found`);
      }

      // Create candidate vector object
      const candidateVector: CandidateVector = {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        skills: candidate.skills,
        experience: candidate.experience,
        location: candidate.location,
        availability: candidate.availability.toLowerCase(),
        salaryExpectation: candidate.salary_expectation || undefined,
        combinedText: ''
      };

      candidateVector.combinedText = this.createCandidateText(candidateVector);

      // Generate embedding
      const embedding = await this.generateEmbedding(candidateVector.combinedText);

      // Prepare metadata (ChromaDB metadata must be flat)
      const metadata = {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        experience: candidate.experience,
        location: candidate.location,
        availability: candidate.availability.toLowerCase(),
        skillsCount: candidate.skills.length,
        salaryExpectation: candidate.salary_expectation || 0,
        skills: candidate.skills.join(',') // Convert array to string for metadata
      };

      // Upsert to ChromaDB
      await this.candidatesCollection.upsert({
        ids: [candidateId],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [candidateVector.combinedText]
      });

      console.log(`Candidate ${candidateId} upserted to vector database`);
    } catch (error) {
      console.error(`Failed to upsert candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Add or update job in vector database
   */
  async upsertJob(jobId: string): Promise<void> {
    if (!this.jobsCollection) {
      throw new Error('Jobs collection not initialized');
    }

    try {
      // Fetch job from database
      const job = await this.prisma.jobPosition.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new Error(`Job with id ${jobId} not found`);
      }

      // Create job vector object
      const jobVector: JobVector = {
        id: job.id,
        title: job.title,
        company: job.company,
        description: job.description,
        requiredSkills: job.required_skills,
        preferredSkills: job.preferred_skills || [],
        experienceLevel: job.experience_level.toLowerCase(),
        location: job.location,
        remoteOk: job.remote_ok,
        salaryMin: job.salary_min || undefined,
        salaryMax: job.salary_max || undefined,
        employmentType: job.employment_type.toLowerCase(),
        combinedText: ''
      };

      jobVector.combinedText = this.createJobText(jobVector);

      // Generate embedding
      const embedding = await this.generateEmbedding(jobVector.combinedText);

      // Prepare metadata
      const metadata = {
        title: job.title,
        company: job.company,
        experienceLevel: job.experience_level.toLowerCase(),
        location: job.location,
        remoteOk: job.remote_ok,
        employmentType: job.employment_type.toLowerCase(),
        salaryMin: job.salary_min || 0,
        salaryMax: job.salary_max || 0,
        requiredSkillsCount: job.required_skills.length,
        preferredSkillsCount: job.preferred_skills?.length || 0,
        requiredSkills: job.required_skills.join(','),
        preferredSkills: job.preferred_skills?.join(',') || ''
      };

      // Upsert to ChromaDB
      await this.jobsCollection.upsert({
        ids: [jobId],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [jobVector.combinedText]
      });

      console.log(`Job ${jobId} upserted to vector database`);
    } catch (error) {
      console.error(`Failed to upsert job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Find matching jobs for a candidate
   */
  async findMatchingJobs(
    candidateId: string,
    limit: number = 10,
    filters?: {
      location?: string;
      remoteOk?: boolean;
      experienceLevel?: string;
      employmentType?: string;
      salaryMin?: number;
      salaryMax?: number;
    }
  ): Promise<JobMatch[]> {
    if (!this.candidatesCollection || !this.jobsCollection) {
      throw new Error('Collections not initialized');
    }

    try {
      // Get candidate data from vector database
      const candidateResult = await this.candidatesCollection.get({
        ids: [candidateId],
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas]
      });

      if (!candidateResult.documents || candidateResult.documents.length === 0) {
        throw new Error(`Candidate ${candidateId} not found in vector database`);
      }

      const candidateText = candidateResult.documents[0];
      if (!candidateText) {
        throw new Error(`Candidate text not found for ${candidateId}`);
      }

      // Generate embedding for candidate
      const candidateEmbedding = await this.generateEmbedding(candidateText);

      // Build where clause for filtering
      const whereClause: Record<string, any> = {};
      
      if (filters) {
        if (filters.location) {
          whereClause.location = { $eq: filters.location };
        }
        if (filters.remoteOk !== undefined) {
          whereClause.remoteOk = { $eq: filters.remoteOk };
        }
        if (filters.experienceLevel) {
          whereClause.experienceLevel = { $eq: filters.experienceLevel.toLowerCase() };
        }
        if (filters.employmentType) {
          whereClause.employmentType = { $eq: filters.employmentType.toLowerCase() };
        }
        if (filters.salaryMin !== undefined) {
          whereClause.salaryMax = { $gte: filters.salaryMin };
        }
        if (filters.salaryMax !== undefined) {
          whereClause.salaryMin = { $lte: filters.salaryMax };
        }
      }

      // Query similar jobs
      const queryResult = await this.jobsCollection.query({
        queryEmbeddings: [candidateEmbedding],
        nResults: limit,
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances]
      });

      // Process results
      const matches: JobMatch[] = [];
      
      if (queryResult.ids && queryResult.metadatas && queryResult.distances) {
        for (let i = 0; i < queryResult.ids[0].length; i++) {
          const jobId = queryResult.ids[0][i];
          const metadata = queryResult.metadatas[0][i];
          const distance = queryResult.distances[0][i];
          
          if (metadata) {
            const jobVector: JobVector = {
              id: jobId,
              title: metadata.title as string,
              company: metadata.company as string,
              description: '', // We can fetch this separately if needed
              requiredSkills: (metadata.requiredSkills as string)?.split(',') || [],
              preferredSkills: (metadata.preferredSkills as string)?.split(',').filter(s => s) || [],
              experienceLevel: metadata.experienceLevel as string,
              location: metadata.location as string,
              remoteOk: metadata.remoteOk as boolean,
              salaryMin: metadata.salaryMin as number || undefined,
              salaryMax: metadata.salaryMax as number || undefined,
              employmentType: metadata.employmentType as string,
              combinedText: ''
            };

            matches.push({
              id: jobId,
              score: distance !== null ? 1 - distance : 0, // Convert distance to similarity score
              metadata,
              distance: distance || 0,
              job: jobVector
            });
          }
        }
      }

      return matches;
    } catch (error) {
      console.error(`Failed to find matching jobs for candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Find matching candidates for a job
   */
  async findMatchingCandidates(
    jobId: string,
    limit: number = 10,
    filters?: {
      location?: string;
      availability?: string;
      minExperience?: number;
      maxExperience?: number;
      maxSalaryExpectation?: number;
    }
  ): Promise<CandidateMatch[]> {
    if (!this.candidatesCollection || !this.jobsCollection) {
      throw new Error('Collections not initialized');
    }

    try {
      // Get job data from vector database
      const jobResult = await this.jobsCollection.get({
        ids: [jobId],
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas]
      });

      if (!jobResult.documents || jobResult.documents.length === 0) {
        throw new Error(`Job ${jobId} not found in vector database`);
      }

      const jobText = jobResult.documents[0];
      if (!jobText) {
        throw new Error(`Job text not found for ${jobId}`);
      }

      // Generate embedding for job
      const jobEmbedding = await this.generateEmbedding(jobText);

      // Build where clause for filtering
      const whereClause: Record<string, any> = {};
      
      if (filters) {
        if (filters.location) {
          whereClause.location = { $eq: filters.location };
        }
        if (filters.availability) {
          whereClause.availability = { $eq: filters.availability.toLowerCase() };
        }
        if (filters.minExperience !== undefined) {
          whereClause.experience = { $gte: filters.minExperience };
        }
        if (filters.maxExperience !== undefined) {
          whereClause.experience = { $lte: filters.maxExperience };
        }
        if (filters.maxSalaryExpectation !== undefined) {
          whereClause.salaryExpectation = { $lte: filters.maxSalaryExpectation };
        }
      }

      // Query similar candidates
      const queryResult = await this.candidatesCollection.query({
        queryEmbeddings: [jobEmbedding],
        nResults: limit,
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances]
      });

      // Process results
      const matches: CandidateMatch[] = [];
      
      if (queryResult.ids && queryResult.metadatas && queryResult.distances) {
        for (let i = 0; i < queryResult.ids[0].length; i++) {
          const candidateId = queryResult.ids[0][i];
          const metadata = queryResult.metadatas[0][i];
          const distance = queryResult.distances[0][i];
          
          if (metadata) {
            const candidateVector: CandidateVector = {
              id: candidateId,
              firstName: metadata.firstName as string,
              lastName: metadata.lastName as string,
              email: metadata.email as string,
              skills: (metadata.skills as string)?.split(',') || [],
              experience: metadata.experience as number,
              location: metadata.location as string,
              availability: metadata.availability as string,
              salaryExpectation: metadata.salaryExpectation as number || undefined,
              combinedText: ''
            };

            matches.push({
              id: candidateId,
              score: distance !== null ? 1 - distance : 0, // Convert distance to similarity score
              metadata,
              distance: distance || 0,
              candidate: candidateVector
            });
          }
        }
      }

      return matches;
    } catch (error) {
      console.error(`Failed to find matching candidates for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk sync all candidates to vector database
   */
  async syncAllCandidates(): Promise<void> {
    try {
      const candidates = await this.prisma.candidate.findMany({
        select: { id: true }
      });

      console.log(`Syncing ${candidates.length} candidates to vector database...`);

      for (const candidate of candidates) {
        await this.upsertCandidate(candidate.id);
      }

      console.log(`Successfully synced ${candidates.length} candidates`);
    } catch (error) {
      console.error('Failed to sync candidates:', error);
      throw error;
    }
  }

  /**
   * Bulk sync all jobs to vector database
   */
  async syncAllJobs(): Promise<void> {
    try {
      const jobs = await this.prisma.jobPosition.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });

      console.log(`Syncing ${jobs.length} active jobs to vector database...`);

      for (const job of jobs) {
        await this.upsertJob(job.id);
      }

      console.log(`Successfully synced ${jobs.length} jobs`);
    } catch (error) {
      console.error('Failed to sync jobs:', error);
      throw error;
    }
  }

  /**
   * Remove candidate from vector database
   */
  async removeCandidate(candidateId: string): Promise<void> {
    if (!this.candidatesCollection) {
      throw new Error('Candidates collection not initialized');
    }

    try {
      await this.candidatesCollection.delete({
        ids: [candidateId]
      });
      console.log(`Candidate ${candidateId} removed from vector database`);
    } catch (error) {
      console.error(`Failed to remove candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Remove job from vector database
   */
  async removeJob(jobId: string): Promise<void> {
    if (!this.jobsCollection) {
      throw new Error('Jobs collection not initialized');
    }

    try {
      await this.jobsCollection.delete({
        ids: [jobId]
      });
      console.log(`Job ${jobId} removed from vector database`);
    } catch (error) {
      console.error(`Failed to remove job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const vectorMatchingService = new VectorMatchingService();
