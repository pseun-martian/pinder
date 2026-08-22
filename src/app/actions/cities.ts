"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export type ActionResult = { error: string | null };

export async function createCity(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, supabase } = await verifySession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "도시 이름을 입력해 주세요." };

  const { error } = await supabase.from("cities").insert({ user_id: user.id, name });
  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름의 도시가 있어요." };
    return { error: "도시를 추가하지 못했어요." };
  }

  revalidatePath("/app", "layout");
  return { error: null };
}

export async function renameCity(cityId: string, name: string): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const trimmed = name.trim();
  if (!trimmed) return { error: "도시 이름을 입력해 주세요." };

  const { error } = await supabase
    .from("cities")
    .update({ name: trimmed })
    .eq("id", cityId);
  if (error) return { error: "이름을 변경하지 못했어요." };

  revalidatePath("/app", "layout");
  return { error: null };
}

export async function deleteCity(cityId: string): Promise<ActionResult> {
  const { supabase } = await verifySession();
  const { error } = await supabase.from("cities").delete().eq("id", cityId);
  if (error) return { error: "도시를 삭제하지 못했어요." };

  revalidatePath("/app", "layout");
  return { error: null };
}
