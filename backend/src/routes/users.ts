import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
// Using users.read, etc as permissions, or assuming Admins can just do this naturally.
// For simplicity, we assume an ADMIN has permission to manage users in their tenant.

router.get('/', requirePermission('users.read'), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  
  try {
    const users = role === 'SUPER_ADMIN' 
      ? await prisma.user.findMany() 
      : await prisma.user.findMany({ where: { tenantId: tenantId! } });
      
    res.json(users.map(u => ({ id: u.id, email: u.email, role: u.role, tenantId: u.tenantId, isActive: u.isActive })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requirePermission('users.create'), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  const { email, password, assignedRole, permissions, targetTenantId } = req.body;

  if (role !== 'SUPER_ADMIN' && assignedRole !== 'AGENT') {
     return res.status(403).json({ error: 'Forbidden: Admins can only create Agents' });
  }

  let newTenantId = role === 'SUPER_ADMIN' && targetTenantId ? targetTenantId : tenantId;

  if (!newTenantId) {
    let defaultTenant = await prisma.tenant.findFirst({ where: { name: 'Default Tenant' } });
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({ data: { name: 'Default Tenant' } });
    }
    newTenantId = defaultTenant.id;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: assignedRole || 'AGENT',
        tenantId: newTenantId,
      }
    });

    if (permissions && permissions.length > 0) {
       for (const permName of permissions) {
          let perm = await prisma.permission.findUnique({ where: { name: permName } });
          if (!perm) {
            perm = await prisma.permission.create({ data: { name: permName } });
          }
          await prisma.userPermission.create({
              data: { userId: user.id, permissionId: perm.id }
          });
       }
    }

    res.status(201).json({ id: user.id, email: user.email, role: user.role, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', requirePermission('users.update'), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  const id = req.params.id as string;
  const { isActive } = req.body;

  try {
    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });
    
    // Super admins can disable anyone except other super admins. Admins can disable Agents in their tenant.
    if (role === 'SUPER_ADMIN' && userToUpdate.role === 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Cannot disable Super Admins' });
    }
    
    if (role === 'ADMIN') {
        if (userToUpdate.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });
        if (userToUpdate.role !== 'AGENT') return res.status(403).json({ error: 'Admins can only disable Agents' });
    }
    
    if (role === 'AGENT') {
        return res.status(403).json({ error: 'Agents cannot manage users' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive }
    });
    
    res.json({ id: updated.id, isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
