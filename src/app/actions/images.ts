"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

const BUCKET = "place-images";

export type UploadUrlResult =
  | { error: string; signedUrl?: never; path?: never; token?: never }
  | { error: null; signedUrl: string; path: string; token: string };

/**
 * Mints a Storage signed-upload URL so the browser can PUT the (already
 * client-side resized/compressed) image directly to Supabase, without the
 * bytes ever passing through a Next.js server function.
 */
export async function getImageUploadUrl(
  placeId: string,
  fileExt: string,
): Promise<UploadUrlResult> {
  const { user, supabase } = await verifySession();

  // Confirm this place actually belongs to the caller before handing out a
  // path inside their storage folder (RLS also enforces this at write time,
  // this is just a clearer error message).
  const { data: place } = await supabase
    .from("places")
    .select("id")
    .eq("id", placeId)
    .maybeSingle();
  if (!place) return { error: "장소를 찾을 수 없어요." };

  const safeExt = fileExt.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const path = `${user.id}/${placeId}/${crypto.randomUUID()}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return { error: "업로드 URL을 만들지 못했어요." };

  return { error: null, signedUrl: data.signedUrl, path: data.path, token: data.token };
}

export async function confirmPlaceImage(
  placeId: string,
  storagePath: string,
  position: number,
): Promise<{ error: string | null; imageId?: string }> {
  const { user, supabase } = await verifySession();

  const { data, error } = await supabase
    .from("place_images")
    .insert({ place_id: placeId, user_id: user.id, storage_path: storagePath, position })
    .select("id")
    .single();
  if (error || !data) return { error: "이미지 저장에 실패했어요." };

  revalidatePath("/app", "layout");
  return { error: null, imageId: data.id };
}

export async function deletePlaceImage(
  imageId: string,
  storagePath: string,
): Promise<{ error: string | null }> {
  const { supabase } = await verifySession();

  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } = await supabase.from("place_images").delete().eq("id", imageId);
  if (error) return { error: "이미지를 삭제하지 못했어요." };

  revalidatePath("/app", "layout");
  return { error: null };
}
