"use client";

import { mapsUrlFor } from "@/lib/places-utils";
import type { PlaceWithDetails } from "@/lib/data/places";

export function PlaceCard({
  place,
  onEdit,
}: {
  place: PlaceWithDetails;
  onEdit: () => void;
}) {
  const cover = place.images[0]?.url;

  return (
    <div className="border border-line flex flex-col">
      <button type="button" onClick={onEdit} className="text-left flex flex-col flex-1">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- pre-compressed client-side, signed Storage URL
          <img
            src={cover}
            alt=""
            className="w-full aspect-[4/3] object-cover border-b border-line"
          />
        ) : (
          <div className="w-full aspect-[4/3] border-b border-line flex items-center justify-center text-xs text-ink/40">
            사진 없음
          </div>
        )}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium">{place.name}</h3>
            {place.cityName && (
              <span className="text-[10.5px] text-ink/50 shrink-0">{place.cityName}</span>
            )}
          </div>
          {place.address && <p className="text-xs text-ink/60 line-clamp-1">{place.address}</p>}
          {place.notes && <p className="text-xs text-ink/70 line-clamp-2">{place.notes}</p>}
          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1.5">
              {place.tags.map((t) => (
                <span key={t} className="border border-line px-1.5 py-0.5 text-[10.5px]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>
      <a
        href={mapsUrlFor(place)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="border-t border-line px-3 py-2 text-xs text-center hover:bg-ink hover:text-paper"
      >
        지도에서 열기
      </a>
    </div>
  );
}
