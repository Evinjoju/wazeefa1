import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle Prisma Known Request Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // Unique constraint failed
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with that value already exists' });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
  }

  // Log unhandled errors
  console.error('Unhandled Error:', err);

  // Generic 500 fallback
  res.status(500).json({ error: 'Internal server error' });
};
