import prisma from "@/lib/prisma";
import CitiesClient from "./CitiesClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminCitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/cities");
  }

  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: {
      country: true,
      _count: {
        select: { jobs: true, ads: true }
      }
    }
  });

  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" }
  });

  return <CitiesClient initialCities={cities} countries={countries} />;
}
