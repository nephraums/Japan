import { compareAsc, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { ItineraryEvent, ItineraryStatus } from "@/lib/types";

export const TRIP_SLUG = "japan-2026";

export const statusLabels: Record<ItineraryStatus, string> = {
  draft: "Planned",
  confirmed: "Confirmed",
  decision_needed: "Decision needed",
  to_book: "To book",
  cancelled: "Cancelled",
  done: "Done",
};

export const itineraryStatusOptions: ItineraryStatus[] = [
  "draft",
  "confirmed",
  "to_book",
  "decision_needed",
  "done",
  "cancelled",
];

export function nearestTripDate(today: Date, startDate: string, endDate: string) {
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (compareAsc(localToday, start) < 0) return startDate;
  if (compareAsc(localToday, end) > 0) return endDate;
  return format(localToday, "yyyy-MM-dd");
}

export function countdownCopy(today: Date, startDate: string, endDate: string) {
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (compareAsc(localToday, start) < 0) {
    const days = differenceInCalendarDays(start, localToday);
    return `${days} day${days === 1 ? "" : "s"} to go`;
  }
  if (compareAsc(localToday, end) > 0) return "Trip complete";
  const day = differenceInCalendarDays(localToday, start) + 1;
  return `Day ${day} of 9`;
}

export function reassignTimeSlots(
  previous: ItineraryEvent[],
  nextIds: string[],
): ItineraryEvent[] {
  const slots = previous.map(({ start_time, end_time }) => ({ start_time, end_time }));
  const byId = new Map(previous.map((event) => [event.id, event]));

  return nextIds.map((id, index) => {
    const event = byId.get(id);
    if (!event) throw new Error("Unknown itinerary event");
    return {
      ...event,
      ...slots[index],
      sort_order: (index + 1) * 100,
    };
  });
}
