import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CityWithCount = {
  id: string;
  name: string;
  placeCount: number;
};

/** Sidebar city list with a per-city place count, sorted by name (ko). */
export async function getCitiesWithCounts(
  supabase: SupabaseClient<Database>,
): Promise<CityWithCount[]> {
  const { data: cities, error } = await supabase
    .from("cities")
    .select("id, name")
    .order("name");
  if (error) throw error;
  if (!cities.length) return [];

  const { data: places, error: placesError } = await supabase
    .from("places")
    .select("city_id");
  if (placesError) throw placesError;

  const counts = new Map<string, number>();
  for (const p of places) counts.set(p.city_id, (counts.get(p.city_id) ?? 0) + 1);

  return cities
    .map((c) => ({ id: c.id, name: c.name, placeCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}
