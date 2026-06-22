import seed from "../../supabase/seed-data.json";
import recommendations from "../../supabase/itinerary-recommendations.json";
import factEnrichment from "../../supabase/place-fact-enrichment.json";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  FamilyProfile,
  EventComment,
  ItineraryCategory,
  ItineraryEvent,
  ItineraryStatus,
  Phrase,
  PlaceFact,
  RestaurantIdea,
  Accommodation,
  SignSymbol,
  Suggestion,
  Trip,
  TripData,
} from "@/lib/types";

function normalizeStatus(status: string): ItineraryStatus {
  if (status === "Confirmed") return "confirmed";
  if (status === "Decision needed") return "decision_needed";
  if (status.startsWith("To book")) return "to_book";
  return "draft";
}

function inferCategory(title: string): ItineraryCategory {
  const value = title.toLowerCase();
  if (/\b(jq\d+|fly)\b/.test(value)) return "flight";
  if (/train|transfer|airport|travel to|return to/.test(value)) return "transport";
  if (/dinner|food|market|lunch|breakfast|ramen|sushi/.test(value)) return "food";
  if (/shopping|streetwear|collect bags/.test(value)) return "shopping";
  if (/hotel|check-in/.test(value)) return "hotel";
  return "activity";
}

function demoData(): TripData {
  const tripId = "demo-japan-2026";
  const trip: Trip = {
    id: tripId,
    slug: "japan-2026",
    name: seed.trip.name,
    theme: seed.trip.theme,
    start_date: seed.trip.start_date,
    end_date: seed.trip.end_date,
  };
  const recommendationByTitle = new Map(recommendations.map((item) => [item.title, item]));
  const events: ItineraryEvent[] = seed.itinerary_events.map((event, index) => ({
    id: `demo-event-${index + 1}`,
    trip_id: tripId,
    date: event.date,
    city: event.city,
    title: event.title,
    description: event.notes || null,
    start_time: event.start_time,
    end_time: event.end_time,
    sort_order: ((index % 3) + 1) * 100,
    status: normalizeStatus(event.status),
    category: inferCategory(event.title),
    location_name: null,
    google_maps_url: event.map_url || null,
    start_point: event.start_point || null,
    end_point: event.end_point || null,
    teen_interest: event.teen_interest || null,
    food_ideas: event.food_ideas || null,
    flight_details: event.flight_details ?? null,
    travel_mode: recommendationByTitle.get(event.title)?.travel_mode ?? null,
    travel_details: recommendationByTitle.get(event.title)?.travel_details ?? null,
    planning_note: recommendationByTitle.get(event.title)?.planning_note ?? null,
  }));
  const phrases: Phrase[] = seed.phrases.map((phrase, index) => ({
    id: `demo-phrase-${index + 1}`,
    ...phrase,
    romaji: phrase.romaji || null,
    note: phrase.note || null,
  }));
  const signs: SignSymbol[] = seed.signs_symbols.map((sign, index) => ({
    id: `demo-sign-${index + 1}`,
    ...sign,
    romaji: sign.romaji || null,
    where_seen: sign.where_seen || null,
  }));
  const factEnrichmentByPlace = new Map(factEnrichment.map((item) => [item.place, item]));
  const facts: PlaceFact[] = seed.place_facts.map((fact, index) => ({
    id: `demo-fact-${index + 1}`,
    place: fact.place,
    fact: factEnrichmentByPlace.get(fact.place)?.fact ?? fact.fact,
    city: fact.city || null,
    itinerary_event_id: fact.event_title
      ? events.find((event) => event.title === fact.event_title)?.id ?? null
      : null,
    tip: factEnrichmentByPlace.get(fact.place)?.tip ?? null,
  }));
  const restaurants: RestaurantIdea[] = seed.restaurants.map((restaurant, index) => ({
    id: `demo-restaurant-${index + 1}`,
    city: restaurant.City,
    area: restaurant.Area || null,
    type: restaurant.Type || null,
    idea: restaurant.Idea,
    priority: restaurant.Priority || null,
    booking_needed: restaurant["Booking needed"] || null,
    link: restaurant.Link && restaurant.Link !== "TBC" ? restaurant.Link : null,
    notes: restaurant.Notes || null,
  }));
  const accommodations: Accommodation[] = seed.accommodation.map((stay, index) => ({
    id: `demo-accommodation-${index + 1}`,
    city: stay.City,
    dates: stay.Dates || null,
    recommended_area: stay["Recommended area"] || null,
    why_this_area: stay["Why this area"] || null,
    actual_accommodation: stay["Actual hotel / Airbnb"] === "TBC" ? null : stay["Actual hotel / Airbnb"],
    booking_link: stay["Booking link"] === "TBC" ? null : stay["Booking link"],
    notes: stay.Notes || null,
    reservation_number: stay["Reservation number"] ?? null,
    check_in_date: stay["Check-in date"] ?? null,
    check_out_date: stay["Check-out date"] ?? null,
    room_type: stay["Room type"] ?? null,
    rooms: stay.Rooms ?? null,
    guests: stay.Guests ?? null,
    nights: stay.Nights ?? null,
    scheduled_arrival_time: stay["Scheduled arrival time"] ?? null,
    check_in_window: stay["Check-in window"] ?? null,
    check_out_window: stay["Check-out window"] ?? null,
    total_amount_jpy: stay["Total amount JPY"] ?? null,
    payment_method: stay["Payment method"] ?? null,
    telephone: stay.Telephone ?? null,
    address: stay.Address ?? null,
    cancellation_policy: stay["Cancellation policy"] ?? null,
  }));

  return { trip, events, phrases, signs, facts, restaurants, accommodations, comments: [], suggestions: [], profile: null, demo: true };
}

export async function getTripData(): Promise<TripData | null> {
  if (!isSupabaseConfigured()) return demoData();

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, slug, name, theme, start_date, end_date")
    .eq("slug", "japan-2026")
    .maybeSingle();
  if (!trip) return null;

  const [{ data: events }, { data: phrases }, { data: signs }, { data: facts }, { data: restaurants }, { data: accommodations }, { data: comments }, { data: suggestions }, { data: authData }] = await Promise.all([
    supabase
      .from("itinerary_events")
      .select("*")
      .eq("trip_id", trip.id)
      .order("date")
      .order("sort_order"),
    supabase
      .from("phrasebook")
      .select("id, category, english, japanese, romaji, note")
      .eq("trip_id", trip.id)
      .order("category"),
    supabase
      .from("signs_symbols")
      .select("id, symbol, romaji, meaning, where_seen")
      .eq("trip_id", trip.id)
      .order("meaning"),
    supabase
      .from("place_facts")
      .select("id, place, city, fact, itinerary_event_id, tip")
      .eq("trip_id", trip.id)
      .order("city")
      .order("place"),
    supabase
      .from("restaurants")
      .select("id, city, area, type, idea, priority, booking_needed, link, notes")
      .eq("trip_id", trip.id)
      .order("city")
      .order("area"),
    supabase
      .from("accommodations")
      .select("id, city, dates, recommended_area, why_this_area, actual_accommodation, booking_link, notes, reservation_number, check_in_date, check_out_date, room_type, rooms, guests, nights, scheduled_arrival_time, check_in_window, check_out_window, total_amount_jpy, payment_method, telephone, address, cancellation_policy")
      .eq("trip_id", trip.id)
      .order("check_in_date"),
    supabase
      .from("comments")
      .select("id, trip_id, event_id, user_id, body, created_at, family_users!comments_user_id_fkey(display_name, avatar_emoji)")
      .eq("trip_id", trip.id)
      .not("event_id", "is", null)
      .order("created_at"),
    supabase
      .from("suggestions")
      .select("id, trip_id, target_event_id, suggested_by, title, description, city, date, preferred_time, google_maps_url, status, votes_for, votes_against, created_at, family_users!suggestions_suggested_by_fkey(display_name, avatar_emoji)")
      .eq("trip_id", trip.id)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  let profile: FamilyProfile | null = null;
  const authUserId = authData.user?.id;
  if (authUserId) {
    const { data: session } = await supabase
      .from("family_user_sessions")
      .select("family_user_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (session) {
      const { data: familyUser } = await supabase
        .from("family_users")
        .select("id, display_name, role, avatar_emoji")
        .eq("id", session.family_user_id)
        .maybeSingle();
      profile = familyUser as FamilyProfile | null;
    }
  }

  return {
    trip: trip as Trip,
    events: (events ?? []) as ItineraryEvent[],
    phrases: (phrases ?? []) as Phrase[],
    signs: (signs ?? []) as SignSymbol[],
    facts: (facts ?? []) as PlaceFact[],
    restaurants: (restaurants ?? []).map((restaurant) => ({
      ...restaurant,
      link: restaurant.link && restaurant.link !== "TBC" ? restaurant.link : null,
    })) as RestaurantIdea[],
    accommodations: (accommodations ?? []) as Accommodation[],
    comments: (comments ?? []).map((comment) => ({
      id: comment.id,
      trip_id: comment.trip_id,
      event_id: comment.event_id as string,
      user_id: comment.user_id as string,
      body: comment.body,
      created_at: comment.created_at,
      author: Array.isArray(comment.family_users)
        ? (comment.family_users[0] ?? null)
        : (comment.family_users ?? null),
    })) as EventComment[],
    suggestions: (suggestions ?? []).map((suggestion) => ({
      id: suggestion.id,
      trip_id: suggestion.trip_id,
      target_event_id: suggestion.target_event_id,
      suggested_by: suggestion.suggested_by,
      title: suggestion.title,
      description: suggestion.description,
      city: suggestion.city,
      date: suggestion.date,
      preferred_time: suggestion.preferred_time,
      google_maps_url: suggestion.google_maps_url,
      status: suggestion.status,
      votes_for: suggestion.votes_for,
      votes_against: suggestion.votes_against,
      created_at: suggestion.created_at,
      author: Array.isArray(suggestion.family_users)
        ? (suggestion.family_users[0] ?? null)
        : (suggestion.family_users ?? null),
    })) as Suggestion[],
    profile,
    demo: false,
  };
}
