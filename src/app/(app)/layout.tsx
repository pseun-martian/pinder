import type { ReactNode } from "react";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { getCitiesWithCounts } from "@/lib/data/cities";
import { Sidebar } from "@/components/app-shell/sidebar";
import { LogoutButton } from "@/components/app-shell/logout-button";
import { Logo } from "@/components/logo";

// Explicit props (not the generated `LayoutProps<Route>` helper): this
// layout wraps several child routes with different `params` shapes
// (/app, /app/cities/[cityId], /app/tours/[tourId], ...), and it doesn't
// read params itself, so a hand-written type is both correct and simpler.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, supabase } = await verifySession();
  const cities = await getCitiesWithCounts(supabase);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-line">
        <div>
          <Logo height={16} />
          <h1 className="sr-only">Pinder</h1>
          <p className="text-[10.5px] tracking-wider uppercase text-ink/50 mt-0.5">
            나의 여행 아카이브
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink/60 hidden sm:inline">{user.email}</span>
          <Link href="/app/settings" className="text-xs text-ink/60 hover:text-ink">
            설정
          </Link>
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar cities={cities} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-7 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
