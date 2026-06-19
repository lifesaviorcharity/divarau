const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://divusr:X%404wmTqWSg%24ds%21%3E-@localhost:5432/divarau?schema=public"
    }
  }
});

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "AdStatus" ADD VALUE IF NOT EXISTS 'NEEDS_EDIT'`);
    console.log("Enum updated successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
