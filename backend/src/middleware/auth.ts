import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { getAdminPermissions } from '../utils/permissionsHelper';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string | null;
    permissions: string[];
  };
}

// 1. Verify JWT
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Fetch user and permissions to ensure they still exist and have correct permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId,
      permissions: user.permissions.map((up: any) => up.permission.name),
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// 2. RBAC & Permission Checker Middleware
export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Super Admin overrides permissions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Admins implicitly have all project and user permissions within their tenant, 
    // EXCEPT they cannot manage Super Admins or global permissions.
    if (req.user.role === 'ADMIN') {
        if (requiredPermission === 'permissions.manage') {
            res.status(403).json({ error: 'Forbidden: Admins cannot manage permissions' });
            return;
        }
        const allowedAdminPerms = getAdminPermissions();
        if (allowedAdminPerms.includes(requiredPermission)) {
            return next();
        }
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
    }

    // For AGENTs, strictly check the granted permissions
    if (req.user.role === 'AGENT') {
        if (req.user.permissions.includes(requiredPermission)) {
            return next();
        } else {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }
    }

    res.status(403).json({ error: 'Forbidden' });
  };
};

// 3. Rate Limiter Middleware
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
  message: { error: 'Too many API requests, please try again later' },
  standardHeaders: true, 
  legacyHeaders: false, 
});
