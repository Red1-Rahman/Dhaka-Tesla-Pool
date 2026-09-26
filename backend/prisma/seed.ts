// Seeds the story cast from the brief: Jashim drives Bullet (capacity 3),
// Nusrat, Rafiq, and Shirin are passengers. Safe to run more than once,
// upsert means re-running this will not create duplicates.
//
// Demo login for every seeded user: password123

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const jashim = await prisma.user.upsert({
    where: { phone: '01700000000' },
    update: {},
    create: {
      name: 'Jashim',
      phone: '01700000000',
      passwordHash,
      role: Role.DRIVER,
    },
  });

  await prisma.vehicle.upsert({
    where: { driverId: jashim.id },
    update: {},
    create: {
      driverId: jashim.id,
      name: 'Bullet',
      capacity: 3,
      isOnline: true,
    },
  });

  const passengers = [
    { name: 'Nusrat', phone: '01700000001' },
    { name: 'Rafiq', phone: '01700000002' },
    { name: 'Shirin', phone: '01700000003' },
  ];

  for (const passenger of passengers) {
    await prisma.user.upsert({
      where: { phone: passenger.phone },
      update: {},
      create: {
        name: passenger.name,
        phone: passenger.phone,
        passwordHash,
        role: Role.PASSENGER,
      },
    });
  }

  console.log('Seed complete: Jashim (Bullet, capacity 3), Nusrat, Rafiq, Shirin');
  console.log(`Demo password for every user: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
