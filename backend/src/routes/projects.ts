import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../schemas';

const router = Router();

router.use(authenticate);

// List projects
router.get('/', requirePermission('projects.read'), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  
  let projects;
  if (role === 'SUPER_ADMIN') {
    projects = await prisma.project.findMany();
  } else {
    projects = await prisma.project.findMany({ where: { tenantId: tenantId! } });
  }
  res.json(projects);
});

// Create project
router.post('/', requirePermission('projects.create'), validate(createProjectSchema), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  const { name, address, useCase, status, targetTenantId } = req.body;

  // Super admins can specify targetTenantId, otherwise it's the user's own tenant
  let assignedTenant = role === 'SUPER_ADMIN' && targetTenantId ? targetTenantId : tenantId;

  // Auto-create a default tenant for Super Admins if none exists (for easy testing)
  if (!assignedTenant) {
    let defaultTenant = await prisma.tenant.findFirst({ where: { name: 'Default Tenant' } });
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({ data: { name: 'Default Tenant' } });
    }
    assignedTenant = defaultTenant.id;
  }

  const project = await prisma.project.create({
    data: {
      name,
      address,
      useCase,
      status: status || 'ACTIVE',
      tenantId: assignedTenant,
    }
  });
  res.status(201).json(project);
});

// Update project
router.put('/:id', requirePermission('projects.update'), validate(updateProjectSchema), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { tenantId, role } = req.user!;
  const { name, address, useCase, status } = req.body;

  const project = await prisma.project.findUnique({ where: { id } });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Enforce Tenant Isolation for non-super-admins
    if (role !== 'SUPER_ADMIN' && project.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

  const updated = await prisma.project.update({
    where: { id },
    data: { name, address, useCase, status }
  });
  res.json(updated);
});

// Delete project
router.delete('/:id', requirePermission('projects.delete'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { tenantId, role } = req.user!;

  const project = await prisma.project.findUnique({ where: { id } });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (role !== 'SUPER_ADMIN' && project.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

  await prisma.project.delete({ where: { id } });
  res.status(204).send();
});

export default router;
