import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Pill, Surface } from "@/components/ui";
import { getBookingDetail } from "@/lib/mock-services";
import { formatDateTime } from "@/lib/utils";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const detail = getBookingDetail(bookingId);

  if (!detail) {
    notFound();
  }

  return (
    <DashboardShell
      pathname="/dashboard"
      title="Booking detail panel"
      subtitle="Attendee identity, schedule metadata, and state-machine aware booking actions."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-3xl font-semibold tracking-tight">
              {detail.booking.title}
            </h3>
            <Pill tone={detail.booking.status === "confirmed" ? "brand" : "accent"}>
              {detail.booking.status}
            </Pill>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              `Start: ${formatDateTime(detail.booking.startTime, detail.booking.timezone)}`,
              `End: ${formatDateTime(detail.booking.endTime, detail.booking.timezone, { hour: "numeric", minute: "2-digit" })}`,
              `Location: ${detail.booking.locationLabel}`,
              `Guest token: ${detail.booking.confirmationToken}`,
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Attendees
            </p>
            <div className="mt-5 space-y-3">
              {detail.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                >
                  <p className="font-semibold">{attendee.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {attendee.email}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {attendee.timezone}
                  </p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Event Metadata
            </p>
            <div className="mt-5 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-6 text-[color:var(--muted)]">
              {detail.eventType?.description}
            </div>
          </Surface>
        </div>
      </div>
    </DashboardShell>
  );
}
