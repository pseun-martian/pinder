"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameCity, deleteCity } from "@/app/actions/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CityWithCount } from "@/lib/data/cities";

export function CityManager({ cities }: { cities: CityWithCount[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startEdit(city: CityWithCount) {
    setEditingId(city.id);
    setDraft(city.name);
    setError(null);
  }

  function handleRename(cityId: string) {
    const name = draft.trim();
    if (!name) return setError("도시 이름을 입력해 주세요.");
    startTransition(async () => {
      const result = await renameCity(cityId, name);
      if (result.error) return setError(result.error);
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(city: CityWithCount) {
    if (!confirm(`"${city.name}" 도시와 저장된 장소를 모두 삭제할까요?`)) return;
    startTransition(async () => {
      const result = await deleteCity(city.id);
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  if (cities.length === 0) {
    return <p className="text-sm text-ink/60">아직 추가한 도시가 없어요.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-ink border border-line px-3 py-2">{error}</p>}
      <ul className="border border-line flex flex-col">
        {cities.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2.5 px-3 py-2.5 border-b border-line-soft last:border-b-0"
          >
            {editingId === c.id ? (
              <>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  className="flex-1 text-sm"
                />
                <Button size="sm" variant="primary" onClick={() => handleRename(c.id)} disabled={pending}>
                  저장
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  취소
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{c.name}</span>
                <span className="text-xs text-ink/50 font-mono">{c.placeCount}</span>
                <Button size="sm" variant="secondary" onClick={() => startEdit(c)}>
                  이름 변경
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(c)} disabled={pending}>
                  삭제
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
