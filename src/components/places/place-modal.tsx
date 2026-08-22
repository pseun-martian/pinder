"use client";

import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPlace, updatePlace, deletePlace } from "@/app/actions/places";
import { getImageUploadUrl, confirmPlaceImage, deletePlaceImage } from "@/app/actions/images";
import { compressImage } from "@/lib/image-compress";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PhotoCarousel } from "@/components/places/photo-carousel";
import type { PlaceImage, PlaceWithDetails } from "@/lib/data/places";

type CityOption = { id: string; name: string };

// Deliberately NOT built on useActionState: this one modal must switch
// between calling createPlace and updatePlace within a single open session
// (a photo can be attached before the place is ever explicitly "saved",
// which silently creates the place first) — useActionState binds to one
// fixed action reference, so plain useState/useTransition is a better fit.
export function PlaceModal({
  cities,
  place,
  defaultCityId,
  onClose,
}: {
  cities: CityOption[];
  place: PlaceWithDetails | null;
  defaultCityId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [placeId, setPlaceId] = useState<string | null>(place?.id ?? null);
  const [cityId, setCityId] = useState(place?.cityId ?? defaultCityId ?? cities[0]?.id ?? "");
  const [name, setName] = useState(place?.name ?? "");
  const [mapsUrl, setMapsUrl] = useState(place?.mapsUrl ?? "");
  const [address, setAddress] = useState(place?.address ?? "");
  const [notes, setNotes] = useState(place?.notes ?? "");
  const [tagsText, setTagsText] = useState((place?.tags ?? []).join(", "));
  const [images, setImages] = useState<PlaceImage[]>(place?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const isEdit = placeId !== null;
  const busy = pending || uploading;

  function buildFormData() {
    const fd = new FormData();
    fd.set("cityId", cityId);
    fd.set("name", name);
    fd.set("mapsUrl", mapsUrl);
    fd.set("address", address);
    fd.set("notes", notes);
    for (const t of tagsText.split(",").map((t) => t.trim()).filter(Boolean)) {
      fd.append("tags", t);
    }
    return fd;
  }

  function validate() {
    if (!cityId) return "도시를 선택해 주세요.";
    if (!name.trim()) return "장소 이름을 입력해 주세요.";
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setError(null);

    startTransition(async () => {
      const fd = buildFormData();
      if (isEdit) {
        fd.set("placeId", placeId);
        const result = await updatePlace({ error: null }, fd);
        if (result.error) return setError(result.error);
      } else {
        const result = await createPlace(fd);
        if (result.error) return setError(result.error);
        setPlaceId(result.placeId ?? null);
      }
      router.refresh();
      onClose();
    });
  }

  function handleDelete() {
    if (!placeId) return;
    if (!confirm(`"${name}" 장소를 삭제할까요? 사진도 함께 삭제돼요.`)) return;

    startTransition(async () => {
      const result = await deletePlace(placeId);
      if (result.error) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // A photo can only attach to a saved place — silently save first if the
    // place hasn't been created yet (e.g. attaching a photo while still
    // filling out a brand-new place's form).
    let currentPlaceId = placeId;
    if (!currentPlaceId) {
      const validationError = validate();
      if (validationError) return setError(validationError);
      setError(null);
      const result = await createPlace(buildFormData());
      if (result.error || !result.placeId) {
        return setError(result.error ?? "장소를 저장하지 못했어요.");
      }
      currentPlaceId = result.placeId;
      setPlaceId(currentPlaceId);
    }

    setError(null);
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const uploadResult = await getImageUploadUrl(currentPlaceId, "jpg");
      // Compared to `null` (not just truthy) so TS narrows the discriminated
      // union below — `error`'s type is `string` in one branch vs `null` in
      // the other, which only discriminates on strict-equality checks.
      if (uploadResult.error !== null) throw new Error(uploadResult.error);

      const supabase = createClient();
      const { error: uploadErr } = await supabase.storage
        .from("place-images")
        .uploadToSignedUrl(uploadResult.path, uploadResult.token, blob);
      if (uploadErr) throw uploadErr;

      const confirmResult = await confirmPlaceImage(currentPlaceId, uploadResult.path, images.length);
      if (confirmResult.error || !confirmResult.imageId) {
        throw new Error(confirmResult.error ?? "이미지 저장에 실패했어요.");
      }

      setImages((prev) => [
        ...prev,
        { id: confirmResult.imageId!, storagePath: uploadResult.path, url: URL.createObjectURL(blob) },
      ]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  }

  function handleDeleteImage(image: PlaceImage) {
    if (!confirm("이 사진을 삭제할까요?")) return;
    startTransition(async () => {
      const result = await deletePlaceImage(image.id, image.storagePath);
      if (result.error) return setError(result.error);
      setImages((prev) => prev.filter((img) => img.id !== image.id));
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-paper border border-ink flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold">{isEdit ? "장소 수정" : "장소 추가"}</h2>
          <button type="button" onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
            닫기
          </button>
        </div>

        <PhotoCarousel
          images={images}
          onDelete={handleDeleteImage}
          onAddClick={() => fileInputRef.current?.click()}
          uploading={uploading}
          busy={busy}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">도시</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full border border-line bg-paper text-ink px-3 py-2 text-sm focus:outline-none focus-visible:border-focus"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="장소 이름" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">구글 지도 링크 (선택)</label>
            <Input
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">주소 (선택)</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">메모 (선택)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="메모"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">태그 (쉼표로 구분)</label>
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="카페, 야경, 데이트"
            />
          </div>

          {error && <p className="text-xs text-ink border border-line px-3 py-2">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
            {isEdit ? (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
                삭제
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                취소
              </Button>
              <Button type="submit" variant="primary" disabled={busy || cities.length === 0}>
                {pending ? "저장 중…" : "저장"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
