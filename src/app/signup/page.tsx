"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Logo height={22} className="mb-3" />
        <h1 className="sr-only">Pinder</h1>
        <p className="text-sm text-ink/60 mb-8">계정을 만들고 여행 아카이브를 시작하세요.</p>

        {state.message ? (
          <p className="text-sm border border-line px-4 py-3">{state.message}</p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium">
                이메일
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium">
                비밀번호 <span className="text-ink/50 font-normal">(8자 이상)</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="passwordConfirm" className="text-xs font-medium">
                비밀번호 확인
              </label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {state.error && (
              <p className="text-xs text-ink border border-line px-3 py-2">{state.error}</p>
            )}

            <Button type="submit" variant="primary" disabled={pending} className="mt-2">
              {pending ? "가입 처리 중…" : "회원가입"}
            </Button>
          </form>
        )}

        <p className="text-sm text-ink/60 mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
