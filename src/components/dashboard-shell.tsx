import Link from "next/link";
import type { ReactNode } from "react";
import { Surface } from "@/components/ui";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/event-types", label: "Event Types" },
  { href: "/dashboard/availability", label: "Availability" },
  { href: "/dashboard/team", label: "Team" },
];

export function DashboardShell({
  title,
  subtitle,
  pathname,
  children,
}: {
  title: string;
  subtitle: string;
  pathname: string;
  children: ReactNode;
}) {
  return (
    <div className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <Surface className="p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="rounded-[22px] bg-[color:var(--brand)]/95 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/72">
              Pulseboard
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Scheduling OS
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/74">
              Multi-tenant booking, routing, sync, and operational visibility.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-[color:var(--brand-soft)] text-[color:var(--brand)]"
                      : "text-[color:var(--muted)] hover:bg-white/70 hover:text-[color:var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-white/75 p-4 text-sm text-[color:var(--muted)]">
            Public sample:
            <Link
              href="/book/jordan-lee/strategy-sync"
              className="mt-2 block font-semibold text-[color:var(--brand)]"
            >
              /book/jordan-lee/strategy-sync
            </Link>
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--brand)]">
              Owner Workspace
            </p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                  {subtitle}
                </p>
              </div>
              <div className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--ink)]">
                SLA: no double bookings, UTC storage, stateful transitions
              </div>
            </div>
          </Surface>

          {children}
        </div>
      </div>
    </div>
  );
}
