"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Search",
    match: (p: string) => p === "/" || p.startsWith("/bean"),
    icon: (
      <path d="M10.5 4a6.5 6.5 0 1 0 4.1 11.55L19 20m-8.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    match: (p: string) => p.startsWith("/saved"),
    icon: <path d="M7 4h10v16l-5-3.5L7 20V4Z" strokeLinejoin="round" />,
  },
  {
    href: "/guide",
    label: "Guide",
    match: (p: string) => p.startsWith("/guide"),
    icon: (
      <path d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Zm11 1.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v1.5m3-1.5v1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:inset-y-0 lg:right-auto lg:w-60 lg:border-t-0 lg:border-r lg:bg-surface/60 lg:px-4 lg:pt-10 lg:pb-0"
    >
      {/* On desktop the bottom tab bar becomes a sidebar with the app name. */}
      <Link href="/" className="mb-10 hidden px-3 lg:block">
        <span className="condensed block text-[2.5rem] leading-none font-bold tracking-tight">Crema</span>
        <span className="mt-1 block text-sm text-cascara">for Meraki Gen 2</span>
      </Link>
      <ul className="mx-auto flex max-w-xl lg:flex-col lg:gap-1">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1 lg:flex-none">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:text-base ${
                  active ? "text-ink lg:bg-surface-2" : "text-muted hover:text-ink lg:hover:bg-surface"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
                  {tab.icon}
                </svg>
                {tab.label}
                <span className={`h-0.5 w-5 rounded-full lg:hidden ${active ? "bg-cascara" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
