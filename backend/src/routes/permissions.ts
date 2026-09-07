import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getAdminPermissions, configPath } from '../utils/permissionsHelper';
import { validate } from '../middleware/validate';
import { updateAdminPermissionsSchema } from '../schemas';

const router = Router();

router.use(authenticate);

// Get admin permissions
router.get('/admin', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  res.json(getAdminPermissions());
});

// Update admin permissions
router.post('/admin', validate(updateAdminPermissionsSchema), async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  const { permissions } = req.body;

  fs.writeFileSync(configPath, JSON.stringify(permissions));
  res.json({ message: 'Permissions updated successfully' });
});

export default router;
