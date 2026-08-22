"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTour } from "@/app/actions/tours";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayISO } from "@/lib/dates";
import type { PlaceWithDetails } from "@/lib/data/places";
import type { CityWithCount } from "@/lib/data/cities";

const initialState: { error: string | null; tourId?: string } = { error: null };

export function TourWizard({
  places,
  cities,
}: {
  places: PlaceWithDetails[];
  cities: CityWithCount[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTour, initialState);
  const [cityFilter, setCityFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const today = useState(() => todayISO())[0];

  useEffect(() => {
    if (state.tourId) router.push(`/app/tours/${state.tourId}`);
  }, [state.tourId, router]);

  const visiblePlaces = useMemo(
    () => (cityFilter === "all" ? places : places.filter((p) => p.cityId === cityFilter)),
    [places, cityFilter],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">제목</label>
        <Input name="title" placeholder="예: 도쿄 3박 4일" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">도시</label>
        <select
          name="cityId"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="w-full border border-line bg-paper text-ink px-3 py-2 text-sm focus:outline-none focus-visible:border-focus"
        >
          <option value="all">전체 도시</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs font-medium">시작일</label>
          <Input name="start" type="date" defaultValue={today} required />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs font-medium">종료일</label>
          <Input name="end" type="date" defaultValue={today} required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">장소 선택 ({selected.size}곳)</label>
        <div className="border border-line max-h-80 overflow-y-auto flex flex-col">
          {visiblePlaces.length === 0 && (
            <p className="text-xs text-ink/60 px-3 py-4 text-center">저장된 장소가 없어요.</p>
          )}
          {visiblePlaces.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2.5 px-3 py-2 border-b border-line-soft last:border-b-0 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                name="placeIds"
                value={p.id}
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span className="flex-1">{p.name}</span>
              {p.cityName && <span className="text-[10.5px] text-ink/50">{p.cityName}</span>}
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-xs text-ink border border-line px-3 py-2">{state.error}</p>
      )}

      <Button type="submit" variant="primary" disabled={pending || selected.size === 0}>
        {pending ? "만드는 중…" : "투어 만들기"}
      </Button>
    </form>
  );
}
