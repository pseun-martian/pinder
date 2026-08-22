"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { deleteCity } from "@/app/actions/cities";
import { AddCityForm } from "@/components/app-shell/add-city-form";
import type { CityWithCount } from "@/lib/data/cities";

/**
 * Horizontal, scrollable city-filter tabs shown above the places feed —
 * replaces the old vertical city list now that city selection lives above
 * a narrow center feed instead of in a left sidebar (the left column is now
 * the persistent app-wide nav in left-nav.tsx).
 */
export function CityTabs({ cities }: { cities: CityWithCount[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeCityId = pathname.startsWith("/app/cities/")
    ? pathname.split("/")[3]
    : pathname === "/app"
      ? "all"
      : null;

  async function handleDelete(cityId: string, name: string) {
    if (!confirm(`"${name}" 도시와 저장된 장소를 모두 삭제할까요?`)) return;
    await deleteCity(cityId);
    if (activeCityId === cityId) router.push("/app");
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-line-soft">
      <Link
        href="/app"
        className={`shrink-0 px-3 py-1.5 text-sm font-medium border ${
          activeCityId === "all" ? "bg-ink text-paper border-ink" : "border-line text-ink/70 hover:text-ink"
        }`}
      >
        전체 도시
      </Link>
      {cities.map((c) => {
        const active = activeCityId === c.id;
        return (
          <div
            key={c.id}
            className={`shrink-0 flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-sm font-medium border ${
              active ? "bg-ink text-paper border-ink" : "border-line text-ink/70 hover:text-ink"
            }`}
          >
            <Link href={`/app/cities/${c.id}`} className="flex items-center gap-1.5">
              <span>{c.name}</span>
              <span className="font-mono text-xs opacity-70">{c.placeCount}</span>
            </Link>
            <button
              onClick={() => handleDelete(c.id, c.name)}
              aria-label={`${c.name} 삭제`}
              className={`text-xs leading-none w-4 h-4 flex items-center justify-center ${
                active ? "hover:bg-paper/20" : "hover:bg-ink/10"
              }`}
            >
              ×
            </button>
          </div>
        );
      })}
      <AddCityForm />
    </div>
  );
}
