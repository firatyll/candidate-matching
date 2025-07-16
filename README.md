# Employee & Employer Matching Platform API

[![Dev to Main PR](https://github.com/firatyll/candidate-matching/actions/workflows/dev-to-main-pr.yml/badge.svg)](https://github.com/firatyll/candidate-matching/actions/workflows/dev-to-main-pr.yml)

## Overview

**Employee & Employer Matching Backend System** that leverages **smart filtering** and **AI-powered semantic search** with embeddings to connect the right candidates with the perfect job opportunities. Built with modern technologies and enterprise-grade architecture.

### Key Capabilities
- **AI-Powered Matching**: Advanced semantic search using OpenAI embeddings for intelligent candidate-job matching
- **Smart Filtering**: Multi-dimensional filtering by location, experience, salary, skills, availability, and more
- **Vector Search**: High-performance similarity search with ChromaDB for scalable matching algorithms
- **Real-time Synchronization**: Automatic sync of candidates and jobs to the vector database
- **Intelligent Ranking**: Relevance-based scoring and ranking of matches
- **Enterprise Security**: Rate limiting, request sanitization, and comprehensive security middleware

## Tech Stack

### **Core Technologies**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (Full type safety)
- **Database**: PostgreSQL (Primary data store)
- **ORM**: Prisma (Type-safe database access)

### **AI & Search**
- **Vector Database**: ChromaDB (Similarity search & embeddings storage)
- **AI/ML Engine**: OpenAI Embeddings API (text-embedding-ada-002)
- **Search Algorithm**: Cosine similarity with metadata filtering

### **Validation & Security**
- **Schema Validation**: Zod (Runtime type checking)
- **Security**: Helmet.js, CORS, Rate limiting, Request sanitization
- **Encryption**: Crypto-JS for sensitive data handling

### **Development & Deployment**
- **Development**: Nodemon, ts-node
- **Build System**: TypeScript compiler
- **Testing**: Type checking and build validation
- **CI/CD**: GitHub Actions with automated PR generation

## API Routes

### **Candidate Management**
```http
GET    /api/candidates              # List all candidates
POST   /api/candidates              # Create new candidate
GET    /api/candidates/:id          # Get candidate by ID
PUT    /api/candidates/:id          # Update candidate
DELETE /api/candidates/:id          # Delete candidate
```

### **Job Position Management**
```http
GET    /api/jobs                    # List all job positions  
POST   /api/jobs                    # Create new job position
GET    /api/jobs/:id                # Get job position by ID
PUT    /api/jobs/:id                # Update job position
DELETE /api/jobs/:id                # Delete job position
```

### **Application Tracking**
```http
GET    /api/applications            # List all applications (with filters)
POST   /api/applications            # Create application (admin use)
POST   /api/applications/apply      # Apply to job (candidate use)
GET    /api/applications/:id        # Get application by ID
PUT    /api/applications/:id        # Update application
PATCH  /api/applications/:id/status # Update application status (HR)
PATCH  /api/applications/:id/withdraw # Withdraw application (candidate)
DELETE /api/applications/:id        # Delete application

# Specialized endpoints
GET    /api/applications/candidate/:candidateId  # Get candidate's applications
GET    /api/applications/job/:jobId              # Get job's applications
```

### **AI Matching System**
```http
GET    /api/matching/health                              # Health check
GET    /api/matching/candidates/:id/jobs                 # Find matching jobs for candidate
GET    /api/matching/jobs/:id/candidates                 # Find matching candidates for job
POST   /api/matching/sync/candidates/:id                 # Sync individual candidate
POST   /api/matching/sync/jobs/:id                       # Sync individual job
POST   /api/matching/sync                                # Bulk sync (all/candidates/jobs)
```

#### **Matching Query Parameters**

**For Job Matching:**
- `limit`: Number of results (default: 10)
- `location`: Filter by location
- `remote_ok`: Remote work availability (true/false)
- `experience_level`: entry, mid, senior, lead
- `employment_type`: full_time, part_time, contract, internship
- `salary_min`, `salary_max`: Salary range filters

**For Candidate Matching:**
- `limit`: Number of results (default: 10)
- `location`: Filter by location
- `availability`: immediate, within_week, within_month, not_available
- `min_experience`, `max_experience`: Experience range
- `max_salary_expectation`: Maximum salary expectation

## Project Structure

```
candidate-matching/
├── 📁 .github/
│   └── workflows/
│       └── dev-to-main-pr.yml          # CI/CD pipeline
├── 📁 prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Database migrations
├── 📁 src/
│   ├── index.ts                        # Application entry point
│   ├── 📁 config/
│   │   └── matching.config.ts          # Matching system configuration
│   ├── 📁 controllers/                 # Request handlers
│   │   ├── candidate.controller.ts     # Candidate CRUD operations
│   │   ├── job.controller.ts           # Job position CRUD operations
│   │   ├── application.controller.ts   # Application management
│   │   └── matching.controller.ts      # AI matching endpoints
│   ├── 📁 middlewares/                 # Express middlewares
│   │   ├── validation.middleware.ts    # Schema validation
│   │   ├── enhanced-validation.middleware.ts
│   │   └── security.middleware.ts      # Security & rate limiting
│   ├── 📁 routes/                      # API route definitions
│   │   ├── candidate.routes.ts
│   │   ├── job.routes.ts
│   │   ├── application.routes.ts
│   │   └── matching.routes.ts
│   ├── 📁 schemas/                     # Zod validation schemas
│   │   ├── candidate.schema.ts
│   │   ├── job.schema.ts
│   │   ├── application.schema.ts
│   │   └── common.schema.ts
│   ├── 📁 services/
│   │   └── matching/
│   │       └── vector-matching.service.ts  # AI matching logic
│   ├── 📁 utils/                       # Utility functions
│   │   ├── validation.utils.ts
│   │   ├── encryption.utils.ts
│   │   ├── sanitization.utils.ts
│   │   └── rate-limit.utils.ts
│   └── 📁 generated/                   # Prisma generated files
│       └── prisma/
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # TypeScript configuration
├── LICENSE                            # Apache 2.0 License
└── README.md
```

## CI/CD Pipeline

Our automated GitHub Actions pipeline provides:

### **Code Quality Assurance**
- TypeScript compilation validation
- Build process verification  
- Automated code quality checks
- Comprehensive error reporting

### **Automated Workflow**
- AI-powered pull request generation using OpenAI GPT-4o-mini
- Automatic reviewer assignment
- Intelligent labeling system
- Detailed change analysis and reporting

### **Pipeline Triggers**
- Runs on every push to `dev` branch
- Manual workflow dispatch available
- Automatic PR creation from dev → main

### **Quality Gates**
- All checks must pass before PR creation
- TypeScript strict mode validation
- Successful build requirement
- Automated deployment readiness verification

## Installation & Setup

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 12+
- Git

### **Quick Start**

1. **Clone the Repository**
```bash
git clone https://github.com/firatyll/candidate-matching.git
cd candidate-matching
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```

4. **Database Setup**
```bash
# Create PostgreSQL database
createdb candidate_matching

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

5. **ChromaDB Setup (Choose one method)**

**Option A - Docker (Recommended):**
```bash
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

**Option B - Local Installation:**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

6. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### **Environment Variables**

Create a `.env` file with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/candidate_matching?schema=public"

# Server Configuration  
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# AI & Vector Search (Required for matching features)
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_URL=http://localhost:8000

# Security (Optional - defaults provided)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **Environment Variable Details**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | - |
| `PORT` | Server port number | ❌ No | 3000 |
| `NODE_ENV` | Environment mode | ❌ No | development |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | ✅ Yes* | - |
| `CHROMA_URL` | ChromaDB server URL | ✅ Yes* | http://localhost:8000 |
| `ALLOWED_ORIGINS` | CORS allowed origins | ❌ No | localhost:3000 |

*Required for AI matching features

### **Database Schema**

Our system uses three core models with proper relationships:

#### **Candidate Model**
```sql
- id (UUID, Primary Key)
- firstName, lastName (String, Required)  
- email (String, Unique, Required)
- phone (String, Optional)
- skills (String[], Required, min 1)
- experience (Integer, Required, ≥0)
- location (String, Required)
- availability (Enum: immediate|within_week|within_month|not_available)
- salary_expectation (Integer, Optional)
- resume_url (String, Optional, Valid URL)
- created_at, updated_at (Timestamps)
```

#### **JobPosition Model**  
```sql
- id (UUID, Primary Key)
- title, company (String, Required)
- description (String, Required, min 10 chars)
- required_skills, preferred_skills (String[])
- experience_level (Enum: entry|mid|senior|lead)
- location (String, Required)
- remote_ok (Boolean, Default: false)
- salary_min, salary_max (Integer, Optional)
- employment_type (Enum: full_time|part_time|contract|internship)
- status (Enum: active|inactive|filled, Default: active)
- created_at, updated_at (Timestamps)
```

#### **JobApplication Model**
```sql
- id (UUID, Primary Key)  
- candidate_id, job_position_id (UUID, Foreign Keys)
- status (Enum: pending|reviewed|interviewed|offered|accepted|rejected|withdrawn)
- cover_letter (String, Optional)
- applied_at, updated_at (Timestamps)
- Unique constraint: (candidate_id, job_position_id)
```

## Available Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run dev` | Start development server with hot reload | Development |
| `npm run build` | Build TypeScript to JavaScript | Production prep |
| `npm start` | Start production server | Production |
| `npm run build:watch` | Watch mode TypeScript compilation | Development |
| `npm run type-check` | Run TypeScript type checking only | Validation |
| `npm run clean` | Remove build directory | Cleanup |
| `npm run validate` | Run all checks (lint + build) | CI/CD |

## 🤝 Contributing

We welcome contributions to improve the Employee & Employer Matching Platform! 

### **Development Workflow**

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/candidate-matching.git
cd candidate-matching
```

2. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Development Setup**
```bash
npm install
cp .env.example .env
# Configure your .env file
npx prisma migrate dev
npm run dev
```

4. **Code Quality Standards**
- Use TypeScript for all code
- Follow existing naming conventions (camelCase variables, PascalCase types)
- Add proper error handling for async operations
- Write meaningful commit messages
- Update documentation for new features

5. **Testing Your Changes**
```bash
npm run type-check  # Verify TypeScript compilation
npm run build       # Test build process
npm run validate    # Run all quality checks
```

6. **Submit Changes**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

Then create a Pull Request targeting the `dev` branch.

### **Database Changes**
1. Modify `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Regenerate client: `npx prisma generate`

### **Adding New Endpoints**
1. Create/update schemas in `src/schemas/`
2. Add controller functions in `src/controllers/`
3. Define routes in `src/routes/`
4. Import routes in `src/index.ts`

### **Code Review Process**
- All PRs require review before merging
- Automated CI/CD checks must pass
- AI-generated PR descriptions help reviewers
- Manual testing of new features encouraged

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.

```
Copyright 2025 Candidate Matching Platform

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

**🚀 Built with modern technologies for scalable employee-employer matching**

