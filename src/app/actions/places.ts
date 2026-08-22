"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { syncPlaceTags } from "@/lib/data/tags";
import type { ActionResult } from "@/app/actions/cities";

function readPlaceForm(formData: FormData) {
  return {
    cityId: String(formData.get("cityId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    mapsUrl: String(formData.get("mapsUrl") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    tags: formData
      .getAll("tags")
      .map((t) => String(t).trim())
      .filter(Boolean),
  };
}

export async function createPlace(
  formData: FormData,
): Promise<ActionResult & { placeId?: string }> {
  const { user, supabase } = await verifySession();
  const { cityId, name, mapsUrl, address, notes, tags } = readPlaceForm(formData);

  if (!cityId) return { error: "도시를 선택해 주세요." };
  if (!name) return { error: "장소 이름을 입력해 주세요." };

  const { data, error } = await supabase
    .from("places")
    .insert({ user_id: user.id, city_id: cityId, name, maps_url: mapsUrl, address, notes })
    .select("id")
    .single();
  if (error || !data) return { error: "장소를 저장하지 못했어요." };

  await syncPlaceTags(supabase, user.id, data.id, tags);

  revalidatePath("/app", "layout");
  return { error: null, placeId: data.id };
}

export async function updatePlace(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, supabase } = await verifySession();
  const placeId = String(formData.get("placeId") ?? "");
  const { cityId, name, mapsUrl, address, notes, tags } = readPlaceForm(formData);

  if (!placeId) return { error: "잘못된 요청이에요." };
  if (!cityId) return { error: "도시를 선택해 주세요." };
  if (!name) return { error: "장소 이름을 입력해 주세요." };

  const { error } = await supabase
    .from("places")
    .update({ city_id: cityId, name, maps_url: mapsUrl, address, notes })
    .eq("id", placeId);
  if (error) return { error: "장소를 수정하지 못했어요." };

  await syncPlaceTags(supabase, user.id, placeId, tags);

  revalidatePath("/app", "layout");
  return { error: null };
}

export async function deletePlace(placeId: string): Promise<ActionResult> {
  const { user, supabase } = await verifySession();

  // Clean up this place's images in Storage before the row (and its
  // place_images rows) cascade-delete — otherwise the objects are orphaned.
  const { data: images } = await supabase
    .from("place_images")
    .select("storage_path")
    .eq("place_id", placeId);
  if (images?.length) {
    await supabase.storage
      .from("place-images")
      .remove(images.map((i) => i.storage_path));
  }

  const { error } = await supabase.from("places").delete().eq("id", placeId).eq("user_id", user.id);
  if (error) return { error: "장소를 삭제하지 못했어요." };

  revalidatePath("/app", "layout");
  return { error: null };
}
