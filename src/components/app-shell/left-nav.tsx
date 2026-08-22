"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/app-shell/logout-button";

function PlacesIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function ToursIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="4.5" width="17" height="16" rx="1" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.5-2-3.4-2.4.7a8 8 0 0 0-1.7-1L14.8 3h-4l-.4 2.8a8 8 0 0 0-1.7 1l-2.4-.7-2 3.4L6 11a7.97 7.97 0 0 0 0 2l-2 1.5 2 3.4 2.4-.7a8 8 0 0 0 1.7 1l.4 2.8h4l.4-2.8a8 8 0 0 0 1.7-1l2.4.7 2-3.4-2-1.5Z" />
    </svg>
  );
}

const navItems = [
  {
    href: "/app",
    label: "장소",
    match: (p: string) => !p.startsWith("/app/tours") && p !== "/app/settings",
    Icon: PlacesIcon,
  },
  {
    href: "/app/tours",
    label: "투어",
    match: (p: string) => p.startsWith("/app/tours"),
    Icon: ToursIcon,
  },
  {
    href: "/app/settings",
    label: "설정",
    match: (p: string) => p === "/app/settings",
    Icon: SettingsIcon,
  },
];

export function LeftNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-line h-screen sticky top-0 flex flex-col">
      <div className="px-5 pt-6 pb-5">
        <Logo height={16} />
        <h1 className="sr-only">Pinder</h1>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map(({ href, label, match, Icon }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                active ? "font-semibold text-ink" : "text-ink/60 hover:text-ink"
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-6 pt-3 border-t border-line-soft flex flex-col gap-2">
        <p className="px-3 text-[11px] text-ink/50 truncate">{email}</p>
        <LogoutButton />
      </div>
    </aside>
  );
}
