import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create permissions
  const permissionsList = [
    'projects.create', 'projects.read', 'projects.update', 'projects.delete',
    'users.create', 'users.read', 'users.update', 'users.delete',
    'permissions.manage'
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm },
    });
  }

  // Create default tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Default Organization',
    },
  });

  // Create superadmin user
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
