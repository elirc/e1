import { DashboardShell } from "@/components/dashboard-shell";
import { Pill, Surface } from "@/components/ui";
import { getEventTypes } from "@/lib/demo-data";
import { minutesToLabel } from "@/lib/utils";

export default function EventTypesPage() {
  const eventTypes = getEventTypes();

  return (
    <DashboardShell
      pathname="/dashboard/event-types"
      title="Event type editor"
      subtitle="Durations, buffers, availability policy, booking rules, branding, and publication state all live here."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="p-6 sm:p-8">
          <div className="space-y-5">
            {eventTypes.map((eventType) => (
              <div
                key={eventType.id}
                className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">{eventType.title}</h3>
                      <Pill tone={eventType.published ? "brand" : "muted"}>
                        {eventType.published ? "published" : "draft"}
                      </Pill>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                      {eventType.description}
                    </p>
                  </div>

                  <div
                    className="h-12 w-12 rounded-2xl border border-white/40"
                    style={{ backgroundColor: eventType.color }}
                  />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    `Duration: ${minutesToLabel(eventType.durationMinutes)}`,
                    `Buffers: ${eventType.bufferBeforeMinutes}/${eventType.bufferAfterMinutes} min`,
                    `Notice: ${minutesToLabel(eventType.minNoticeMinutes)} min`,
                    `Future window: ${eventType.maxDaysInFuture} days`,
                    `Location: ${eventType.locationLabel}`,
                    `Timezone policy: ${eventType.timezonePolicy}`,
                    `Participants: up to ${eventType.maxParticipants}`,
                    `Interval: ${eventType.slotIntervalMinutes} min`,
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
            Publish Checklist
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              "Slug is unique and SEO-friendly",
              "Buffers and notice windows are enforced",
              "Timezone behavior is explicit",
              "Share page can be branded",
              "Cancellation policy is visible before booking",
              "Custom thank-you content is set",
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
      </div>
    </DashboardShell>
  );
}
