import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type TourSummary = {
  id: string;
  title: string;
  cityId: string | null;
  cityName: string | null;
  startDate: string;
  endDate: string;
  dayCount: number;
  placeCount: number;
  shareEnabled: boolean;
  shareToken: string | null;
};

export async function getToursForUser(
  supabase: SupabaseClient<Database>,
): Promise<TourSummary[]> {
  const { data: tours, error } = await supabase
    .from("tours")
    .select("id, title, city_id, start_date, end_date, share_enabled, share_token, cities(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!tours.length) return [];

  const { data: days, error: daysErr } = await supabase
    .from("tour_days")
    .select("tour_id, place_ids")
    .in(
      "tour_id",
      tours.map((t) => t.id),
    );
  if (daysErr) throw daysErr;

  const dayCount = new Map<string, number>();
  const placeCount = new Map<string, number>();
  for (const d of days) {
    dayCount.set(d.tour_id, (dayCount.get(d.tour_id) ?? 0) + 1);
    placeCount.set(d.tour_id, (placeCount.get(d.tour_id) ?? 0) + d.place_ids.length);
  }

  return tours.map((t) => ({
    id: t.id,
    title: t.title,
    cityId: t.city_id,
    cityName: (t.cities as unknown as { name: string } | null)?.name ?? null,
    startDate: t.start_date,
    endDate: t.end_date,
    dayCount: dayCount.get(t.id) ?? 0,
    placeCount: placeCount.get(t.id) ?? 0,
    shareEnabled: t.share_enabled,
    shareToken: t.share_token,
  }));
}

export type TourDay = {
  id: string;
  dayIndex: number;
  date: string;
  placeIds: string[];
};

export type TourDetail = {
  id: string;
  title: string;
  cityId: string | null;
  cityName: string | null;
  startDate: string;
  endDate: string;
  shareEnabled: boolean;
  shareToken: string | null;
  days: TourDay[];
};

export async function getTourDetail(
  supabase: SupabaseClient<Database>,
  tourId: string,
): Promise<TourDetail | null> {
  const { data: tour, error } = await supabase
    .from("tours")
    .select(
      "id, title, city_id, start_date, end_date, share_enabled, share_token, cities(name)",
    )
    .eq("id", tourId)
    .maybeSingle();
  if (error) throw error;
  if (!tour) return null;

  const { data: days, error: daysErr } = await supabase
    .from("tour_days")
    .select("id, day_index, date, place_ids")
    .eq("tour_id", tourId)
    .order("day_index");
  if (daysErr) throw daysErr;

  return {
    id: tour.id,
    title: tour.title,
    cityId: tour.city_id,
    cityName: (tour.cities as unknown as { name: string } | null)?.name ?? null,
    startDate: tour.start_date,
    endDate: tour.end_date,
    shareEnabled: tour.share_enabled,
    shareToken: tour.share_token,
    days: days.map((d) => ({
      id: d.id,
      dayIndex: d.day_index,
      date: d.date,
      placeIds: d.place_ids,
    })),
  };
}
