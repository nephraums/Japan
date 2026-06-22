import { describe, expect, it } from "vitest";
import type { ItineraryEvent } from "@/lib/types";
import { countdownCopy, nearestTripDate, reassignTimeSlots } from "@/lib/trip-utils";

const baseEvent: ItineraryEvent = {
  id: "a",
  trip_id: "trip",
  date: "2026-07-04",
  city: "Osaka",
  title: "First",
  description: null,
  start_time: "09:00",
  end_time: "12:00",
  sort_order: 100,
  status: "draft",
  category: "activity",
  location_name: null,
  google_maps_url: null,
  start_point: null,
  end_point: null,
  teen_interest: null,
  food_ideas: null,
  flight_details: null,
  travel_mode: null,
  travel_details: null,
  planning_note: null,
};

describe("trip date selection", () => {
  it("uses the first day before departure", () => {
    expect(nearestTripDate(new Date(2026, 5, 21), "2026-07-04", "2026-07-12")).toBe("2026-07-04");
    expect(countdownCopy(new Date(2026, 5, 21), "2026-07-04", "2026-07-12")).toBe("13 days to go");
  });

  it("uses today during the trip and the last day after it", () => {
    expect(nearestTripDate(new Date(2026, 6, 8), "2026-07-04", "2026-07-12")).toBe("2026-07-08");
    expect(nearestTripDate(new Date(2026, 6, 20), "2026-07-04", "2026-07-12")).toBe("2026-07-12");
  });
});

describe("itinerary slot reassignment", () => {
  it("moves activities while preserving the day's ordered time slots", () => {
    const second = { ...baseEvent, id: "b", title: "Second", start_time: "13:00", end_time: "17:00", sort_order: 200 };
    const result = reassignTimeSlots([baseEvent, second], ["b", "a"]);
    expect(result.map(({ id, start_time, sort_order }) => ({ id, start_time, sort_order }))).toEqual([
      { id: "b", start_time: "09:00", sort_order: 100 },
      { id: "a", start_time: "13:00", sort_order: 200 },
    ]);
  });

  it("rejects unknown event IDs", () => {
    expect(() => reassignTimeSlots([baseEvent], ["missing"])).toThrow("Unknown itinerary event");
  });
});
