import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request as ExpressRequest, Response } from 'express';

/**
 * Rate limiting configuration
 * Provides different rate limiting strategies for various endpoints
 */

export class RateLimitConfig {
  /**
   * General API rate limiting
   */
  static general() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Request limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      },
      headers: true,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.url === '/health' || req.url === '/';
      }
    });
  }

  /**
   * Authentication endpoints rate limiting (stricter)
   */
  static authentication() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 authentication attempts per windowMs
      message: {
        error: 'Too many authentication attempts',
        message: 'Authentication limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      },
      headers: true
    });
  }

  /**
   * AI matching endpoints rate limiting (moderate)
   */
  static aiMatching() {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // Limit each IP to 10 AI requests per 5 minutes
      message: {
        error: 'AI matching limit exceeded',
        message: 'Too many AI matching requests. Please wait before trying again.',
        retryAfter: '5 minutes'
      },
      headers: true
    });
  }

  /**
   * Data modification endpoints rate limiting
   */
  static dataModification() {
    return rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 30, // Limit each IP to 30 data modification requests per 10 minutes
      message: {
        error: 'Data modification limit exceeded',
        message: 'Too many data modification requests. Please wait before trying again.',
        retryAfter: '10 minutes'
      },
      headers: true
    });
  }

  /**
   * Read-only endpoints rate limiting (more permissive)
   */
  static readOnly() {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 200, // Limit each IP to 200 read requests per 5 minutes
      message: {
        error: 'Read limit exceeded',
        message: 'Too many read requests. Please wait before trying again.',
        retryAfter: '5 minutes'
      },
      headers: true
    });
  }

  /**
   * Custom rate limiter with configurable parameters
   */
  static custom(windowMs: number, max: number, message: string) {
    return rateLimit({
      windowMs,
      max,
      message: {
        error: 'Rate limit exceeded',
        message,
        retryAfter: `${Math.ceil(windowMs / 60000)} minutes`
      },
      headers: true
    });
  }

  /**
   * Skip rate limiting for specific conditions
   */
  static skipConditions = {
    healthChecks: (req: any) => {
      return req.url === '/health' || req.url === '/' || req.url === '/api/health';
    },
    
    internalRequests: (req: any) => {
      // Skip for requests from internal services (if applicable)
      const internalIPs = ['127.0.0.1', '::1'];
      const clientIP = req.ip || req.socket?.remoteAddress;
      return internalIPs.includes(clientIP);
    }
  };
}
