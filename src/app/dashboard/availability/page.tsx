import { DashboardShell } from "@/components/dashboard-shell";
import { Pill, Surface } from "@/components/ui";
import {
  getAvailabilityOverrides,
  getAvailabilityTemplates,
  getBlockedTimes,
} from "@/lib/demo-data";
import { formatDateTime } from "@/lib/utils";

export default function AvailabilityPage() {
  const templates = getAvailabilityTemplates();
  const overrides = getAvailabilityOverrides();
  const blockedTimes = getBlockedTimes();

  return (
    <DashboardShell
      pathname="/dashboard/availability"
      title="Availability engine"
      subtitle="Recurring windows, date-based overrides, and imported busy blocks feed slot generation."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="p-6 sm:p-8">
          <div className="space-y-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
                      Template
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{template.timezone}</h3>
                  </div>
                  <div className="rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-sm">
                    Slot interval {template.slotIntervalMinutes} min
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {template.weeklyRules.map((rule) => (
                    <div
                      key={`${template.id}-${rule.dayOfWeek}`}
                      className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] p-4"
                    >
                      <p className="text-sm font-semibold">Day {rule.dayOfWeek}</p>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {rule.ranges.map((range) => `${range.startTime}-${range.endTime}`).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Overrides
            </p>
            <div className="mt-5 space-y-3">
              {overrides.map((override) => (
                <div
                  key={override.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{override.date}</p>
                    <Pill tone={override.kind === "available" ? "brand" : "accent"}>
                      {override.kind}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {override.ranges.map((range) => `${range.startTime}-${range.endTime}`).join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {override.reason}
                  </p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Imported Busy State
            </p>
            <div className="mt-5 space-y-3">
              {blockedTimes.map((blocked) => (
                <div
                  key={blocked.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                >
                  <p className="font-semibold">{blocked.reason}</p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {formatDateTime(blocked.startTime, "America/Los_Angeles")} to{" "}
                    {formatDateTime(blocked.endTime, "America/Los_Angeles", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </DashboardShell>
  );
}
