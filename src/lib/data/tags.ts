import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Reconciles a place's tag set to exactly `tagNames` — creating any tags
 * that don't exist yet for this user, linking new ones, and unlinking (not
 * deleting — a tag may still be used elsewhere) ones that were removed.
 */
export async function syncPlaceTags(
  supabase: SupabaseClient<Database>,
  userId: string,
  placeId: string,
  tagNames: string[],
) {
  const cleaned = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];

  if (cleaned.length === 0) {
    await supabase.from("place_tags").delete().eq("place_id", placeId);
    return;
  }

  // Upsert every tag name for this user, then read back ids for all of them
  // (upsert with ignoreDuplicates keeps this idempotent across concurrent calls).
  await supabase
    .from("tags")
    .upsert(
      cleaned.map((name) => ({ user_id: userId, name })),
      { onConflict: "user_id,name", ignoreDuplicates: true },
    );

  const { data: tagRows, error: tagErr } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", cleaned);
  if (tagErr) throw tagErr;

  const tagIds = tagRows.map((t) => t.id);

  await supabase
    .from("place_tags")
    .upsert(
      tagIds.map((tag_id) => ({ place_id: placeId, tag_id, user_id: userId })),
      { onConflict: "place_id,tag_id", ignoreDuplicates: true },
    );

  await supabase
    .from("place_tags")
    .delete()
    .eq("place_id", placeId)
    .not("tag_id", "in", `(${tagIds.join(",") || "00000000-0000-0000-0000-000000000000"})`);
}

export type TagCount = { name: string; count: number };

/** All of a user's tags with how many places use each, for the filter UI. */
export async function getTagCounts(
  supabase: SupabaseClient<Database>,
): Promise<TagCount[]> {
  const { data, error } = await supabase
    .from("place_tags")
    .select("tags(name)");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data as unknown as { tags: { name: string } | null }[]) {
    const name = row.tags?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));
}
