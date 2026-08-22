import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getToursForUser } from "@/lib/data/tours";
import { buttonClasses } from "@/components/ui/button";
import { fmtDateShort } from "@/lib/dates";

export default async function ToursPage() {
  const supabase = await createClient();
  const tours = await getToursForUser(supabase);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">투어</h2>
        <Link href="/app/tours/new" className={buttonClasses("primary", "md")}>
          새 투어
        </Link>
      </div>

      {tours.length === 0 ? (
        <p className="text-sm text-ink/60 border border-dashed border-line px-4 py-10 text-center">
          아직 만든 투어가 없어요. 장소를 먼저 저장한 뒤 투어를 만들어 보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tours.map((t) => (
            <li key={t.id}>
              <Link
                href={`/app/tours/${t.id}`}
                className="flex items-center justify-between gap-3 border border-line px-4 py-3 hover:border-ink"
              >
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-ink/60 mt-0.5">
                    {t.cityName ?? "전체 도시"} · {fmtDateShort(t.startDate)} –{" "}
                    {fmtDateShort(t.endDate)} · {t.dayCount}일 · 장소 {t.placeCount}곳
                  </p>
                </div>
                {t.shareEnabled && (
                  <span className="text-[10.5px] border border-line px-2 py-1 shrink-0">
                    공유중
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
