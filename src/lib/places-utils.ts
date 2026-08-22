// Pure helpers shared by Server Components/Actions AND Client Components.
// Deliberately has no "server-only" import (unlike src/lib/data/places.ts) —
// PlaceCard (a Client Component) needs mapsUrlFor, and importing anything
// from a "server-only"-poisoned module would break its client bundle.

export function mapsUrlFor(place: {
  mapsUrl: string | null;
  name: string;
  address: string | null;
}) {
  if (place.mapsUrl && place.mapsUrl.trim()) return place.mapsUrl.trim();
  const q = [place.name, place.address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function filterPlaces<
  T extends { name: string; notes: string | null; tags: string[] },
>(places: T[], { search, tags }: { search?: string; tags?: string[] }): T[] {
  let result = places;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (tags && tags.length) {
    result = result.filter((p) => tags.every((t) => p.tags.includes(t)));
  }
  return result;
}
