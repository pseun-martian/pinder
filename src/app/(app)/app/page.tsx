import { PlacesView } from "@/components/places/places-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string }>;
}) {
  const params = await searchParams;
  const tags = params.tags ? params.tags.split(",").filter(Boolean) : undefined;

  return (
    <div className="max-w-xl mx-auto">
      <PlacesView search={params.search} tags={tags} />
    </div>
  );
}
