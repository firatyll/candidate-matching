import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Input sanitization utilities
 * Provides comprehensive input validation and sanitization
 */

export class InputSanitizer {
  /**
   * Common text sanitization
   */
  static sanitizeText(): ValidationChain {
    return body('*')
      .trim()
      .escape()
      .blacklist('<>"\'/\\&')
      .isLength({ max: 1000 })
      .withMessage('Text length exceeds maximum allowed');
  }

  /**
   * Email sanitization
   */
  static sanitizeEmail(field: string = 'email'): ValidationChain {
    return body(field)
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Invalid email format');
  }

  /**
   * UUID parameter sanitization
   */
  static sanitizeUUID(field: string = 'id'): ValidationChain {
    return param(field)
      .isUUID()
      .withMessage('Invalid ID format');
  }

  /**
   * Integer sanitization
   */
  static sanitizeInteger(field: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): ValidationChain {
    return body(field)
      .isInt({ min, max })
      .toInt()
      .withMessage(`${field} must be an integer between ${min} and ${max}`);
  }

  /**
   * String length sanitization
   */
  static sanitizeString(field: string, minLength: number = 1, maxLength: number = 255): ValidationChain {
    return body(field)
      .isString()
      .trim()
      .escape()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`);
  }

  /**
   * Array sanitization
   */
  static sanitizeArray(field: string, maxItems: number = 50): ValidationChain {
    return body(field)
      .isArray({ max: maxItems })
      .withMessage(`${field} must be an array with maximum ${maxItems} items`);
  }

  /**
   * Boolean sanitization
   */
  static sanitizeBoolean(field: string): ValidationChain {
    return body(field)
      .isBoolean()
      .toBoolean()
      .withMessage(`${field} must be a boolean value`);
  }

  /**
   * URL sanitization
   */
  static sanitizeURL(field: string): ValidationChain {
    return body(field)
      .isURL()
      .isLength({ max: 2048 })
      .withMessage('Invalid URL format');
  }

  /**
   * Query parameter sanitization
   */
  static sanitizeQueryParam(field: string, maxLength: number = 100): ValidationChain {
    return query(field)
      .optional()
      .trim()
      .escape()
      .isLength({ max: maxLength })
      .withMessage(`Query parameter ${field} exceeds maximum length`);
  }

  /**
   * Remove potentially dangerous characters
   */
  static removeDangerousChars(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove HTML tags, SQL injection patterns, and script tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
      .replace(/['"`;\\]/g, '')
      .trim();
  }

  /**
   * Validate and sanitize pagination parameters
   */
  static sanitizePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .toInt()
        .withMessage('Page must be between 1 and 1000'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt()
        .withMessage('Limit must be between 1 and 100')
    ];
  }
}
