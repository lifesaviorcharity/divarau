import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find "Sydney" city
  const sydney = await prisma.city.findFirst({
    where: { name: { contains: "سیدنی" } }
  });

  if (!sydney) {
    console.error("Could not find city Sydney");
    return;
  }

  // Find a user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("Could not find any user");
    return;
  }

  // Get some categories and subcategories
  const categories = await prisma.jobCategory.findMany({
    include: { subCategories: true }
  });

  if (categories.length === 0) {
    console.error("No categories found");
    return;
  }

  console.log(`Found Sydney ID: ${sydney.id}, User ID: ${user.id}`);

  let createdCount = 0;

  for (let i = 1; i <= 75; i++) {
    // Pick a random category
    const catIndex = Math.floor(Math.random() * categories.length);
    const category = categories[catIndex];
    
    // Pick a random subcategory if exists
    let subCategoryId = category.subCategories[0]?.id;
    if (category.subCategories.length > 0) {
      const subIndex = Math.floor(Math.random() * category.subCategories.length);
      subCategoryId = category.subCategories[subIndex].id;
    }

    if (!subCategoryId) continue;

    await prisma.job.create({
      data: {
        userId: user.id,
        cityId: sydney.id,
        categoryId: category.id,
        subCategoryId: subCategoryId,
        title: `شغل تستی شماره ${i} در سیدنی`,
        description: `این یک توضیح تستی برای شغل شماره ${i} است. این شغل برای تست صفحه بندی و اسکرول بینهایت ایجاد شده است.`,
        phone: `04000000${i.toString().padStart(2, '0')}`,
        subscriptionType: 'SIX_MONTHS',
        status: 'FINAL', // Set to FINAL so it appears on the jobs page
        viewCount: Math.floor(Math.random() * 100),
      }
    });

    createdCount++;
  }

  console.log(`Successfully created ${createdCount} jobs in Sydney.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
