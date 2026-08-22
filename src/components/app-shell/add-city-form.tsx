"use client";

import { useActionState, useState } from "react";
import { createCity } from "@/app/actions/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { error: null as string | null };

export function AddCityForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCity, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-line hover:border-solid hover:border-ink text-ink/70 hover:text-ink px-2.5 py-2 text-sm text-left"
      >
        도시 추가
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input name="name" placeholder="도시 이름" autoFocus className="text-xs py-1.5" />
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          추가
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </div>
      {state.error && <p className="text-xs text-ink">{state.error}</p>}
    </form>
  );
}
