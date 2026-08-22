import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type PlaceImage = {
  id: string;
  url: string; // signed URL, 1hr TTL
  storagePath: string;
};

export type PlaceWithDetails = {
  id: string;
  cityId: string;
  cityName: string | null;
  name: string;
  mapsUrl: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  images: PlaceImage[]; // ordered by position, first = cover
  createdAt: string;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * All of a user's places (optionally scoped to one city), each with its
 * tags and signed image URLs resolved. Search/tag filtering happens in the
 * caller (personal-scale dataset — filtering in JS keeps the query simple
 * and mirrors the original prototype's client-side filter behavior).
 */
export async function getPlacesForUser(
  supabase: SupabaseClient<Database>,
  opts: { cityId?: string } = {},
): Promise<PlaceWithDetails[]> {
  let query = supabase
    .from("places")
    .select("id, city_id, name, maps_url, address, notes, created_at, cities(name)")
    .order("created_at", { ascending: false });
  if (opts.cityId) query = query.eq("city_id", opts.cityId);

  const { data: places, error } = await query;
  if (error) throw error;
  if (!places.length) return [];

  const placeIds = places.map((p) => p.id);

  const [{ data: tagRows, error: tagErr }, { data: imageRows, error: imgErr }] =
    await Promise.all([
      supabase
        .from("place_tags")
        .select("place_id, tags(name)")
        .in("place_id", placeIds),
      supabase
        .from("place_images")
        .select("id, place_id, storage_path, position")
        .in("place_id", placeIds)
        .order("position"),
    ]);
  if (tagErr) throw tagErr;
  if (imgErr) throw imgErr;

  const tagsByPlace = new Map<string, string[]>();
  for (const row of tagRows as unknown as {
    place_id: string;
    tags: { name: string } | null;
  }[]) {
    if (!row.tags) continue;
    const list = tagsByPlace.get(row.place_id) ?? [];
    list.push(row.tags.name);
    tagsByPlace.set(row.place_id, list);
  }

  const allPaths = imageRows.map((r) => r.storage_path);
  const signedByPath = new Map<string, string>();
  if (allPaths.length) {
    const { data: signed, error: signErr } = await supabase.storage
      .from("place-images")
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS);
    if (signErr) throw signErr;
    signed.forEach((s, i) => {
      if (s.signedUrl) signedByPath.set(allPaths[i], s.signedUrl);
    });
  }

  const imagesByPlace = new Map<string, PlaceImage[]>();
  for (const row of imageRows) {
    const url = signedByPath.get(row.storage_path);
    if (!url) continue;
    const list = imagesByPlace.get(row.place_id) ?? [];
    list.push({ id: row.id, url, storagePath: row.storage_path });
    imagesByPlace.set(row.place_id, list);
  }

  return places.map((p) => ({
    id: p.id,
    cityId: p.city_id,
    cityName: (p.cities as unknown as { name: string } | null)?.name ?? null,
    name: p.name,
    mapsUrl: p.maps_url,
    address: p.address,
    notes: p.notes,
    tags: tagsByPlace.get(p.id) ?? [],
    images: imagesByPlace.get(p.id) ?? [],
    createdAt: p.created_at,
  }));
}
