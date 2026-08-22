import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonClasses } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/app");

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md flex flex-col items-center gap-5">
        <h1 className="text-2xl font-semibold">Waypoint Atlas</h1>
        <p className="text-sm text-ink/70">
          도시별로 여행 장소를 저장하고, 태그로 검색하고, 날짜만 고르면 Day
          단위 일정을 자동으로 짜주는 개인 여행 아카이브.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/signup" className={buttonClasses("primary", "md")}>
            시작하기
          </Link>
          <Link href="/login" className={buttonClasses("secondary", "md")}>
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
