alter table public.itinerary_events
  add column if not exists flight_details jsonb;

update public.itinerary_events event
set
  title = 'JQ13 Sydney to Osaka (Kansai)',
  description = 'Jetstar JQ13. Depart Sydney 11:00 and arrive Osaka Kansai 19:50 on 4 July; all times local.',
  start_time = '11:00',
  end_time = '19:50',
  status = 'confirmed',
  category = 'flight',
  start_point = 'Sydney Airport T1 International',
  end_point = 'Kansai International Airport',
  google_maps_url = null,
  flight_details = '{"booking_reference":"ULJNYF","fare":"Starter Plus","cabin":"Economy","segments":[{"flight_number":"JQ13","date":"2026-07-04","departure_time":"11:00","arrival_date":"2026-07-04","arrival_time":"19:50","origin":"Sydney Airport","origin_terminal":"T1 International","destination":"Kansai International Airport","destination_terminal":null,"aircraft":"Boeing 787 Dreamliner","duration":"9 hr 50 min"}],"passengers":[{"name":"Nigel Ephraums","seat":"34A","carry_on":"7 kg","checked_baggage":"20 kg"},{"name":"Sarah Wilkinson","seat":"34B","carry_on":"7 kg","checked_baggage":"20 kg"},{"name":"Evelyn Ephraums","seat":"34C","carry_on":"7 kg","checked_baggage":"20 kg"},{"name":"Harrison Ephraums","seat":"34D","carry_on":"7 kg","checked_baggage":"20 kg"}]}'::jsonb
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.date = '2026-07-04'
  and event.title in ('Fly Sydney to Osaka on JQ12', 'JQ13 Sydney to Osaka (Kansai)');

update public.itinerary_events event
set
  title = 'JQ26 + JQ953 Tokyo to Sydney via Cairns',
  description = 'Jetstar JQ26 departs Narita at 20:05 on 12 July, connecting in Cairns to JQ953 and arriving Sydney at 09:45 on 13 July; all times local.',
  start_time = '20:05',
  end_time = '23:59',
  status = 'confirmed',
  category = 'flight',
  start_point = 'Narita International Airport T3',
  end_point = 'Sydney via Cairns',
  google_maps_url = null,
  flight_details = '{"booking_reference":"ML16WF","fare":"Starter Plus","cabin":"Economy","segments":[{"flight_number":"JQ26","date":"2026-07-12","departure_time":"20:05","arrival_date":"2026-07-13","arrival_time":"04:30","origin":"Narita International Airport","origin_terminal":"Terminal 3","destination":"Cairns Airport","destination_terminal":null,"aircraft":"Boeing 787 Dreamliner","duration":"7 hr 25 min"},{"flight_number":"JQ953","date":"2026-07-13","departure_time":"06:45","arrival_date":"2026-07-13","arrival_time":"09:45","origin":"Cairns Airport","origin_terminal":"Domestic Terminal","destination":"Sydney Airport","destination_terminal":null,"aircraft":"Airbus A320","duration":"3 hr"}],"passengers":[{"name":"Nigel Ephraums","seat":"51A","carry_on":"7 kg","checked_baggage":"20 kg"},{"name":"Sarah Wilkinson","seat":"51B","carry_on":"7 kg","checked_baggage":"20 kg"},{"name":"Evelyn Ephraums","seat":"51C","carry_on":"7 kg","checked_baggage":"20 kg"},{"name":"Harrison Ephraums","seat":"51D","carry_on":"7 kg","checked_baggage":"20 kg"}]}'::jsonb
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.date = '2026-07-12'
  and event.title in ('JQ26 Tokyo to Sydney', 'JQ26 + JQ953 Tokyo to Sydney via Cairns');
