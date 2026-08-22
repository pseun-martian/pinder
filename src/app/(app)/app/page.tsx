import { PlacesView } from "@/components/places/places-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string }>;
}) {
  const params = await searchParams;
  const tags = params.tags ? params.tags.split(",").filter(Boolean) : undefined;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">전체 도시</h2>
      <PlacesView search={params.search} tags={tags} />
    </div>
  );
}
