import type {
  AvailabilityOverride,
  AvailabilityTemplate,
  BlockedTimeRange,
  Booking,
  EventType,
  SlotPreview,
} from "@/lib/domain";
import { isBlockingBookingStatus } from "@/lib/booking-state";
import {
  addDaysToLocalDate,
  addMinutes,
  localDatePartsToIso,
  parseClockTime,
  toLocalDateParts,
  weekdayForLocalDate,
  zonedDateTimeToUtc,
} from "@/lib/time";

interface UtcWindow {
  start: Date;
  end: Date;
}

function subtractWindow(base: UtcWindow, cut: UtcWindow) {
  if (cut.end <= base.start || cut.start >= base.end) {
    return [base];
  }

  const fragments: UtcWindow[] = [];

  if (cut.start > base.start) {
    fragments.push({ start: base.start, end: cut.start });
  }

  if (cut.end < base.end) {
    fragments.push({ start: cut.end, end: base.end });
  }

  return fragments;
}

function subtractWindows(base: UtcWindow[], cuts: UtcWindow[]) {
  return cuts.reduce<UtcWindow[]>((current, cut) => {
    return current.flatMap((window) => subtractWindow(window, cut));
  }, base);
}

function materializeRangesForDate(
  date: { year: number; month: number; day: number },
  ranges: { startTime: string; endTime: string }[],
  timeZone: string,
) {
  return ranges.map((range) => {
    if (![range.startTime, range.endTime].every(value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) || range.endTime <= range.startTime)
      throw new RangeError("Availability windows must be ordered clock times within one day.");
    const start = zonedDateTimeToUtc(date, parseClockTime(range.startTime), timeZone);
    const end = zonedDateTimeToUtc(date, parseClockTime(range.endTime), timeZone);
    return { start, end };
  });
}

export function generateSlots(params: {
  eventType: EventType;
  template: AvailabilityTemplate;
  overrides: AvailabilityOverride[];
  blockedTimes: BlockedTimeRange[];
  bookings: Booking[];
  rangeStart: Date;
  rangeEnd: Date;
  now?: Date;
  limit?: number;
  eventTypes?: EventType[];
}) {
  const {
    eventType,
    template,
    overrides,
    blockedTimes,
    bookings,
    rangeStart,
    rangeEnd,
  } = params;

  const now = params.now ?? new Date();
  const positive = [eventType.durationMinutes, eventType.slotIntervalMinutes, eventType.maxDaysInFuture];
  const nonnegative = [eventType.bufferBeforeMinutes, eventType.bufferAfterMinutes, eventType.minNoticeMinutes];
  if (positive.some(value => !Number.isSafeInteger(value) || value <= 0) ||
      nonnegative.some(value => !Number.isSafeInteger(value) || value < 0) ||
      eventType.maxDaysInFuture > 366 || eventType.durationMinutes > 1440 ||
      ![rangeStart, rangeEnd, now].every(date => Number.isFinite(date.getTime())) ||
      rangeEnd <= rangeStart || rangeEnd.getTime() - rangeStart.getTime() > 367 * 86_400_000 ||
      (params.limit !== undefined && (!Number.isSafeInteger(params.limit) || params.limit <= 0))) {
    throw new RangeError("Invalid availability configuration or date range.");
  }
  const minimumStart = addMinutes(now, eventType.minNoticeMinutes);
  const maximumStart = addMinutes(now, eventType.maxDaysInFuture * 1440);
  const slots: SlotPreview[] = [];
  const seen = new Set<string>();
  const startLocalDate = toLocalDateParts(rangeStart, template.timezone);
  const endLocalDate = toLocalDateParts(rangeEnd, template.timezone);
  const dayCount = Math.ceil(
    (Date.UTC(endLocalDate.year, endLocalDate.month - 1, endLocalDate.day) -
      Date.UTC(
        startLocalDate.year,
        startLocalDate.month - 1,
        startLocalDate.day,
      )) /
      86_400_000,
  );

  for (let dayOffset = 0; dayOffset <= dayCount; dayOffset += 1) {
    const localDate = addDaysToLocalDate(startLocalDate, dayOffset);
    const localDateKey = localDatePartsToIso(localDate);
    const weekday = weekdayForLocalDate(localDate);
    const baseRule = template.weeklyRules.find(
      (rule) => rule.dayOfWeek === weekday,
    );

    let windows = materializeRangesForDate(
      localDate,
      baseRule?.ranges ?? [],
      template.timezone,
    );

    const matchedOverrides = overrides.filter(
      (override) => override.organizerId === eventType.organizerId && override.date === localDateKey,
    );

    for (const override of matchedOverrides) {
      const overrideWindows = materializeRangesForDate(
        localDate,
        override.ranges,
        template.timezone,
      );

      windows =
        override.kind === "available"
          ? [...windows, ...overrideWindows]
          : subtractWindows(windows, overrideWindows);
    }

    const blockers = [
      ...blockedTimes.filter(blocked => blocked.organizerId === eventType.organizerId)
        .map(blocked => ({ start: new Date(blocked.startTime), end: new Date(blocked.endTime) })),
      ...bookings.filter(booking => booking.organizerId === eventType.organizerId &&
        !booking.deletedAt && isBlockingBookingStatus(booking.status)).map(booking => {
        const existing = params.eventTypes?.find(event => event.id === booking.eventTypeId) ?? eventType;
        return { start: addMinutes(new Date(booking.startTime), -existing.bufferBeforeMinutes),
          end: addMinutes(new Date(booking.endTime), existing.bufferAfterMinutes) };
      }),
    ];

    // Keep the original availability grid: clipping/subtracting blockers must not move it.
    for (const window of windows) {
      for (let cursor = new Date(window.start);
        cursor.getTime() + eventType.durationMinutes * 60_000 <= window.end.getTime();
        cursor = addMinutes(cursor, eventType.slotIntervalMinutes)) {
        const slotEnd = addMinutes(cursor, eventType.durationMinutes);
        const occupiedStart = addMinutes(cursor, -eventType.bufferBeforeMinutes);
        const occupiedEnd = addMinutes(slotEnd, eventType.bufferAfterMinutes);
        const key = cursor.toISOString();
        if (cursor < rangeStart || slotEnd > rangeEnd || cursor < minimumStart || cursor > maximumStart || seen.has(key)) continue;
        if (blockers.some(blocker => occupiedStart < blocker.end && occupiedEnd > blocker.start)) continue;
        seen.add(key);
        slots.push({ startTime: key, endTime: slotEnd.toISOString(), timezone: eventType.timezone });
      }
    }
  }

  return slots
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .slice(0, params.limit ?? 24);
}
