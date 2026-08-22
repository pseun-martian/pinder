"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null; message?: string };

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error: "이메일 인증이 아직 완료되지 않았어요. 가입 시 받은 확인 메일의 링크를 눌러 주세요.",
      };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
  }

  redirect("/app");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해 주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 해요." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 서로 일치하지 않아요." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "이미 가입된 이메일이에요. 로그인해 주세요." };
    }
    return { error: "가입 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요." };
  }

  // If email confirmation is off in the Supabase project, signUp already
  // returns an active session — go straight in. If it's on, there's no
  // session yet and the user needs to click the confirmation email.
  if (data.session) {
    redirect("/app");
  }

  return {
    error: null,
    message: "가입 확인 메일을 보냈어요. 메일함을 확인하고 링크를 눌러 주세요.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
