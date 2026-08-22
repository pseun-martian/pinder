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
  const initial = place.name.trim().charAt(0) || "?";

  return (
    <article className="flex gap-3 py-4 border-b border-line-soft">
      <div className="w-9 h-9 shrink-0 bg-ink text-paper flex items-center justify-center text-sm font-semibold">
        {initial}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <button type="button" onClick={onEdit} className="text-left flex flex-col gap-1.5 w-full">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold">{place.name}</span>
            {place.cityName && (
              <span className="text-[10.5px] text-ink/50 shrink-0">{place.cityName}</span>
            )}
          </div>
          {place.address && <p className="text-xs text-ink/60 line-clamp-1">{place.address}</p>}
          {place.notes && <p className="text-sm text-ink/80 line-clamp-3">{place.notes}</p>}

          {cover && (
            // eslint-disable-next-line @next/next/no-img-element -- pre-compressed client-side, signed Storage URL
            <img
              src={cover}
              alt=""
              className="w-full aspect-[4/3] object-cover border border-line mt-1"
            />
          )}

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {place.tags.map((t) => (
                <span key={t} className="border border-line px-1.5 py-0.5 text-[10.5px]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </button>

        <a
          href={mapsUrlFor(place)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="self-start text-xs text-ink/60 hover:text-ink mt-0.5"
        >
          지도에서 열기 →
        </a>
      </div>
    </article>
  );
}
