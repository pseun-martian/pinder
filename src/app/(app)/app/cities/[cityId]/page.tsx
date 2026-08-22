import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlacesView } from "@/components/places/places-view";

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ cityId: string }>;
  searchParams: Promise<{ search?: string; tags?: string }>;
}) {
  const { cityId } = await params;
  const sp = await searchParams;
  const tags = sp.tags ? sp.tags.split(",").filter(Boolean) : undefined;

  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("name")
    .eq("id", cityId)
    .maybeSingle();
  if (!city) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <PlacesView cityId={cityId} search={sp.search} tags={tags} />
    </div>
  );
}
