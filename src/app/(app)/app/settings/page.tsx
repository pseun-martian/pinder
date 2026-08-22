import { verifySession } from "@/lib/dal";
import { getCitiesWithCounts } from "@/lib/data/cities";
import { CityManager } from "@/components/app-shell/city-manager";
import { LogoutButton } from "@/components/app-shell/logout-button";

export default async function SettingsPage() {
  const { user, supabase } = await verifySession();
  const cities = await getCitiesWithCounts(supabase);

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <div>
        <h2 className="text-lg font-semibold mb-4">설정</h2>
        <div className="border border-line px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink/50 mb-0.5">계정</p>
            <p className="text-sm">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2.5">도시 관리</h3>
        <CityManager cities={cities} />
      </div>
    </div>
  );
}
