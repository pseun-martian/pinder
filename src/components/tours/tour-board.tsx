"use client";

import { useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  updateTourMeta,
  deleteTour,
  addTourDay,
  removeTourDay,
  moveTourPlace,
  reorderTourPlace,
  removePlaceFromTour,
  addPlaceToTourDay,
  setTourShare,
  rotateTourShareToken,
} from "@/app/actions/tours";
import { Button } from "@/components/ui/button";
import { mapsUrlFor } from "@/lib/places-utils";
import { fmtDateLong } from "@/lib/dates";
import type { TourDetail } from "@/lib/data/tours";
import type { PlaceWithDetails } from "@/lib/data/places";
import type { CityWithCount } from "@/lib/data/cities";

type DragPayload = { placeId: string; fromDay: number };

export function TourBoard({
  tour,
  placesById,
  allPlaces,
  cities,
}: {
  tour: TourDetail;
  placesById: Record<string, PlaceWithDetails>;
  allPlaces: PlaceWithDetails[];
  cities: CityWithCount[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(tour.title);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(
    tour.shareEnabled && tour.shareToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/share/tours/${tour.shareToken}`
      : null,
  );
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<DragPayload | null>(null);

  const assignedIds = new Set(tour.days.flatMap((d) => d.placeIds));
  const availablePlaces = allPlaces.filter(
    (p) => !assignedIds.has(p.id) && (!tour.cityId || p.cityId === tour.cityId),
  );

  function refresh() {
    router.refresh();
  }

  function handleTitleBlur() {
    if (title.trim() === tour.title || !title.trim()) {
      setTitle(tour.title);
      return;
    }
    startTransition(async () => {
      const result = await updateTourMeta(tour.id, { title });
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleCityChange(value: string) {
    startTransition(async () => {
      const result = await updateTourMeta(tour.id, { cityId: value === "all" ? null : value });
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleDeleteTour() {
    if (!confirm(`"${tour.title}" 투어를 삭제할까요?`)) return;
    startTransition(async () => {
      const result = await deleteTour(tour.id);
      if (result.error) return setError(result.error);
      router.push("/app/tours");
    });
  }

  function handleAddDay() {
    startTransition(async () => {
      const result = await addTourDay(tour.id);
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleRemoveDay(dayIndex: number) {
    if (!confirm(`Day ${dayIndex + 1}을 삭제할까요? 이 날의 장소는 목록에서 제거돼요.`)) return;
    startTransition(async () => {
      const result = await removeTourDay(tour.id, dayIndex);
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleReorder(dayIndex: number, placeId: string, direction: -1 | 1) {
    startTransition(async () => {
      const result = await reorderTourPlace(tour.id, dayIndex, placeId, direction);
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleRemoveFromTour(dayIndex: number, placeId: string) {
    startTransition(async () => {
      const result = await removePlaceFromTour(tour.id, dayIndex, placeId);
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleMoveToDay(dayIndex: number, placeId: string) {
    startTransition(async () => {
      const result = await addPlaceToTourDay(tour.id, dayIndex, placeId);
      if (result.error) setError(result.error);
      refresh();
    });
  }

  function handleShareToggle() {
    startTransition(async () => {
      const result = await setTourShare(tour.id, !tour.shareEnabled);
      if (result.error) return setError(result.error);
      setShareUrl(result.shareUrl ?? null);
      refresh();
    });
  }

  function handleRotateToken() {
    if (!confirm("기존 공유 링크는 더 이상 열리지 않아요. 새 링크를 발급할까요?")) return;
    startTransition(async () => {
      const result = await rotateTourShareToken(tour.id);
      if (result.error) return setError(result.error);
      setShareUrl(result.shareUrl ?? null);
      refresh();
    });
  }

  async function handleCopyShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // clipboard permission denied — the link is still shown for manual copy
    }
  }

  function handleDragStart(e: DragEvent, placeId: string, fromDay: number) {
    setDragging({ placeId, fromDay });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", placeId);
  }

  function handleDayDrop(e: DragEvent, toDay: number) {
    e.preventDefault();
    if (dragging && dragging.fromDay !== toDay) {
      startTransition(async () => {
        const result = await moveTourPlace(tour.id, dragging.placeId, dragging.fromDay, toDay);
        if (result.error) setError(result.error);
        refresh();
      });
    }
    setDragging(null);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-line focus:outline-none focus-visible:border-focus px-0 py-0.5"
          />
          <div className="flex items-center gap-2">
            <select
              defaultValue={tour.cityId ?? "all"}
              onChange={(e) => handleCityChange(e.target.value)}
              className="border border-line bg-paper text-ink px-2.5 py-1.5 text-xs focus:outline-none focus-visible:border-focus"
            >
              <option value="all">전체 도시</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink/60">
              {fmtDateLong(tour.startDate)} – {fmtDateLong(tour.endDate)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleAddDay} disabled={pending}>
            일차 추가
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteTour} disabled={pending}>
            투어 삭제
          </Button>
        </div>
      </div>

      <div className="border border-line px-4 py-3 mb-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-medium">공유 링크</p>
          <Button
            variant={tour.shareEnabled ? "secondary" : "primary"}
            size="sm"
            onClick={handleShareToggle}
            disabled={pending}
          >
            {tour.shareEnabled ? "공유 끄기" : "공유 켜기"}
          </Button>
        </div>
        {tour.shareEnabled && shareUrl && (
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs bg-paper border border-line-soft px-2 py-1 break-all">
              {shareUrl}
            </code>
            <Button variant="ghost" size="sm" onClick={handleCopyShare}>
              복사
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotateToken} disabled={pending}>
              재발급
            </Button>
          </div>
        )}
        {tour.shareEnabled && (
          <p className="text-[10.5px] text-ink/50">
            링크를 아는 사람은 로그인 없이 이 투어를 볼 수 있어요.
          </p>
        )}
      </div>

      {error && <p className="text-xs text-ink border border-line px-3 py-2 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tour.days.map((day, dayIndex) => (
          <div
            key={day.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDayDrop(e, dayIndex)}
            className="border border-line flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-line">
              <div>
                <p className="text-sm font-medium">Day {dayIndex + 1}</p>
                <p className="text-[10.5px] text-ink/50">{fmtDateLong(day.date)}</p>
              </div>
              {tour.days.length > 1 && (
                <button
                  onClick={() => handleRemoveDay(dayIndex)}
                  className="text-xs text-ink/50 hover:text-ink"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="flex flex-col flex-1">
              {day.placeIds.length === 0 && (
                <p className="text-xs text-ink/40 text-center py-6 px-3">
                  이 날에는 장소가 없어요. 아래로 드래그하거나 추가해 보세요.
                </p>
              )}
              {day.placeIds.map((placeId, i) => {
                const place = placesById[placeId];
                if (!place) return null;
                return (
                  <div
                    key={placeId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, placeId, dayIndex)}
                    className="flex items-center gap-2.5 px-3 py-2 border-b border-line-soft last:border-b-0 cursor-move"
                  >
                    {place.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL
                      <img
                        src={place.images[0].url}
                        alt=""
                        className="w-10 h-10 object-cover border border-line shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 border border-line shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{place.name}</p>
                      <a
                        href={mapsUrlFor(place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] text-ink/50 hover:text-ink underline"
                      >
                        지도
                      </a>
                    </div>
                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={() => handleReorder(dayIndex, placeId, -1)}
                        disabled={i === 0 || pending}
                        className="text-xs text-ink/60 hover:text-ink disabled:opacity-30 leading-none"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleReorder(dayIndex, placeId, 1)}
                        disabled={i === day.placeIds.length - 1 || pending}
                        className="text-xs text-ink/60 hover:text-ink disabled:opacity-30 leading-none"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromTour(dayIndex, placeId)}
                      disabled={pending}
                      className="text-xs text-ink/50 hover:text-ink shrink-0"
                    >
                      제거
                    </button>
                  </div>
                );
              })}
            </div>

            {availablePlaces.length > 0 && (
              <div className="p-2 border-t border-line-soft">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleMoveToDay(dayIndex, e.target.value);
                  }}
                  className="w-full border border-line bg-paper text-ink px-2 py-1.5 text-xs focus:outline-none focus-visible:border-focus"
                >
                  <option value="">+ 장소 추가</option>
                  {availablePlaces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
