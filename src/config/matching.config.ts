import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import { EnvironmentEncryption } from '../utils/encryption.utils';

export interface MatchingConfig {
  chromaHost: string;
  chromaPort: number;
  openaiApiKey: string;
}

export const getMatchingConfig = (): MatchingConfig => {
  const chromaHost = process.env.CHROMA_HOST || 'localhost';
  const chromaPort = parseInt(process.env.CHROMA_PORT || '8000');
  
  // Use secure environment variable handling
  const openaiApiKey = EnvironmentEncryption.getSecureEnvVar('OPENAI_API_KEY', false);

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    chromaHost,
    chromaPort,
    openaiApiKey
  };
};

// OpenAI client instance
export const createOpenAIClient = (apiKey: string) => {
  return new OpenAI({
    apiKey: apiKey
  });
};

// ChromaDB client instance
export const createChromaClient = (host: string, port: number) => {
  return new ChromaClient({
    path: `http://${host}:${port}`
  });
};

// OpenAI Embedding Function for ChromaDB
export const createOpenAIEmbeddingFunction = (apiKey: string) => {
  // ChromaDB embedding function will be created in the service layer
  return {
    apiKey,
    model: "text-embedding-3-small"
  };
};
