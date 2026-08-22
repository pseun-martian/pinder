"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export function SearchFilterBar({
  tagCounts,
}: {
  tagCounts: { name: string; count: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(urlSearch);
  // Adjusted during render (not in an effect) to reflect external URL changes
  // (e.g. browser back/forward) without an extra post-commit render pass.
  const [trackedUrlSearch, setTrackedUrlSearch] = useState(urlSearch);
  if (urlSearch !== trackedUrlSearch) {
    setTrackedUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const activeTags = new Set((searchParams.get("tags") ?? "").split(",").filter(Boolean));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParams(next: { search?: string; tags?: string[] }) {
    const params = new URLSearchParams(searchParams.toString());
    const search = next.search ?? params.get("search") ?? "";
    const tags = next.tags ?? [...activeTags];
    if (search) params.set("search", search);
    else params.delete("search");
    if (tags.length) params.set("tags", tags.join(","));
    else params.delete("tags");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ search: value }), 300);
  }

  function toggleTag(name: string) {
    const next = new Set(activeTags);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    pushParams({ tags: [...next] });
  }

  return (
    <div className="flex flex-col gap-2.5 mb-4">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="이름, 메모, 태그로 검색"
        className="w-full border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus-visible:border-focus"
      />
      {tagCounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeTags.size > 0 && (
            <button
              onClick={() => pushParams({ tags: [] })}
              className="border border-line px-2.5 py-1 text-xs"
            >
              필터 해제 ×
            </button>
          )}
          {tagCounts.map((t) => (
            <button
              key={t.name}
              onClick={() => toggleTag(t.name)}
              className={`border px-2.5 py-1 text-xs ${
                activeTags.has(t.name) ? "bg-ink text-paper border-ink" : "border-line"
              }`}
            >
              {t.name} {t.count}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
