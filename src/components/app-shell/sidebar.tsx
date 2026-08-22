"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { deleteCity } from "@/app/actions/cities";
import { AddCityForm } from "@/components/app-shell/add-city-form";
import type { CityWithCount } from "@/lib/data/cities";

export function Sidebar({ cities }: { cities: CityWithCount[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPlacesArea = !pathname.startsWith("/app/tours");
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
    <aside className="w-64 shrink-0 border-r border-line flex flex-col overflow-y-auto">
      <nav className="flex gap-1.5 p-3.5 pb-2.5">
        <Link
          href="/app"
          className={`flex-1 border border-line px-2 py-2 text-sm font-medium text-center ${
            isPlacesArea ? "bg-ink text-paper border-ink" : "bg-paper text-ink"
          }`}
        >
          장소
        </Link>
        <Link
          href="/app/tours"
          className={`flex-1 border border-line px-2 py-2 text-sm font-medium text-center ${
            !isPlacesArea ? "bg-ink text-paper border-ink" : "bg-paper text-ink"
          }`}
        >
          투어
        </Link>
      </nav>

      {isPlacesArea && (
        <div className="px-3.5 pb-3.5">
          <p className="text-[10.5px] tracking-wider uppercase text-ink/50 px-1 py-1.5">
            도시
          </p>
          <ul className="flex flex-col gap-0.5 mb-2">
            <li>
              <Link
                href="/app"
                className={`flex items-center justify-between gap-2 px-2.5 py-2 text-sm font-medium border ${
                  activeCityId === "all" ? "bg-ink text-paper border-ink" : "border-transparent"
                }`}
              >
                <span>전체 도시</span>
              </Link>
            </li>
            {cities.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 text-sm font-medium border ${
                  activeCityId === c.id
                    ? "bg-ink text-paper border-ink"
                    : "border-transparent hover:border-line"
                }`}
              >
                <Link href={`/app/cities/${c.id}`} className="flex-1 flex items-center justify-between gap-2">
                  <span>{c.name}</span>
                  <span className="font-mono text-xs">{c.placeCount}</span>
                </Link>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className={`text-xs shrink-0 ${
                    activeCityId === c.id ? "text-paper/70 hover:text-paper" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <AddCityForm />
        </div>
      )}
    </aside>
  );
}
