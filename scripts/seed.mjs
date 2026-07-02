import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const familyPin = process.env.FAMILY_ACCESS_PIN;

if (!url || !serviceKey || !familyPin) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and FAMILY_ACCESS_PIN before seeding.",
  );
}
if (!/^\d{6,}$/.test(familyPin)) {
  throw new Error("FAMILY_ACCESS_PIN must contain at least six digits.");
}

const seedPath = fileURLToPath(new URL("../supabase/seed-data.json", import.meta.url));
const seed = JSON.parse(await readFile(seedPath, "utf8"));
const recommendationsPath = fileURLToPath(new URL("../supabase/itinerary-recommendations.json", import.meta.url));
const recommendations = JSON.parse(await readFile(recommendationsPath, "utf8"));
const recommendationByTitle = new Map(recommendations.map((item) => [item.title, item]));
const factEnrichmentPath = fileURLToPath(new URL("../supabase/place-fact-enrichment.json", import.meta.url));
const factEnrichment = JSON.parse(await readFile(factEnrichmentPath, "utf8"));
const factEnrichmentByPlace = new Map(factEnrichment.map((item) => [item.place, item]));
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const shouldReset = process.argv.includes("--reset");

function normalizeStatus(status) {
  if (status === "Confirmed") return "confirmed";
  if (status === "Decision needed") return "decision_needed";
  if (status.startsWith("To book")) return "to_book";
  return "draft";
}

function inferCategory(title) {
  const value = title.toLowerCase();
  if (/\b(jq\d+|fly)\b/.test(value)) return "flight";
  if (/train|transfer|airport|travel to|return to/.test(value)) return "transport";
  if (/dinner|food|market|lunch|breakfast|ramen|sushi/.test(value)) return "food";
  if (/shopping|streetwear|collect bags/.test(value)) return "shopping";
  if (/hotel|check-in/.test(value)) return "hotel";
  return "activity";
}

async function insert(table, rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main() {
  const { data: existing, error: lookupError } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", "japan-2026")
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing && !shouldReset) {
    throw new Error(
      "Japan 2026 is already seeded. Re-run with --reset only if you intend to replace its data.",
    );
  }
  if (existing && shouldReset) {
    const { error } = await supabase.from("trips").delete().eq("id", existing.id);
    if (error) throw error;
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      slug: "japan-2026",
      name: seed.trip.name,
      theme: seed.trip.theme,
      start_date: seed.trip.start_date,
      end_date: seed.trip.end_date,
    })
    .select()
    .single();
  if (tripError) throw tripError;

  try {
    const avatars = { Nigel: "🗻", Sarah: "🌸", Harrison: "🎮", Evelyn: "🍡", Guest: "🧳" };
    const users = await insert(
      "family_users",
      [...seed.users, { display_name: "Guest", role: "guest" }].map((user) => ({
        trip_id: trip.id,
        display_name: user.display_name,
        role: user.role,
        avatar_emoji: avatars[user.display_name] ?? "🎌",
      })),
    );
    const nigel = users.find((user) => user.display_name === "Nigel");

    const itineraryEvents = await insert(
      "itinerary_events",
      seed.itinerary_events.map((event, index) => ({
        trip_id: trip.id,
        date: event.date,
        city: event.city,
        title: event.title,
        description: event.notes || null,
        start_time: event.start_time,
        end_time: event.end_time,
        sort_order: ((index % 3) + 1) * 100,
        status: normalizeStatus(event.status),
        category: inferCategory(event.title),
        google_maps_url: event.map_url || null,
        start_point: event.start_point || null,
        end_point: event.end_point || null,
        teen_interest: event.teen_interest || null,
        food_ideas: event.food_ideas || null,
        flight_details: event.flight_details ?? null,
        travel_mode: recommendationByTitle.get(event.title)?.travel_mode ?? null,
        travel_details: recommendationByTitle.get(event.title)?.travel_details ?? null,
        planning_note: recommendationByTitle.get(event.title)?.planning_note ?? null,
        created_by: nigel?.id ?? null,
      })),
    );

    await insert(
      "bookings",
      seed.bookings.map((booking) => ({
        trip_id: trip.id,
        booking: booking.Booking,
        city: booking.City,
        date_text: booking.Date,
        priority: booking.Priority,
        status: booking.Status,
        owner: booking.Owner,
        link: booking.Link,
        notes: booking.Notes,
      })),
    );
    await insert(
      "restaurants",
      seed.restaurants.map((restaurant) => ({
        trip_id: trip.id,
        city: restaurant.City,
        area: restaurant.Area,
        type: restaurant.Type,
        idea: restaurant.Idea,
        priority: restaurant.Priority,
        booking_needed: restaurant["Booking needed"],
        link: restaurant.Link,
        notes: restaurant.Notes,
      })),
    );
    await insert(
      "accommodations",
      seed.accommodation.map((stay) => ({
        trip_id: trip.id,
        city: stay.City,
        dates: stay.Dates,
        recommended_area: stay["Recommended area"],
        why_this_area: stay["Why this area"],
        actual_accommodation: stay["Actual hotel / Airbnb"],
        booking_link: stay["Booking link"],
        notes: stay.Notes,
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
      })),
    );
    await insert(
      "phrasebook",
      seed.phrases.map((phrase) => ({ ...phrase, trip_id: trip.id })),
    );
    await insert(
      "signs_symbols",
      seed.signs_symbols.map((sign) => ({ ...sign, trip_id: trip.id })),
    );
    await insert(
      "place_facts",
      seed.place_facts.map(({ event_title, ...fact }) => ({
        ...fact,
        fact: factEnrichmentByPlace.get(fact.place)?.fact ?? fact.fact,
        tip: factEnrichmentByPlace.get(fact.place)?.tip ?? null,
        trip_id: trip.id,
        itinerary_event_id: event_title
          ? itineraryEvents.find((event) => event.title === event_title)?.id ?? null
          : null,
      })),
    );

    const { error: pinError } = await supabase.rpc("set_trip_pin", {
      p_trip_id: trip.id,
      p_pin: familyPin,
    });
    if (pinError) throw pinError;
    const { error: guestPinError } = await supabase.rpc("set_guest_pin", {
      p_trip_id: trip.id,
      p_pin: "123456",
    });
    if (guestPinError && !guestPinError.message.includes("Could not find the function")) throw guestPinError;
  } catch (error) {
    await supabase.from("trips").delete().eq("id", trip.id);
    throw error;
  }

  console.log(`Seeded Japan 2026 (${trip.id}) with 27 itinerary events.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
