import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTourDetail } from "@/lib/data/tours";
import { getPlacesForUser, type PlaceWithDetails } from "@/lib/data/places";
import { getCitiesWithCounts } from "@/lib/data/cities";
import { TourBoard } from "@/components/tours/tour-board";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const supabase = await createClient();

  const [tour, allPlaces, cities] = await Promise.all([
    getTourDetail(supabase, tourId),
    getPlacesForUser(supabase),
    getCitiesWithCounts(supabase),
  ]);
  if (!tour) notFound();

  const placesById: Record<string, PlaceWithDetails> = {};
  for (const p of allPlaces) placesById[p.id] = p;

  return (
    <div className="max-w-4xl mx-auto">
      <TourBoard tour={tour} placesById={placesById} allPlaces={allPlaces} cities={cities} />
    </div>
  );
}
