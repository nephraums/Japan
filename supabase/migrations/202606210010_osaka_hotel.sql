alter table public.accommodations
  add column if not exists reservation_number text,
  add column if not exists check_in_date date,
  add column if not exists check_out_date date,
  add column if not exists room_type text,
  add column if not exists rooms integer check (rooms is null or rooms > 0),
  add column if not exists guests integer check (guests is null or guests > 0),
  add column if not exists nights integer check (nights is null or nights > 0),
  add column if not exists scheduled_arrival_time time,
  add column if not exists total_amount_jpy integer check (total_amount_jpy is null or total_amount_jpy >= 0),
  add column if not exists payment_method text,
  add column if not exists telephone text,
  add column if not exists cancellation_policy text;

update public.accommodations accommodation
set actual_accommodation = 'APA HOTEL&RESORT OSAKA NAMBA EKIMAE TOWER',
    booking_link = 'https://www.google.com/maps/search/?api=1&query=APA%20HOTEL%26RESORT%20OSAKA%20NAMBA%20EKIMAE%20TOWER%2C%20Osaka%2C%20Japan',
    notes = 'Confirmed for four guests in one connecting fourth room.',
    reservation_number = '260608007781',
    check_in_date = '2026-07-04',
    check_out_date = '2026-07-07',
    room_type = 'Connecting Fourth Room 28 m² · 2 beds × 2 beds',
    rooms = 1,
    guests = 4,
    nights = 3,
    scheduled_arrival_time = '22:00',
    total_amount_jpy = 72920,
    payment_method = 'Credit card',
    telephone = '+81 6-6635-2811',
    cancellation_policy = 'No-show/no arrival: 100% of total amount. Cancellation on accommodation date: one-night penalty.'
from public.trips trip
where accommodation.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and accommodation.city = 'Osaka';

update public.bookings booking
set status = 'Confirmed',
    link = 'https://www.google.com/maps/search/?api=1&query=APA%20HOTEL%26RESORT%20OSAKA%20NAMBA%20EKIMAE%20TOWER%2C%20Osaka%2C%20Japan',
    notes = 'APA HOTEL&RESORT OSAKA NAMBA EKIMAE TOWER · reservation 260608007781 · 3 nights · connecting fourth room for four guests · arrival 22:00 · ¥72,920'
from public.trips trip
where booking.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and booking.booking = 'Osaka accommodation';

update public.itinerary_events event
set end_point = 'APA HOTEL&RESORT OSAKA NAMBA EKIMAE TOWER',
    google_maps_url = 'https://www.google.com/maps/search/?api=1&query=APA%20HOTEL%26RESORT%20OSAKA%20NAMBA%20EKIMAE%20TOWER%2C%20Osaka%2C%20Japan',
    travel_mode = 'Nankai train · then walk or taxi',
    travel_details = 'Take the Nankai Rapi:t or Airport Express from Kansai Airport to Nankai Namba. APA Hotel & Resort Osaka Namba Ekimae Tower is near JR Namba/OCAT, around a 10–15 minute walk from Nankai Namba; use a short taxi with luggage after the late arrival.',
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Transfer to hotel; late Dotonbori food if energy allows';
