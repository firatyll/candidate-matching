import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import candidateRoutes from './routes/candidate.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import matchingRoutes from './routes/matching.routes';

// Security imports
import { SecurityMiddleware } from './middlewares/security.middleware';
import { RateLimitConfig } from './utils/rate-limit.utils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(SecurityMiddleware.helmet());
app.use(SecurityMiddleware.securityHeaders());
app.use(SecurityMiddleware.securityLogger());
app.use(SecurityMiddleware.requestSizeLimiter());

// Rate limiting
app.use(RateLimitConfig.general());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing with security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(SecurityMiddleware.sanitizeRequest());

app.get('/', (req, res) => {
  res.json({
    message: 'Candidate Matching API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes with specific rate limits
app.use('/api/candidates', RateLimitConfig.dataModification(), candidateRoutes);
app.use('/api/jobs', RateLimitConfig.dataModification(), jobRoutes);
app.use('/api/applications', RateLimitConfig.dataModification(), applicationRoutes);
app.use('/api/matching', RateLimitConfig.aiMatching(), matchingRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

export default app;
