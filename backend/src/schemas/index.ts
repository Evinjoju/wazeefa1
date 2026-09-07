import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  address: z.string().min(1, 'Address is required'),
  useCase: z.string().min(1, 'Use case is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).optional(),
  targetTenantId: z.string().uuid('Invalid tenant ID').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  useCase: z.string().min(1, 'Use case is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  assignedRole: z.enum(['SUPER_ADMIN', 'ADMIN', 'AGENT']).optional(),
  permissions: z.array(z.string()).optional(),
  targetTenantId: z.string().uuid('Invalid tenant ID').optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateAdminPermissionsSchema = z.object({
  permissions: z.array(z.string()),
});
