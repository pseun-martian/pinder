import type { ReactNode } from "react";
import { verifySession } from "@/lib/dal";
import { LeftNav } from "@/components/app-shell/left-nav";

// Explicit props (not the generated `LayoutProps<Route>` helper): this
// layout wraps several child routes with different `params` shapes
// (/app, /app/cities/[cityId], /app/tours/[tourId], ...), and it doesn't
// read params itself, so a hand-written type is both correct and simpler.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await verifySession();

  return (
    <div className="flex min-h-screen">
      <LeftNav email={user.email ?? ""} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
