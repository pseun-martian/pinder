import { createClient } from "@/lib/supabase/server";
import { getPlacesForUser } from "@/lib/data/places";
import { getCitiesWithCounts } from "@/lib/data/cities";
import { TourWizard } from "@/components/tours/tour-wizard";

export default async function NewTourPage() {
  const supabase = await createClient();
  const [places, cities] = await Promise.all([
    getPlacesForUser(supabase),
    getCitiesWithCounts(supabase),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">새 투어</h2>
      <TourWizard places={places} cities={cities} />
    </div>
  );
}
