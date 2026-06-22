import { describe, expect, it } from "vitest";
import { googleMapsSearchUrl, itineraryMapUrl, usableMapLink } from "@/lib/maps";
import type { ItineraryEvent } from "@/lib/types";

describe("map links", () => {
  it("creates a universal Google Maps search link", () => {
    expect(googleMapsSearchUrl("Nishiki Market", "Kyoto", "Japan")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Nishiki%20Market%2C%20Kyoto%2C%20Japan",
    );
  });

  it("does not treat placeholder links as real links", () => {
    expect(usableMapLink("TBC")).toBeNull();
    expect(usableMapLink("https://maps.example/place")).toBe("https://maps.example/place");
  });

  it("adds a search link to itinerary activities without a saved URL", () => {
    const event = {
      title: "Kiyomizu-dera",
      city: "Kyoto",
      category: "activity",
      location_name: null,
      google_maps_url: null,
    } as ItineraryEvent;
    expect(itineraryMapUrl(event)).toContain("Kiyomizu-dera%2C%20Kyoto%2C%20Japan");
    expect(itineraryMapUrl({ ...event, category: "flight" })).toBeNull();
  });
});
