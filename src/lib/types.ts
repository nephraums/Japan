export type FamilyUserName = "Nigel" | "Sarah" | "Harrison" | "Evelyn" | "Guest";

export type ItineraryStatus =
  | "draft"
  | "confirmed"
  | "decision_needed"
  | "to_book"
  | "cancelled"
  | "done";

export type ItineraryCategory =
  | "flight"
  | "hotel"
  | "transport"
  | "activity"
  | "food"
  | "shopping"
  | "free_time";

export interface FlightSegment {
  flight_number: string;
  date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  origin: string;
  origin_terminal: string | null;
  destination: string;
  destination_terminal: string | null;
  aircraft: string;
  duration: string;
}

export interface FlightPassenger {
  name: string;
  seat: string;
  carry_on: string;
  checked_baggage: string;
}

export interface FlightDetails {
  booking_reference: string;
  fare: string;
  cabin: string;
  segments: FlightSegment[];
  passengers: FlightPassenger[];
}

export interface Trip {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  start_date: string;
  end_date: string;
}

export interface FamilyProfile {
  id: string;
  display_name: FamilyUserName;
  role: "parent" | "teen" | "member" | "guest" | string;
  avatar_emoji: string;
}

export interface ItineraryEvent {
  id: string;
  trip_id: string;
  date: string;
  city: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  sort_order: number;
  status: ItineraryStatus;
  category: ItineraryCategory;
  location_name: string | null;
  google_maps_url: string | null;
  start_point: string | null;
  end_point: string | null;
  teen_interest: string | null;
  food_ideas: string | null;
  flight_details: FlightDetails | null;
  travel_mode: string | null;
  travel_details: string | null;
  planning_note: string | null;
}

export interface Phrase {
  id: string;
  category: string;
  english: string;
  japanese: string;
  romaji: string | null;
  note: string | null;
}

export interface SignSymbol {
  id: string;
  symbol: string;
  romaji: string | null;
  meaning: string;
  where_seen: string | null;
}

export interface PlaceFact {
  id: string;
  place: string;
  city: string | null;
  fact: string;
  itinerary_event_id: string | null;
  tip: string | null;
}

export interface RestaurantIdea {
  id: string;
  city: string;
  area: string | null;
  type: string | null;
  idea: string;
  priority: string | null;
  booking_needed: string | null;
  link: string | null;
  notes: string | null;
}

export interface Accommodation {
  id: string;
  city: string;
  dates: string | null;
  recommended_area: string | null;
  why_this_area: string | null;
  actual_accommodation: string | null;
  booking_link: string | null;
  notes: string | null;
  reservation_number: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  room_type: string | null;
  rooms: number | null;
  guests: number | null;
  nights: number | null;
  scheduled_arrival_time: string | null;
  check_in_window: string | null;
  check_out_window: string | null;
  total_amount_jpy: number | null;
  payment_method: string | null;
  telephone: string | null;
  address: string | null;
  cancellation_policy: string | null;
}

export interface EventComment {
  id: string;
  trip_id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: Pick<FamilyProfile, "display_name" | "avatar_emoji"> | null;
}

export interface Suggestion {
  id: string;
  trip_id: string;
  target_event_id: string | null;
  suggested_by: string | null;
  title: string;
  description: string | null;
  city: string | null;
  date: string | null;
  preferred_time: string | null;
  google_maps_url: string | null;
  status: "open" | "accepted" | "rejected" | "parked";
  votes_for: number;
  votes_against: number;
  created_at: string;
  author: Pick<FamilyProfile, "display_name" | "avatar_emoji"> | null;
}

export interface TripData {
  trip: Trip;
  events: ItineraryEvent[];
  phrases: Phrase[];
  signs: SignSymbol[];
  facts: PlaceFact[];
  restaurants: RestaurantIdea[];
  accommodations: Accommodation[];
  comments: EventComment[];
  suggestions: Suggestion[];
  profile: FamilyProfile | null;
  demo: boolean;
}
