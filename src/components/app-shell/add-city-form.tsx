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
        className="shrink-0 border border-dashed border-line hover:border-solid hover:border-ink text-ink/60 hover:text-ink px-3 py-1.5 text-sm"
      >
        + 도시
      </button>
    );
  }

  return (
    <div className="relative shrink-0">
      <form action={formAction} className="flex items-center gap-1.5">
        <Input name="name" placeholder="도시 이름" autoFocus className="text-xs py-1.5 w-28" />
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          추가
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </form>
      {state.error && (
        <p className="absolute left-0 top-full mt-1 whitespace-nowrap bg-paper border border-ink px-2 py-1 text-xs z-10">
          {state.error}
        </p>
      )}
    </div>
  );
}
