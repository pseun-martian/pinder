"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { addDaysISO, diffDaysISO } from "@/lib/dates";
import type { ActionResult } from "@/app/actions/cities";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;
type DayRow = { day_index: number; date: string; place_ids: string[] };

async function getOwnedTourDays(supabase: Supabase, tourId: string): Promise<DayRow[]> {
  const { data, error } = await supabase
    .from("tour_days")
    .select("day_index, date, place_ids")
    .eq("tour_id", tourId)
    .order("day_index");
  if (error) throw error;
  return data;
}

/** Overwrites every day row for a tour with a freshly re-sequenced set. */
async function saveTourDays(supabase: Supabase, tourId: string, days: DayRow[]) {
  const reindexed = days.map((d, i) => ({ tour_id: tourId, day_index: i, date: d.date, place_ids: d.place_ids }));
  const { error } = await supabase
    .from("tour_days")
    .upsert(reindexed, { onConflict: "tour_id,day_index" });
  if (error) throw error;

  if (reindexed.length) {
    await supabase
      .from("tours")
      .update({ start_date: reindexed[0].date, end_date: reindexed[reindexed.length - 1].date })
      .eq("id", tourId);
  }
}

function revalidateTour(tourId: string) {
  revalidatePath(`/app/tours/${tourId}`);
  revalidatePath("/app/tours");
}

export async function createTour(
  _prev: ActionResult & { tourId?: string },
  formData: FormData,
): Promise<ActionResult & { tourId?: string }> {
  const { user, supabase } = await verifySession();

  const title = String(formData.get("title") ?? "").trim() || "제목 없는 투어";
  const cityIdRaw = String(formData.get("cityId") ?? "all");
  const cityId = cityIdRaw === "all" ? null : cityIdRaw;
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const placeIds = formData.getAll("placeIds").map(String);

  if (!start || !end) return { error: "여행 날짜를 선택해 주세요." };
  if (!placeIds.length) return { error: "장소를 1곳 이상 선택해 주세요." };

  const numDays = Math.max(1, diffDaysISO(start, end) + 1);
  const perDay = Math.max(1, Math.ceil(placeIds.length / numDays));

  const { data: tour, error } = await supabase
    .from("tours")
    .insert({ user_id: user.id, title, city_id: cityId, start_date: start, end_date: end })
    .select("id")
    .single();
  if (error || !tour) return { error: "투어를 만들지 못했어요." };

  const days: DayRow[] = Array.from({ length: numDays }, (_, i) => ({
    day_index: i,
    date: addDaysISO(start, i),
    place_ids: placeIds.slice(i * perDay, (i + 1) * perDay),
  }));
  await saveTourDays(supabase, tour.id, days);

  revalidatePath("/app/tours");
  return { error: null, tourId: tour.id };
}

export async function updateTourMeta(
  tourId: string,
  input: { title?: string; cityId?: string | null },
): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const patch: Database["public"]["Tables"]["tours"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title.trim() || "제목 없는 투어";
  if (input.cityId !== undefined) patch.city_id = input.cityId;

  const { error } = await supabase.from("tours").update(patch).eq("id", tourId);
  if (error) return { error: "투어 정보를 수정하지 못했어요." };
  revalidateTour(tourId);
  return { error: null };
}

export async function deleteTour(tourId: string): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const { error } = await supabase.from("tours").delete().eq("id", tourId);
  if (error) return { error: "투어를 삭제하지 못했어요." };
  revalidatePath("/app/tours");
  return { error: null };
}

export async function addTourDay(tourId: string): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const days = await getOwnedTourDays(supabase, tourId);
  const last = days[days.length - 1];
  const date = last ? addDaysISO(last.date, 1) : new Date().toISOString().slice(0, 10);
  days.push({ day_index: days.length, date, place_ids: [] });
  await saveTourDays(supabase, tourId, days);
  revalidateTour(tourId);
  return { error: null };
}

export async function removeTourDay(tourId: string, dayIndex: number): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const days = await getOwnedTourDays(supabase, tourId);
  if (days.length <= 1) return { error: "마지막 남은 날짜는 삭제할 수 없어요." };
  days.splice(dayIndex, 1);
  await saveTourDays(supabase, tourId, days);
  revalidateTour(tourId);
  return { error: null };
}

export async function moveTourPlace(
  tourId: string,
  placeId: string,
  fromDay: number,
  toDay: number,
): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const days = await getOwnedTourDays(supabase, tourId);
  const src = days[fromDay]?.place_ids;
  if (!src) return { error: null };
  const idx = src.indexOf(placeId);
  if (idx !== -1) src.splice(idx, 1);
  days[toDay]?.place_ids.push(placeId);
  await saveTourDays(supabase, tourId, days);
  revalidateTour(tourId);
  return { error: null };
}

export async function reorderTourPlace(
  tourId: string,
  dayIndex: number,
  placeId: string,
  direction: -1 | 1,
): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const days = await getOwnedTourDays(supabase, tourId);
  const arr = days[dayIndex]?.place_ids;
  if (!arr) return { error: null };
  const i = arr.indexOf(placeId);
  const j = i + direction;
  if (i === -1 || j < 0 || j >= arr.length) return { error: null };
  [arr[i], arr[j]] = [arr[j], arr[i]];
  await saveTourDays(supabase, tourId, days);
  revalidateTour(tourId);
  return { error: null };
}

export async function removePlaceFromTour(
  tourId: string,
  dayIndex: number,
  placeId: string,
): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const days = await getOwnedTourDays(supabase, tourId);
  const day = days[dayIndex];
  if (day) day.place_ids = day.place_ids.filter((id) => id !== placeId);
  await saveTourDays(supabase, tourId, days);
  revalidateTour(tourId);
  return { error: null };
}

export async function addPlaceToTourDay(
  tourId: string,
  dayIndex: number,
  placeId: string,
): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const days = await getOwnedTourDays(supabase, tourId);
  // A place appears in exactly one day at a time — remove any prior slot first.
  days.forEach((d) => {
    d.place_ids = d.place_ids.filter((id) => id !== placeId);
  });
  days[dayIndex]?.place_ids.push(placeId);
  await saveTourDays(supabase, tourId, days);
  revalidateTour(tourId);
  return { error: null };
}

export async function setTourShare(
  tourId: string,
  enabled: boolean,
): Promise<ActionResult & { shareUrl?: string }> {
  const { supabase } = await verifySession();
  const patch: { share_enabled: boolean; share_token?: string } = { share_enabled: enabled };
  if (enabled) {
    const { data: existing } = await supabase
      .from("tours")
      .select("share_token")
      .eq("id", tourId)
      .maybeSingle();
    patch.share_token = existing?.share_token ?? crypto.randomUUID().replace(/-/g, "");
  }

  const { data, error } = await supabase
    .from("tours")
    .update(patch)
    .eq("id", tourId)
    .select("share_token")
    .single();
  if (error || !data) return { error: "공유 설정을 변경하지 못했어요." };

  revalidateTour(tourId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return {
    error: null,
    shareUrl: enabled && data.share_token ? `${siteUrl}/share/tours/${data.share_token}` : undefined,
  };
}

export async function rotateTourShareToken(
  tourId: string,
): Promise<ActionResult & { shareUrl?: string }> {
  const { supabase } = await verifySession();
  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase
    .from("tours")
    .update({ share_token: token, share_enabled: true })
    .eq("id", tourId);
  if (error) return { error: "링크를 재발급하지 못했어요." };

  revalidateTour(tourId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return { error: null, shareUrl: `${siteUrl}/share/tours/${token}` };
}
