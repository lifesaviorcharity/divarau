const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({});
  for (const user of users) {
    if (user.mobile.includes('411111111') || user.mobile.includes('0411111111') || user.mobile.includes('+61411111111')) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log('Promoted user:', user.mobile);
    }
  }
}

main().finally(() => prisma.$disconnect());
