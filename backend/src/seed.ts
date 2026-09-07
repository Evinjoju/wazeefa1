import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = 'superadmin@example.com';
  const superAdminPassword = 'password123';
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  // Check if super admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existingAdmin) {
    console.log('Super Admin already exists!');
    return;
  }

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: superAdminEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('---------------------------------');
  console.log(`Login Email: ${superAdminEmail}`);
  console.log(`Login Password: ${superAdminPassword}`);
  console.log('---------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
