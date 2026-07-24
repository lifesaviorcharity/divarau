import prisma from "@/lib/prisma";

export async function runJobsCleanup() {
  const now = new Date();
  const threshold48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // 1. Mark active jobs that reached expiresAt as EXPIRED
  const expiredByDate = await prisma.job.updateMany({
    where: {
      status: { in: ["FINAL", "PAID", "APPROVED"] },
      expiresAt: { lt: now }
    },
    data: {
      status: "EXPIRED"
    }
  });

  // 2. Delete initial APPROVED jobs that were never paid within 48 hours
  const unpaidJobs = await prisma.job.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { approvedAt: { lt: threshold48h } },
        { approvedAt: null, createdAt: { lt: threshold48h } }
      ]
    }
  });

  let deletedUnpaidCount = 0;
  if (unpaidJobs.length > 0) {
    const unpaidJobIds = unpaidJobs.map((job) => job.id);
    const res = await prisma.job.deleteMany({
      where: { id: { in: unpaidJobIds } }
    });
    deletedUnpaidCount = res.count;
  }

  return {
    success: true,
    expiredJobsCount: expiredByDate.count,
    deletedUnpaidJobsCount: deletedUnpaidCount
  };
}

export async function runAdsCleanup() {
  const now = new Date();

  // 1. Mark ads that reached their explicit expiresAt as EXPIRED
  const expiredByDate = await prisma.ad.updateMany({
    where: {
      status: { in: ["FINAL", "APPROVED", "PAID"] },
      expiresAt: { lt: now }
    },
    data: {
      status: "EXPIRED"
    }
  });

  // 2. Fetch duration settings from database
  const settings = await prisma.systemSetting.findMany();
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const commercialDuration = parseInt(settingsMap.commercialAdDuration || "30");
  const freeCommercialDuration = parseInt(settingsMap.commercialFreeAdDuration || "30");
  const employmentDuration = parseInt(settingsMap.employmentAdDuration || "30");
  const jobSeekerDuration = parseInt(settingsMap.jobSeekerAdDuration || "30");

  // 3. Mark ads expired by duration cutoffs
  const cutoffCommercial = new Date(now.getTime() - commercialDuration * 24 * 60 * 60 * 1000);
  const cutoffFreeCommercial = new Date(now.getTime() - freeCommercialDuration * 24 * 60 * 60 * 1000);
  const cutoffEmployment = new Date(now.getTime() - employmentDuration * 24 * 60 * 60 * 1000);
  const cutoffJobSeeker = new Date(now.getTime() - jobSeekerDuration * 24 * 60 * 60 * 1000);

  const expiredCommercial = await prisma.ad.updateMany({
    where: {
      type: "COMMERCIAL",
      status: { in: ["FINAL", "APPROVED", "PAID"] },
      createdAt: { lt: cutoffCommercial }
    },
    data: { status: "EXPIRED" }
  });

  const expiredFreeCommercial = await prisma.ad.updateMany({
    where: {
      type: "COMMERCIAL_FREE",
      status: { in: ["FINAL", "APPROVED", "PAID"] },
      createdAt: { lt: cutoffFreeCommercial }
    },
    data: { status: "EXPIRED" }
  });

  const expiredEmployment = await prisma.ad.updateMany({
    where: {
      type: "EMPLOYMENT",
      status: { in: ["FINAL", "APPROVED", "PAID"] },
      createdAt: { lt: cutoffEmployment }
    },
    data: { status: "EXPIRED" }
  });

  const expiredJobSeeker = await prisma.ad.updateMany({
    where: {
      type: "JOB_SEEKER",
      status: { in: ["FINAL", "APPROVED", "PAID"] },
      createdAt: { lt: cutoffJobSeeker }
    },
    data: { status: "EXPIRED" }
  });

  const totalExpired =
    expiredByDate.count +
    expiredCommercial.count +
    expiredFreeCommercial.count +
    expiredEmployment.count +
    expiredJobSeeker.count;

  return {
    success: true,
    totalExpiredAds: totalExpired,
    details: {
      expiredByDate: expiredByDate.count,
      expiredCommercial: expiredCommercial.count,
      expiredFreeCommercial: expiredFreeCommercial.count,
      expiredEmployment: expiredEmployment.count,
      expiredJobSeeker: expiredJobSeeker.count
    }
  };
}
