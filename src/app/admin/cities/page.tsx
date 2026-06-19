import prisma from "@/lib/prisma";
import CitiesClient from "./CitiesClient";

export const dynamic = 'force-dynamic';

export default async function AdminCitiesPage() {
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
