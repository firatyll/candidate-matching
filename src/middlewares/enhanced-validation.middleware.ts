import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { SecurityMiddleware } from './security.middleware';
import { InputSanitizer } from '../utils/sanitization.utils';

/**
 * Enhanced validation middleware for specific endpoints
 * Provides additional security validation for sensitive operations
 */

export class EnhancedValidationMiddleware {
  /**
   * Enhanced candidate creation validation
   */
  static validateCandidateCreation() {
    return [
      InputSanitizer.sanitizeString('firstName', 2, 50),
      InputSanitizer.sanitizeString('lastName', 2, 50),
      InputSanitizer.sanitizeEmail('email'),
      InputSanitizer.sanitizeString('phone', 10, 20),
      InputSanitizer.sanitizeArray('skills', 20),
      InputSanitizer.sanitizeInteger('experience', 0, 50),
      InputSanitizer.sanitizeString('location', 2, 100),
      InputSanitizer.sanitizeString('availability', 2, 50),
      body('skills.*').isString().trim().isLength({ min: 1, max: 50 }),
      SecurityMiddleware.handleValidationErrors()
    ];
  }

  /**
   * Enhanced job creation validation
   */
  static validateJobCreation() {
    return [
      InputSanitizer.sanitizeString('title', 3, 100),
      InputSanitizer.sanitizeString('company', 2, 100),
      InputSanitizer.sanitizeString('description', 10, 2000),
      InputSanitizer.sanitizeArray('required_skills', 20),
      InputSanitizer.sanitizeArray('preferred_skills', 20),
      InputSanitizer.sanitizeString('location', 2, 100),
      InputSanitizer.sanitizeBoolean('remote_ok'),
      body('required_skills.*').isString().trim().isLength({ min: 1, max: 50 }),
      body('preferred_skills.*').optional().isString().trim().isLength({ min: 1, max: 50 }),
      body('experience_level').isIn(['entry', 'mid', 'senior', 'lead']),
      body('employment_type').isIn(['full-time', 'part-time', 'contract', 'internship']),
      SecurityMiddleware.handleValidationErrors()
    ];
  }

  /**
   * Enhanced application creation validation
   */
  static validateApplicationCreation() {
    return [
      InputSanitizer.sanitizeUUID('candidate_id'),
      InputSanitizer.sanitizeUUID('job_position_id'),
      InputSanitizer.sanitizeString('cover_letter', 10, 1000),
      SecurityMiddleware.handleValidationErrors()
    ];
  }

  /**
   * Enhanced matching request validation
   */
  static validateMatchingRequest() {
    return [
      param('id').isUUID().withMessage('Invalid ID format'),
      InputSanitizer.sanitizeQueryParam('limit'),
      InputSanitizer.sanitizeQueryParam('location'),
      InputSanitizer.sanitizeQueryParam('experience_level'),
      SecurityMiddleware.handleValidationErrors()
    ];
  }

  /**
   * File upload validation (for future use)
   */
  static validateFileUpload() {
    return (req: Request & { file?: any }, res: Response, next: NextFunction) => {
      if (req.file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.'
          });
        }

        if (req.file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds 5MB limit.'
          });
        }
      }

      next();
    };
  }

  /**
   * SQL injection prevention (additional layer)
   */
  static preventSQLInjection() {
    return (req: Request, res: Response, next: NextFunction) => {
      const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
        /('|(\\)|;|--|\/\*|\*\/)/,
        /(EXEC|EXECUTE|SP_|XP_)/i
      ];

      const checkForSQLInjection = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return sqlInjectionPatterns.some(pattern => pattern.test(obj));
        }
        
        if (typeof obj === 'object' && obj !== null) {
          for (const value of Object.values(obj)) {
            if (checkForSQLInjection(value)) {
              return true;
            }
          }
        }
        
        return false;
      };

      if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input detected'
        });
      }

      next();
    };
  }
}
