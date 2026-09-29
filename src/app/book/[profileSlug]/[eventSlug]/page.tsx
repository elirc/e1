import { notFound } from "next/navigation";
import { Pill, Surface } from "@/components/ui";
import { getPublicBookingPage } from "@/lib/demo-data";
import { formatDateOnly, formatDateTime, minutesToLabel } from "@/lib/utils";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ profileSlug: string; eventSlug: string }>;
}) {
  const { profileSlug, eventSlug } = await params;
  const page = getPublicBookingPage(profileSlug, eventSlug);

  if (!page) {
    notFound();
  }

  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <Surface className="p-6 sm:p-8">
          <Pill tone="brand">Public Booking Page</Pill>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {page.eventType.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
            {page.eventType.description}
          </p>

          <div className="mt-6 space-y-3 text-sm">
            {[
              `Host: ${page.profileName}`,
              `Duration: ${minutesToLabel(page.eventType.durationMinutes)}`,
              `Timezone policy: ${page.eventType.timezonePolicy}`,
              `Location: ${page.eventType.locationLabel}`,
              `Cancellation: ${page.eventType.cancellationPolicyHours}h notice`,
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-[color:var(--line)] bg-[color:var(--brand)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/72">
              Timezone Handling
            </p>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Store UTC in the database, render in the viewer&apos;s zone, and keep
              daylight-saving transitions inside the slot generator.
            </p>
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
                  Available Slots
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Pick a time without the back-and-forth
                </h2>
              </div>
              <div className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm">
                Auto-detected zone: America/Los_Angeles
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {page.slots.map((slot) => (
                <button
                  key={slot.startTime}
                  className="slot-tile rounded-3xl border border-[color:var(--line)] bg-white/90 p-4 text-left"
                  type="button"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    {formatDateOnly(slot.startTime, page.eventType.timezone)}
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {formatDateTime(slot.startTime, page.eventType.timezone, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Ends{" "}
                    {formatDateTime(slot.endTime, page.eventType.timezone, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))}
            </div>
          </Surface>

          <Surface className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Attendee Details
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {["Full name", "Work email", "Timezone", "Phone (optional)"].map(
                (label) => (
                  <label key={label} className="block text-sm">
                    <span className="mb-2 block font-medium">{label}</span>
                    <input
                      className="w-full rounded-2xl border border-[color:var(--line)] bg-white/85 px-4 py-3 outline-none"
                      placeholder={label}
                    />
                  </label>
                ),
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white"
              >
                Confirm booking
              </button>
              <div className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm">
                {page.eventType.customThankYouMessage}
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </main>
  );
}
