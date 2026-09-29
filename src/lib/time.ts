import type { ISODateString } from "@/lib/domain";

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function parseClockTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

export function toLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function parseIsoDate(value: ISODateString): LocalDateParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function localDatePartsToIso(value: LocalDateParts) {
  const month = String(value.month).padStart(2, "0");
  const day = String(value.day).padStart(2, "0");
  return `${value.year}-${month}-${day}`;
}

export function addDaysToLocalDate(value: LocalDateParts, days: number) {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
  date.setUTCDate(date.getUTCDate() + days);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function weekdayForLocalDate(value: LocalDateParts) {
  return new Date(Date.UTC(value.year, value.month - 1, value.day)).getUTCDay();
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

export function zonedDateTimeToUtc(
  date: LocalDateParts,
  clock: { hour: number; minute: number },
  timeZone: string,
) {
  const utcGuess = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    clock.hour,
    clock.minute,
    0,
  );

  const initialOffset = getTimeZoneOffset(new Date(utcGuess), timeZone);
  let utcTime = utcGuess - initialOffset;
  const adjustedOffset = getTimeZoneOffset(new Date(utcTime), timeZone);

  if (adjustedOffset !== initialOffset) {
    utcTime = utcGuess - adjustedOffset;
  }

  return new Date(utcTime);
}
