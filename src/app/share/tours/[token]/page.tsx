import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapsUrlFor } from "@/lib/places-utils";
import { fmtDateLong } from "@/lib/dates";

// Short ISR: anonymous viewers may hit this often, and the payload rarely
// changes between visits. Safe against the image signed-URL 1hr TTL since
// this window (60s) is far shorter — a stale cached page never serves an
// expired signed URL.
export const revalidate = 60;

type SharedTour = {
  id: string;
  title: string;
  city_id: string | null;
  start_date: string;
  end_date: string;
  share_enabled: boolean;
  share_token: string;
  created_at: string;
};
type SharedDay = { id: string; tour_id: string; day_index: number; date: string; place_ids: string[] };
type SharedPlace = {
  id: string;
  city_id: string;
  name: string;
  maps_url: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
type SharedImage = { id: string; place_id: string; storage_path: string; position: number };
type SharedCity = { id: string; name: string; created_at: string } | null;

type SharedPayload = {
  tour: SharedTour;
  days: SharedDay[];
  places: SharedPlace[];
  place_images: SharedImage[];
  city: SharedCity;
};

export default async function SharedTourPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_shared_tour", { p_token: token });
  if (error) throw error;

  const payload = data as unknown as SharedPayload | null;
  if (!payload || !payload.tour) notFound();

  const { tour, days, places, place_images: images, city } = payload;

  // The `place-images` Storage bucket is private with no anonymous read
  // policy, so signed URLs are minted here with the service-role client —
  // narrowly scoped to exactly the paths get_shared_tour already vetted as
  // belonging to this one publicly-shared tour.
  const paths = images.map((img) => img.storage_path);
  const signedByPath = new Map<string, string>();
  if (paths.length) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("place-images")
      .createSignedUrls(paths, 3600);
    signed?.forEach((s, i) => {
      if (s.signedUrl) signedByPath.set(paths[i], s.signedUrl);
    });
  }

  const placesById = new Map(places.map((p) => [p.id, p]));
  const imagesByPlace = new Map<string, string[]>();
  for (const img of [...images].sort((a, b) => a.position - b.position)) {
    const url = signedByPath.get(img.storage_path);
    if (!url) continue;
    const list = imagesByPlace.get(img.place_id) ?? [];
    list.push(url);
    imagesByPlace.set(img.place_id, list);
  }

  const sortedDays = [...days].sort((a, b) => a.day_index - b.day_index);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-10">
      <p className="text-xs text-ink/50 mb-1">공유된 투어 · 읽기 전용</p>
      <h1 className="text-xl font-semibold mb-1">{tour.title}</h1>
      <p className="text-sm text-ink/60 mb-8">
        {city?.name ?? "전체 도시"} · {fmtDateLong(tour.start_date)} – {fmtDateLong(tour.end_date)}
      </p>

      <div className="flex flex-col gap-6">
        {sortedDays.map((day, i) => (
          <section key={day.id} className="border border-line">
            <div className="px-4 py-3 border-b border-line">
              <p className="text-sm font-medium">Day {i + 1}</p>
              <p className="text-[10.5px] text-ink/50">{fmtDateLong(day.date)}</p>
            </div>
            <div className="flex flex-col">
              {day.place_ids.length === 0 && (
                <p className="text-xs text-ink/40 px-4 py-6 text-center">
                  이 날엔 등록된 장소가 없어요.
                </p>
              )}
              {day.place_ids.map((placeId) => {
                const place = placesById.get(placeId);
                if (!place) return null;
                const cover = imagesByPlace.get(placeId)?.[0];
                return (
                  <div
                    key={placeId}
                    className="flex items-center gap-3 px-4 py-3 border-b border-line-soft last:border-b-0"
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL
                      <img
                        src={cover}
                        alt=""
                        className="w-14 h-14 object-cover border border-line shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 border border-line shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{place.name}</p>
                      {place.address && (
                        <p className="text-xs text-ink/60 truncate">{place.address}</p>
                      )}
                      {place.notes && (
                        <p className="text-xs text-ink/50 line-clamp-1">{place.notes}</p>
                      )}
                    </div>
                    <a
                      href={mapsUrlFor({
                        mapsUrl: place.maps_url,
                        name: place.name,
                        address: place.address,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs shrink-0 border border-line px-2.5 py-1.5 hover:bg-ink hover:text-paper"
                    >
                      지도
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
