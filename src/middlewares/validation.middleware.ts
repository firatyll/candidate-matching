import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateSchema = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

export const validateQuery = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: errorMessages
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

export const validateParams = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: errorMessages
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};
