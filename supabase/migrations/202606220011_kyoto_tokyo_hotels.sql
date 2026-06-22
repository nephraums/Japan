alter table public.accommodations
  add column if not exists check_in_window text,
  add column if not exists check_out_window text,
  add column if not exists address text;

update public.accommodations accommodation
set actual_accommodation = 'MIMARU Kyoto Kawaramachi Gojo',
    booking_link = 'https://www.google.com/maps/search/?api=1&query=MIMARU%20Kyoto%20Kawaramachi%20Gojo%2C%20Kyoto%2C%20Japan',
    notes = 'Confirmed for Sarah Wilkinson and three other adults. No meal option. City tax may be charged separately; photo ID and a credit card are required at check-in.',
    reservation_number = '5065114101',
    check_in_date = '2026-07-07',
    check_out_date = '2026-07-08',
    check_in_window = '15:00–22:00',
    check_out_window = '07:00–11:00',
    room_type = 'Apartment · 5 single beds',
    rooms = 1,
    guests = 4,
    nights = 1,
    scheduled_arrival_time = '15:00',
    total_amount_jpy = 41393,
    payment_method = 'Booking.com automatic card charge · unpaid',
    telephone = '+81 75-744-6750',
    address = '17-1 Hiraicho, Shimogyo-ku, Kyoto, Kyoto, Japan',
    cancellation_policy = 'Free cancellation until 29 June 2026 at 23:59 JST. From 30 June or for a no-show: full reservation price (AUD 403.19).'
from public.trips trip
where accommodation.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and accommodation.city = 'Kyoto';

update public.accommodations accommodation
set actual_accommodation = 'Cozy APT Stay in Center Tokyo -SHIBUYA',
    booking_link = 'https://www.google.com/maps/search/?api=1&query=Cozy%20APT%20Stay%20in%20Center%20Tokyo%20SHIBUYA%2C%20Dogenzaka%2C%20Tokyo%2C%20Japan',
    notes = 'Confirmed for Sarah Wilkinson and three other adults. No meal option. ¥163,900 paid and ¥140,860 remaining.',
    reservation_number = '6382485346',
    check_in_date = '2026-07-08',
    check_out_date = '2026-07-12',
    check_in_window = '16:00–23:00',
    check_out_window = '06:00–11:00',
    room_type = 'Apartment with balcony',
    rooms = 1,
    guests = 4,
    nights = 4,
    scheduled_arrival_time = '16:00',
    total_amount_jpy = 304760,
    payment_method = 'Booking.com · ¥163,900 paid · ¥140,860 remaining',
    telephone = '+81 80-7657-3699',
    address = '2-19 Dogenzaka, Shibuya-ku, Tokyo, Japan',
    cancellation_policy = 'Non-refundable and dates cannot be changed. Cancellation through 8 July 2026 at 23:59: ¥158,400; from 9 July or no-show: ¥316,800.'
from public.trips trip
where accommodation.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and accommodation.city = 'Tokyo';

update public.bookings booking
set status = 'Confirmed',
    link = 'https://www.google.com/maps/search/?api=1&query=MIMARU%20Kyoto%20Kawaramachi%20Gojo%2C%20Kyoto%2C%20Japan',
    notes = 'MIMARU Kyoto Kawaramachi Gojo · confirmation 5065114101 · one night · apartment with 5 single beds for four guests · check-in 15:00–22:00 · ¥41,393 payment amount'
from public.trips trip
where booking.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and booking.booking = 'Kyoto accommodation';

update public.bookings booking
set status = 'Confirmed',
    link = 'https://www.google.com/maps/search/?api=1&query=Cozy%20APT%20Stay%20in%20Center%20Tokyo%20SHIBUYA%2C%20Dogenzaka%2C%20Tokyo%2C%20Japan',
    notes = 'Cozy APT Stay in Center Tokyo -SHIBUYA · confirmation 6382485346 · four nights · apartment with balcony for four guests · check-in 16:00–23:00 · ¥304,760 total'
from public.trips trip
where booking.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and booking.booking = 'Tokyo accommodation';

update public.itinerary_events event
set start_point = 'APA HOTEL&RESORT OSAKA NAMBA EKIMAE TOWER',
    end_point = 'MIMARU Kyoto Kawaramachi Gojo',
    google_maps_url = 'https://www.google.com/maps/dir/?api=1&origin=APA%20HOTEL%26RESORT%20OSAKA%20NAMBA%20EKIMAE%20TOWER&destination=MIMARU%20Kyoto%20Kawaramachi%20Gojo&travelmode=transit',
    travel_mode = 'JR trains · Kyoto subway',
    travel_details = 'From APA Osaka Namba Ekimae Tower, travel from JR Namba or Osaka-Namba to Osaka/Umeda, then take a JR Special Rapid service to Kyoto Station. Continue one stop on the Karasuma subway line to Gojo and walk to MIMARU Kyoto Kawaramachi Gojo. After leaving luggage, use the Keihan line from Kiyomizu-Gojo to Fushimi-inari.',
    planning_note = 'MIMARU check-in begins at 15:00. Confirm whether the hotel can store luggage earlier; otherwise use Kyoto Station lockers.',
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Train Osaka to Kyoto; Fushimi Inari';

update public.itinerary_events event
set start_point = 'MIMARU Kyoto Kawaramachi Gojo',
    end_point = 'MIMARU Kyoto Kawaramachi Gojo',
    travel_mode = 'Kyoto subway + JR · or walk locally',
    travel_details = 'For Arashiyama, travel from MIMARU to Kyoto Station via Gojo subway station, then take the JR Sagano Line to Saga-Arashiyama and walk to the bamboo grove. Otherwise keep the morning around Gojo, the Kamo River and Kawaramachi.',
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Optional Arashiyama or slow Kyoto morning';

update public.itinerary_events event
set start_point = 'MIMARU Kyoto Kawaramachi Gojo',
    end_point = 'Cozy APT Stay in Center Tokyo -SHIBUYA',
    google_maps_url = 'https://www.google.com/maps/dir/?api=1&origin=MIMARU%20Kyoto%20Kawaramachi%20Gojo&destination=Cozy%20APT%20Stay%20in%20Center%20Tokyo%20SHIBUYA&travelmode=transit',
    travel_mode = 'Tokaido Shinkansen · JR Yamanote Line',
    travel_details = 'Travel from MIMARU to Kyoto Station, then take a reserved Nozomi to Shinagawa. Change to the JR Yamanote Line for Shibuya. The Dogenzaka apartment is uphill from Shibuya Station; with luggage, use a short taxi for the final leg. Check-in is 16:00–23:00.',
    planning_note = 'Book the Shinkansen and confirm the apartment''s key or access instructions before arrival. Check oversized-luggage rules if any bag exceeds the limit.',
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Shinkansen to Tokyo; check in';

update public.itinerary_events event
set start_point = 'Cozy APT Stay in Center Tokyo -SHIBUYA',
    google_maps_url = 'https://www.google.com/maps/dir/?api=1&origin=Cozy%20APT%20Stay%20in%20Center%20Tokyo%20SHIBUYA&destination=Narita%20International%20Airport%20Terminal%203&travelmode=transit',
    travel_mode = 'Narita Express from Shibuya',
    travel_details = 'Collect bags from the Dogenzaka apartment, then take a reserved Narita Express from Shibuya Station to Narita Airport Terminal 2·3. A taxi from the apartment to the station is sensible with luggage. Aim to reach Terminal 3 by about 17:00 for the 20:05 flight.',
    planning_note = 'Check the July Narita Express timetable when reservations open and plan to leave Shibuya around 15:30–16:00. Confirm luggage storage after the 11:00 apartment checkout.',
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Lunch; collect bags; transfer to Narita';
