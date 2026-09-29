import type { Booking, BookingAttendee } from "@/lib/domain";

export interface BookingState { bookings: Booking[]; attendees: BookingAttendee[] }

// A synchronous, process-local demo unit of work. No database or cross-worker durability.
export function createBookingRepository(seed: BookingState) {
  const original = structuredClone(seed);
  let state = structuredClone(original);
  return {
    read: (): BookingState => structuredClone(state),
    reset: () => { state = structuredClone(original); },
    transaction<T>(work: (draft: BookingState) => T): T {
      const draft = structuredClone(state);
      const result = work(draft);
      if (result && typeof result === "object" && "then" in result) {
        throw new Error("Booking transactions must be synchronous.");
      }
      const output = structuredClone(result);
      state = structuredClone(draft);
      return output;
    },
  };
}
export type BookingRepository = ReturnType<typeof createBookingRepository>;
