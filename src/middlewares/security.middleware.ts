import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { InputSanitizer } from '../utils/sanitization.utils';

/**
 * Security middleware collection
 * Provides comprehensive security middleware for the application
 */

export class SecurityMiddleware {
  /**
   * Helmet configuration for security headers
   */
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  /**
   * Input validation error handler
   */
  static handleValidationErrors() {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array().map(error => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg
          }))
        });
      }
      
      next();
    };
  }

  /**
   * Request size limiter
   */
  static requestSizeLimiter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = req.headers['content-length'];
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        return res.status(413).json({
          success: false,
          message: 'Request entity too large',
          maxSize: '10MB'
        });
      }
      
      next();
    };
  }

  /**
   * Security headers middleware
   */
  static securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Remove server identification
      res.removeHeader('X-Powered-By');
      
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      next();
    };
  }

  /**
   * Request sanitization middleware
   */
  static sanitizeRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        try {
          req.body = this.sanitizeObject(req.body);
        } catch (error) {
          // Silent fail for body sanitization
        }
      }
      
      // Note: Query parameters are read-only in newer Express versions
      // They should be sanitized using express-validator in routes instead
      
      next();
    };
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? InputSanitizer.removeDangerousChars(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = InputSanitizer.removeDangerousChars(key);
      sanitized[sanitizedKey] = this.sanitizeObject(value);
    }
    
    return sanitized;
  }

  /**
   * API key validation middleware (if needed for future authentication)
   */
  static validateApiKey() {
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string;
      const validApiKey = process.env.API_KEY;
      
      // Skip validation if no API key is configured
      if (!validApiKey) {
        return next();
      }
      
      if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or missing API key'
        });
      }
      
      next();
    };
  }

  /**
   * Request logging for security monitoring
   */
  static securityLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.socket.remoteAddress
        };
        
        // Log security events (failed authentications, rate limits, etc.)
        if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
          console.warn('Security Event:', JSON.stringify(logData));
        }
      });
      
      next();
    };
  }
}
