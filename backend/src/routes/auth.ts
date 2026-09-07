import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { loginRateLimiter, authenticate, AuthRequest } from '../middleware/auth';
import { getAdminPermissions } from '../utils/permissionsHelper';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { permissions: { include: { permission: true } } },
  });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    let permissions = user.permissions.map(up => up.permission.name);
    
    if (user.role === 'ADMIN') {
      permissions = getAdminPermissions();
    }

    res.json({ token, role: user.role, tenantId: user.tenantId, permissions });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { permissions: { include: { permission: true } } },
  });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let permissions = user.permissions.map(up => up.permission.name);
    if (user.role === 'ADMIN') {
      permissions = getAdminPermissions();
    }
    
    res.json({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, permissions });
});

export default router;
