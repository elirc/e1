import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricCard, Pill, Surface } from "@/components/ui";
import { getDashboardSnapshot } from "@/lib/demo-data";
import { formatDateTime, minutesToLabel } from "@/lib/utils";

export default function DashboardPage() {
  const snapshot = getDashboardSnapshot();

  return (
    <DashboardShell
      pathname="/dashboard"
      title="Owner command center"
      subtitle="Upcoming bookings, sync health, and the next actions that keep booking pages accurate."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Published Events"
          value={String(snapshot.eventTypes.filter((item) => item.published).length)}
          detail="Public booking links that are currently discoverable and accepting new requests."
        />
        <MetricCard
          label="Upcoming"
          value={String(snapshot.upcomingBookings.length)}
          detail="Bookings in active or pending states across owner and team workflows."
        />
        <MetricCard
          label="Calendar Sync"
          value={`${snapshot.integrations.filter((item) => item.status === "connected").length}/${snapshot.integrations.length}`}
          detail="Connected integrations are reflected in the conflict engine and booking health cards."
        />
        <MetricCard
          label="Plan Seats"
          value={`${snapshot.planLimit.activeSeats}`}
          detail="Workspace seat usage modeled alongside plan features and event limits."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
                Booking Pipeline
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Upcoming bookings
              </h3>
            </div>
            <Link
              href="/dashboard/event-types"
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold"
            >
              Manage event types
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {snapshot.upcomingBookings.map((booking) => {
              const attendee = snapshot.attendeesByBookingId[booking.id]?.[0];
              return (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="block rounded-3xl border border-[color:var(--line)] bg-white/80 p-5 transition-colors hover:border-[color:var(--brand)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold">{booking.title}</h4>
                        <Pill tone={booking.status === "confirmed" ? "brand" : "accent"}>
                          {booking.status}
                        </Pill>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {attendee?.name} · {attendee?.email}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {formatDateTime(booking.startTime, booking.timezone)} to{" "}
                        {formatDateTime(booking.endTime, booking.timezone, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--muted)]">
                      {booking.locationLabel}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Active Event Types
            </p>
            <div className="mt-5 space-y-3">
              {snapshot.eventTypes.map((eventType) => (
                <div
                  key={eventType.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{eventType.title}</p>
                    <Pill tone={eventType.published ? "brand" : "muted"}>
                      {eventType.published ? "published" : "draft"}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {minutesToLabel(eventType.durationMinutes)} ·{" "}
                    {eventType.locationLabel}
                  </p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Integration Health
            </p>
            <div className="mt-5 space-y-3">
              {snapshot.integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{integration.provider}</p>
                    <Pill tone={integration.status === "connected" ? "brand" : "accent"}>
                      {integration.status}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {integration.email}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Last sync {integration.lastSyncedAt ? formatDateTime(integration.lastSyncedAt, snapshot.owner.timezone) : "never"}
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </section>
    </DashboardShell>
  );
}
