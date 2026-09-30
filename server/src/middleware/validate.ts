import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ParseableSchema {
  parseAsync: (data: unknown) => Promise<any>;
}

export function validateBody(schema: ParseableSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'root';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed. Please check the supplied fields.',
          errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'Invalid request data.',
      });
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters.',
          errors: error.flatten().fieldErrors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters.',
      });
    }
  };
}
