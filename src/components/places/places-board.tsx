"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlaceCard } from "@/components/places/place-card";
import { PlaceModal } from "@/components/places/place-modal";
import type { PlaceWithDetails } from "@/lib/data/places";

type CityOption = { id: string; name: string };
type ModalState = "closed" | "create" | PlaceWithDetails;

export function PlacesBoard({
  places,
  cities,
  defaultCityId,
}: {
  places: PlaceWithDetails[];
  cities: CityOption[];
  defaultCityId?: string;
}) {
  const [modalState, setModalState] = useState<ModalState>("closed");

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant="primary"
          onClick={() => setModalState("create")}
          disabled={cities.length === 0}
        >
          장소 추가
        </Button>
      </div>

      {cities.length === 0 && (
        <p className="text-sm text-ink/60 border border-dashed border-line px-4 py-10 text-center">
          먼저 사이드바에서 도시를 추가해 주세요.
        </p>
      )}

      {cities.length > 0 && places.length === 0 && (
        <p className="text-sm text-ink/60 border border-dashed border-line px-4 py-10 text-center">
          저장된 장소가 없어요.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {places.map((p) => (
          <PlaceCard key={p.id} place={p} onEdit={() => setModalState(p)} />
        ))}
      </div>

      {modalState !== "closed" && (
        <PlaceModal
          cities={cities}
          place={modalState === "create" ? null : modalState}
          defaultCityId={defaultCityId}
          onClose={() => setModalState("closed")}
        />
      )}
    </div>
  );
}
