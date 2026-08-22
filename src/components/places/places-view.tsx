import { createClient } from "@/lib/supabase/server";
import { getPlacesForUser } from "@/lib/data/places";
import { getTagCounts } from "@/lib/data/tags";
import { getCitiesWithCounts } from "@/lib/data/cities";
import { filterPlaces } from "@/lib/places-utils";
import { CityTabs } from "@/components/app-shell/city-tabs";
import { SearchFilterBar } from "@/components/places/search-filter-bar";
import { PlacesBoard } from "@/components/places/places-board";

/**
 * Composes the places dashboard for both /app (all cities) and
 * /app/cities/[cityId] (one city) — the only difference is whether the
 * underlying query is scoped by city.
 */
export async function PlacesView({
  cityId,
  search,
  tags,
}: {
  cityId?: string;
  search?: string;
  tags?: string[];
}) {
  const supabase = await createClient();
  const [allPlaces, tagCounts, cities] = await Promise.all([
    getPlacesForUser(supabase, { cityId }),
    getTagCounts(supabase),
    getCitiesWithCounts(supabase),
  ]);

  const places = filterPlaces(allPlaces, { search, tags });

  return (
    <div>
      <CityTabs cities={cities} />
      <SearchFilterBar tagCounts={tagCounts} />
      <PlacesBoard places={places} cities={cities} defaultCityId={cityId} />
    </div>
  );
}
