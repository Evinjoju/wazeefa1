import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// List projects
router.get('/', requirePermission('projects.read'), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  
  try {
    let projects;
    if (role === 'SUPER_ADMIN') {
      projects = await prisma.project.findMany();
    } else {
      projects = await prisma.project.findMany({ where: { tenantId: tenantId! } });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', requirePermission('projects.create'), async (req: AuthRequest, res: Response) => {
  const { tenantId, role } = req.user!;
  const { name, address, useCase, status, targetTenantId } = req.body;

  if (!name || !address || !useCase) {
    return res.status(400).json({ error: 'Name, address, and useCase are required' });
  }

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

  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', requirePermission('projects.update'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { tenantId, role } = req.user!;
  const { name, address, useCase, status } = req.body;

  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', requirePermission('projects.delete'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { tenantId, role } = req.user!;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (role !== 'SUPER_ADMIN' && project.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
