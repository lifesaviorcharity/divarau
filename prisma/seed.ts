import { PrismaClient } from '@prisma/client';
import { jobCategories, australianCities } from '../src/data/categories';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Default Country
  const country = await prisma.country.upsert({
    where: { code: 'AU' },
    update: {},
    create: {
      name: 'استرالیا',
      code: 'AU',
      isDefault: true,
    },
  });
  console.log('Created country:', country.name);

  // 2. Create Cities
  console.log('Creating cities...');
  for (const city of australianCities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name },
      create: {
        name: city.name,
        slug: city.slug,
        countryId: country.id,
      },
    });
  }

  // 3. Create Job Categories and SubCategories
  console.log('Creating job categories...');
  for (let i = 0; i < jobCategories.length; i++) {
    const categoryData = jobCategories[i];
    const category = await prisma.jobCategory.upsert({
      where: { name: categoryData.name },
      update: {
        icon: categoryData.icon,
        displayOrder: i,
      },
      create: {
        name: categoryData.name,
        icon: categoryData.icon,
        displayOrder: i,
      },
    });

    for (const sub of categoryData.subCategories) {
      await prisma.jobSubCategory.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          categoryId: category.id,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          categoryId: category.id,
        },
      });
    }
  }

  // 4. Create Users
  console.log('Creating users...');
  const adminUser = await prisma.user.upsert({
    where: { mobile: '0400000000' },
    update: {},
    create: {
      mobile: '0400000000',
      username: 'admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const normalUser1 = await prisma.user.upsert({
    where: { mobile: '0412345678' },
    update: {},
    create: {
      mobile: '0412345678',
      username: 'mohammadR',
      role: 'USER',
      isActive: true,
    },
  });

  const normalUser2 = await prisma.user.upsert({
    where: { mobile: '0432111222' },
    update: {},
    create: {
      mobile: '0432111222',
      username: 'saraM',
      role: 'USER',
      isActive: true,
    },
  });

  // 5. Create System Settings
  console.log('Creating system settings...');
  const settings = [
    { key: 'SUBSCRIPTION_6M_PRICE', value: '150' },
    { key: 'SUBSCRIPTION_12M_PRICE', value: '250' },
    { key: 'VIP_BOOST_PRICE', value: '50' },
    { key: 'AD_FREE_DURATION_DAYS', value: '10' },
    { key: 'AD_COMMERCIAL_PRICE', value: '20' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Fetch created categories and cities for linking
  const sydney = await prisma.city.findUnique({ where: { slug: 'sydney' } });
  const melbourne = await prisma.city.findUnique({ where: { slug: 'melbourne' } });
  const medicalCategory = await prisma.jobCategory.findUnique({ where: { name: 'پزشکی و خدمات بالینی' } });
  const dentistSub = await prisma.jobSubCategory.findUnique({ where: { slug: 'dentist' } });
  const generalSub = await prisma.jobSubCategory.findUnique({ where: { slug: 'general-practitioner' } });
  
  const publicServicesCategory = await prisma.jobCategory.findUnique({ where: { name: 'خدمات عمومی' } });
  const realEstateSub = await prisma.jobSubCategory.findUnique({ where: { slug: 'real-estate' } });

  // 6. Create Jobs
  console.log('Creating jobs...');
  if (sydney && melbourne && medicalCategory && dentistSub && generalSub && publicServicesCategory && realEstateSub) {
    
    // Check if jobs already exist for user to avoid unique constraint violations
    const existingJob1 = await prisma.job.findFirst({
        where: { userId: normalUser1.id, cityId: sydney.id }
    });

    if (!existingJob1) {
        await prisma.job.create({
        data: {
            userId: normalUser1.id,
            cityId: sydney.id,
            categoryId: medicalCategory.id,
            subCategoryId: dentistSub.id,
            title: 'کلینیک دندانپزشکی پارس',
            description: 'ارائه کلیه خدمات دندانپزشکی با بهترین کیفیت و تجهیزات روز.',
            phone: '0412345678',
            address: '123 George St, Sydney NSW 2000',
            subscriptionType: 'SIX_MONTHS',
            isVip: true,
            status: 'FINAL',
            finalApprovedAt: new Date(),
        },
        });
    }

    const existingJob2 = await prisma.job.findFirst({
        where: { userId: normalUser2.id, cityId: melbourne.id }
    });

    if (!existingJob2) {
        await prisma.job.create({
        data: {
            userId: normalUser2.id,
            cityId: melbourne.id,
            categoryId: medicalCategory.id,
            subCategoryId: generalSub.id,
            title: 'مطب دکتر احمدی',
            description: 'پزشک عمومی با سابقه کار در ایران و استرالیا.',
            phone: '0432111222',
            address: '456 Collins St, Melbourne VIC 3000',
            subscriptionType: 'TWELVE_MONTHS',
            isVip: false,
            status: 'APPROVED',
            approvedAt: new Date(),
        },
        });
    }

    const existingJob3 = await prisma.job.findFirst({
        where: { userId: adminUser.id, cityId: sydney.id }
    });

    if (!existingJob3) {
        await prisma.job.create({
        data: {
            userId: adminUser.id,
            cityId: sydney.id,
            categoryId: publicServicesCategory.id,
            subCategoryId: realEstateSub.id,
            title: 'مشاور املاک نگین',
            description: 'خرید، فروش و اجاره ملک در سیدنی.',
            phone: '0400000000',
            address: '789 Pitt St, Sydney NSW 2000',
            subscriptionType: 'SIX_MONTHS',
            isVip: true,
            isBoosted: true,
            boostPeriod: 'SEVEN_DAYS',
            status: 'FINAL',
            finalApprovedAt: new Date(),
        },
        });
    }

    // 7. Create Ads
    console.log('Creating ads...');
    await prisma.ad.createMany({
        skipDuplicates: true,
        data: [
            {
                userId: normalUser1.id,
                cityId: sydney.id,
                categoryId: publicServicesCategory.id,
                subCategoryId: realEstateSub.id,
                type: 'EMPLOYMENT',
                title: 'استخدام منشی مطب',
                description: 'به یک منشی مسلط به زبان انگلیسی و فارسی جهت کار در مطب دندانپزشکی نیازمندیم.',
                status: 'FINAL',
            },
            {
                userId: normalUser2.id,
                cityId: melbourne.id,
                categoryId: medicalCategory.id,
                subCategoryId: generalSub.id,
                type: 'JOB_SEEKER',
                title: 'جویای کار پاره وقت در مطب',
                description: 'دانشجوی پزشکی هستم و جویای کار پاره وقت در مطب یا کلینیک پزشکی می باشم.',
                status: 'APPROVED',
            }
        ]
    });
  }

  // 8. Create Banners
  console.log('Creating banners...');
  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
        {
            imageUrl: '/banners/banner1.jpg',
            link: '#',
            position: 1,
            displayOrder: 1,
        },
        {
            imageUrl: '/banners/banner2.jpg',
            link: '#',
            position: 2,
            displayOrder: 2,
        },
        {
            imageUrl: '/banners/banner3.jpg',
            link: '#',
            position: 3,
            displayOrder: 3,
        }
    ]
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
