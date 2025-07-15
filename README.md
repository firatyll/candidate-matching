# Candidate Matching API

[![Dev to Main PR](https://github.com/firatyll/candidate-matching/actions/workflows/dev-to-main-pr.yml/badge.svg)](https://github.com/firatyll/candidate-matching/actions/workflows/dev-to-main-pr.yml)

> **Note: This application is currently under active development. Features and API endpoints may change.**

A RESTful API service for candidate and job position matching built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 CI/CD Pipeline

This repository includes an automated GitHub Actions pipeline that:
- ✅ Runs code quality checks on every push to `dev` branch
- 🤖 Generates AI-powered pull requests using OpenAI GPT-4
- 📋 Automatically assigns reviewers and adds helpful labels
- 🔍 Includes comprehensive review checklists

See [Pipeline Setup Guide](./.github/PIPELINE_SETUP.md) for configuration details.

## Features

- **Candidate Management**: Create, read, update, and delete candidate profiles
- **Job Position Management**: Manage job postings with detailed requirements
- **Application Tracking**: Track job applications and their statuses
- **Schema Validation**: Robust input validation using Zod
- **Type Safety**: Full TypeScript implementation with Prisma-generated types
- **Database Relations**: Properly structured database with foreign key relationships
- **Error Handling**: Comprehensive error handling with detailed responses
- **CORS Support**: Cross-origin resource sharing enabled

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Development**: Nodemon, ts-node


### Validation Rules

#### Candidate Validation
- `firstName`: Minimum 2 characters
- `lastName`: Minimum 2 characters
- `email`: Valid email format, unique
- `phone`: Valid phone number format (optional)
- `skills`: Array with at least 1 skill
- `experience`: Non-negative number
- `location`: Minimum 2 characters
- `availability`: One of: "immediate", "within_week", "within_month", "not_available"
- `salary_expectation`: Non-negative number (optional)
- `resume_url`: Valid URL format (optional)

## Project Structure

```
src/
├── controllers/           # Request handlers
│   └── candidate.controller.ts
├── generated/            # Prisma generated files
│   └── prisma/
├── middlewares/          # Express middlewares
│   └── validation.middleware.ts
├── models/              # Database models (future use)
├── routes/              # API routes
│   └── candidate.routes.ts
├── schemas/             # Zod validation schemas
│   ├── candidate.schema.ts
│   ├── common.schema.ts
│   └── job.schema.ts
├── services/            # Business logic (future use)
├── utils/               # Utility functions
│   └── validation.utils.ts
└── index.ts             # Application entry point

prisma/
├── schema.prisma        # Prisma schema definition
└── migrations/          # Database migrations

```

## Database Schema

### Models

#### Candidate
- Primary key: `id` (UUID)
- Unique constraint: `email`
- Fields: firstName, lastName, email, phone, skills, experience, location, availability, salary_expectation, resume_url
- Timestamps: created_at, updated_at

#### JobPosition
- Primary key: `id` (UUID)
- Fields: title, company, description, required_skills, preferred_skills, experience_level, location, remote_ok, salary_min, salary_max, employment_type, status
- Timestamps: created_at, updated_at

#### JobApplication
- Primary key: `id` (UUID)
- Foreign keys: candidate_id, job_position_id
- Unique constraint: (candidate_id, job_position_id)
- Fields: status, cover_letter, applied_at, updated_at

### Enums
- `CandidateAvailability`: IMMEDIATE, WITHIN_WEEK, WITHIN_MONTH, NOT_AVAILABLE
- `ExperienceLevel`: ENTRY, MID, SENIOR, LEAD
- `EmploymentType`: FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
- `JobStatus`: ACTIVE, INACTIVE, FILLED
- `ApplicationStatus`: PENDING, REVIEWED, INTERVIEWED, OFFERED, ACCEPTED, REJECTED, WITHDRAWN

## Development

### Code Style
- Use TypeScript for type safety
- Follow consistent naming conventions (camelCase for variables, PascalCase for types)
- Use meaningful variable and function names
- Add proper error handling for all async operations

### Database Changes
1. Modify the Prisma schema (`prisma/schema.prisma`)
2. Create and apply migration:
```bash
npx prisma migrate dev --name description_of_changes
```
3. Regenerate Prisma client:
```bash
npx prisma generate
```

### Adding New Endpoints
1. Create/update schemas in `src/schemas/`
2. Add controller functions in `src/controllers/`
3. Define routes in `src/routes/`
4. Import and use routes in `src/index.ts`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run build:watch` | Watch mode for TypeScript compilation |
| `npm run clean` | Remove build directory |
| `npm run type-check` | Run TypeScript type checking |

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd candidate-matching
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables (see [Environment Variables](#environment-variables))

5. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Server
PORT=3000
# Optional: Add other environment-specific variables
```

### Environment Variable Descriptions

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Port number for the server (default: 3000)
- `NODE_ENV`: Environment mode (development, production, test)

## Database Setup

1. **Create PostgreSQL Database**:
```sql
CREATE DATABASE database_name;◊
```

2. **Run Prisma Migrations**:
```bash
npx prisma migrate dev --name init
```

3. **Generate Prisma Client**:
```bash
npx prisma generate
```

4. **View Database (Optional)**:
```bash
npx prisma studio
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Other Commands
```bash
# Build the project
npm run build

# Watch mode for TypeScript compilation
npm run build:watch

# Type checking only
npm run type-check

# Clean build directory
npm run clean
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines
- Write clear commit messages
- Add appropriate error handling
- Update documentation for new features
- Follow existing code style and patterns
- Test your changes thoroughly

## License

This project is licensed under the [](License).

