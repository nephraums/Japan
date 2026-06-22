import type { ItineraryEvent } from "@/lib/types";

export function googleMapsSearchUrl(...parts: (string | null | undefined)[]) {
  const query = parts.filter((part): part is string => Boolean(part?.trim())).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function usableMapLink(link: string | null | undefined) {
  return link && link.trim().toUpperCase() !== "TBC" ? link : null;
}

export function itineraryMapUrl(event: ItineraryEvent) {
  if (event.category === "flight") return null;
  return usableMapLink(event.google_maps_url) ?? googleMapsSearchUrl(
    event.location_name ?? event.title,
    event.city,
    "Japan",
  );
}
