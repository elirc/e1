import Link from "next/link";
import { MetricCard, Pill, SectionHeading, Surface } from "@/components/ui";
import { endpointGroups } from "@/lib/api-manifest";
import { getDashboardSnapshot, getPublicBookingPage } from "@/lib/demo-data";
import { formatDateTime, formatNumber } from "@/lib/utils";

export default function Home() {
  const dashboard = getDashboardSnapshot();
  const publicPage = getPublicBookingPage("jordan-lee", "strategy-sync");

  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Surface className="fade-in overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <Pill tone="brand">Cal.com-style Platform Foundation</Pill>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Multi-tenant scheduling that keeps public booking fast and
                operations predictable.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
                Pulseboard Scheduler ships with a real product shell, typed route
                contracts, booking-state enforcement, seeded data, and an
                architecture path for Postgres, Redis, workers, and calendar
                integrations.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Open Owner Dashboard
                </Link>
                <Link
                  href="/book/jordan-lee/strategy-sync"
                  className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold"
                >
                  Open Public Booking Page
                </Link>
                <Link
                  href="/api/docs"
                  className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold"
                >
                  Inspect API Manifest
                </Link>
              </div>
            </div>

            <Surface className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Live Demo Snapshot
              </p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-2xl border border-[color:var(--line)] bg-white/75 p-4">
                  <p className="font-semibold">{dashboard.team.name}</p>
                  <p className="mt-1 text-[color:var(--muted)]">
                    {dashboard.eventTypes.length} event types,{" "}
                    {dashboard.integrations.length} calendar integrations,{" "}
                    {dashboard.planLimit.activeSeats} active seats
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--line)] bg-white/75 p-4">
                  <p className="font-semibold">Next booking</p>
                  <p className="mt-1 text-[color:var(--muted)]">
                    {formatDateTime(
                      dashboard.upcomingBookings[0].startTime,
                      dashboard.owner.timezone,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--line)] bg-white/75 p-4">
                  <p className="font-semibold">Public link</p>
                  <p className="mt-1 text-[color:var(--muted)]">
                    {publicPage?.slots.length ?? 0} generated slots available
                  </p>
                </div>
              </div>
            </Surface>
          </div>
        </Surface>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Upcoming"
            value={String(dashboard.upcomingBookings.length)}
            detail="Upcoming bookings pulled into the owner workspace and public scheduling checks."
          />
          <MetricCard
            label="Audit Events"
            value={String(dashboard.auditLog.length)}
            detail="Every booking mutation is modeled for preserved history and correlation IDs."
          />
          <MetricCard
            label="Slot Inventory"
            value={String(publicPage?.slots.length ?? 0)}
            detail="Generated from weekly rules, overrides, buffers, and active conflicts."
          />
          <MetricCard
            label="Plan Limit"
            value={formatNumber(dashboard.planLimit.eventTypeLimit)}
            detail="Subscription and feature gating surface is included in the domain model."
          />
        </section>

        <Surface className="p-6 sm:p-8">
          <SectionHeading
            eyebrow="Product Coverage"
            title="The foundation maps directly to the requested platform surfaces."
            description="This starter favors real shape over placeholder copy: owner dashboard views, public booking flow, typed APIs, a state machine for bookings, draft Prisma schema, and infrastructure files for local Postgres and Redis."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              "Authentication and onboarding endpoints",
              "Team roles, invitations, and settings",
              "Event type editor and publish flows",
              "Weekly availability and date overrides",
              "Public booking previews and booking creation",
              "Dashboard snapshots, attendee detail, and audit log",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-[color:var(--line)] bg-white/70 p-5 text-sm font-medium text-[color:var(--ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </Surface>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Surface className="p-6 sm:p-8">
            <SectionHeading
              eyebrow="API Surface"
              title="Documented endpoints for the core product loops."
              description="Each route group is represented in the Next.js App Router and mirrored in the API manifest endpoint."
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {endpointGroups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-3xl border border-[color:var(--line)] bg-white/70 p-5"
                >
                  <p className="text-sm font-semibold">{group.title}</p>
                  <div className="mt-4 space-y-3">
                    {group.items.slice(0, 4).map((item) => (
                      <div
                        key={`${item.method}-${item.path}`}
                        className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3"
                      >
                        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          <span>{item.method}</span>
                          <span className="h-1 w-1 rounded-full bg-[color:var(--muted)]" />
                          <span className="truncate">{item.path}</span>
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--ink)]">
                          {item.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Definition of Done Path
            </p>
            <div className="mt-5 space-y-3 text-sm">
              {[
                "Create and publish an event type",
                "Preview slots from a public page",
                "Reject booking conflicts under concurrent attempts",
                "Expose cancellation and reschedule routes",
                "Model webhook callbacks and integration refresh",
                "Run lint and build on the current codebase",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </Surface>
        </section>
      </div>
    </main>
  );
}
