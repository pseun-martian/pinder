"use client";

import { useRef, useState } from "react";
import type { PlaceImage } from "@/lib/data/places";

/**
 * Threads-style photo carousel: horizontal scroll-snap slides (swipeable on
 * touch/trackpad natively) + click arrows + dot indicators. Also carries the
 * add/delete affordances the old static photo grid had — the last slide is
 * always the "add photo" tile, so uploading stays reachable from the
 * carousel itself instead of a separate section.
 */
export function PhotoCarousel({
  images,
  onDelete,
  onAddClick,
  uploading,
  busy,
}: {
  images: PlaceImage[];
  onDelete: (image: PlaceImage) => void;
  onAddClick: () => void;
  uploading: boolean;
  busy: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slideCount = images.length + 1; // +1 for the trailing add-photo tile

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative border-b border-line">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar aspect-square bg-paper-raised"
      >
        {images.map((img) => (
          <div key={img.id} className="relative w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL */}
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onDelete(img)}
              disabled={busy}
              className="absolute top-2 right-2 bg-paper border border-ink text-[10px] px-1.5 py-0.5"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddClick}
          disabled={busy}
          className="w-full shrink-0 snap-center flex items-center justify-center text-xs text-ink/60 hover:text-ink disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : "+ 사진 추가"}
        </button>
      </div>

      {slideCount > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="이전 사진"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center bg-paper border border-ink text-sm"
            >
              ‹
            </button>
          )}
          {index < slideCount - 1 && (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="다음 사진"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center bg-paper border border-ink text-sm"
            >
              ›
            </button>
          )}
          <div className="absolute bottom-2 inset-x-0 flex justify-center">
            <div className="flex gap-1 bg-paper/80 border border-ink/15 px-1.5 py-1">
              {Array.from({ length: slideCount }).map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 ${i === index ? "bg-ink" : "bg-ink/25"}`} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
