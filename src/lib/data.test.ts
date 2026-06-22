import { describe, expect, it } from "vitest";
import { getTripData } from "@/lib/data";

describe("supplied Japan seed", () => {
  it("contains nine days with three itinerary events each", async () => {
    const data = await getTripData();
    expect(data?.events).toHaveLength(27);
    const counts = Object.groupBy(data?.events ?? [], (event) => event.date);
    expect(Object.keys(counts)).toHaveLength(9);
    expect(Object.values(counts).every((events) => events?.length === 3)).toBe(true);
  });

  it("normalizes statuses and identifies both flights", async () => {
    const data = await getTripData();
    expect(new Set(data?.events.map((event) => event.status))).toEqual(
      new Set(["draft", "confirmed", "decision_needed", "to_book"]),
    );
    expect(data?.events.filter((event) => event.category === "flight").map((event) => event.title)).toEqual([
      "JQ13 Sydney to Osaka (Kansai)",
      "JQ26 + JQ953 Tokyo to Sydney via Cairns",
    ]);
    const flights = data?.events.filter((event) => event.category === "flight") ?? [];
    expect(flights[0].flight_details?.passengers.map((passenger) => passenger.seat)).toEqual(["34A", "34B", "34C", "34D"]);
    expect(flights[1].flight_details?.segments.map((segment) => segment.flight_number)).toEqual(["JQ26", "JQ953"]);
  });

  it("includes the complete seeded Japan guide", async () => {
    const data = await getTripData();
    expect(data?.phrases).toHaveLength(20);
    expect(data?.signs).toHaveLength(8);
    expect(data?.facts).toHaveLength(22);
    expect(data?.phrases.some((phrase) => phrase.romaji === "Irasshaimase")).toBe(true);
    expect(data?.phrases.some((phrase) => phrase.english === "No pork, please")).toBe(false);
    expect(data?.signs.every((sign) => Boolean(sign.romaji))).toBe(true);
    expect(data?.facts.every((fact) => Boolean(fact.itinerary_event_id))).toBe(true);
    expect(data?.facts.every((fact) => Boolean(fact.tip))).toBe(true);
    expect(data?.events.every((event) => Boolean(event.travel_mode && event.travel_details))).toBe(true);
    expect(data?.events.filter((event) => event.planning_note)).not.toHaveLength(0);
  });
});
