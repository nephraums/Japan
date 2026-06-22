alter table public.itinerary_events
  add column if not exists travel_mode text,
  add column if not exists travel_details text,
  add column if not exists planning_note text;

alter table public.place_facts
  add column if not exists tip text;

create or replace function public.update_itinerary_event(
  p_event_id uuid,
  p_title text,
  p_description text,
  p_start_time time,
  p_end_time time,
  p_google_maps_url text,
  p_status text,
  p_travel_mode text,
  p_travel_details text
)
returns public.itinerary_events
language plpgsql
security definer
set search_path = public, private, pg_temp
as $function$
declare
  existing_event public.itinerary_events%rowtype;
  updated_event public.itinerary_events%rowtype;
begin
  select * into existing_event
  from public.itinerary_events
  where id = p_event_id
  for update;

  if existing_event.id is null or not private.is_trip_member(existing_event.trip_id) then
    raise exception 'Trip access denied' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'End time must be after start time' using errcode = '22023';
  end if;
  if p_status not in ('draft', 'confirmed', 'decision_needed', 'to_book', 'cancelled', 'done') then
    raise exception 'Invalid itinerary status' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_google_maps_url, '')), '') is not null
     and p_google_maps_url !~ '^https://(www\\.)?google\\.(com|co\\.jp)/maps/' then
    raise exception 'Map link must be a Google Maps HTTPS URL' using errcode = '22023';
  end if;

  update public.itinerary_events
  set title = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      start_time = p_start_time,
      end_time = p_end_time,
      google_maps_url = nullif(trim(coalesce(p_google_maps_url, '')), ''),
      status = p_status,
      travel_mode = nullif(trim(coalesce(p_travel_mode, '')), ''),
      travel_details = nullif(trim(coalesce(p_travel_details, '')), ''),
      updated_at = now()
  where id = p_event_id
  returning * into updated_event;

  return updated_event;
end;
$function$;

revoke all on function public.update_itinerary_event(uuid, text, text, time, time, text, text, text, text) from public, anon;
grant execute on function public.update_itinerary_event(uuid, text, text, time, time, text, text, text, text) to authenticated;

with source as (
  select *
  from jsonb_to_recordset($recommendations$[{"title":"JQ13 Sydney to Osaka (Kansai)","travel_mode":"Flight","travel_details":"Jetstar JQ13 from Sydney T1 International to Kansai International Airport. Allow at least three hours at Sydney Airport before the 11:00 departure.","planning_note":null},{"title":"Arrive Kansai International Airport","travel_mode":"Walk · airport formalities","travel_details":"Follow International Arrivals through immigration, baggage claim and customs, then regroup in the public arrivals hall before buying or collecting transport tickets.","planning_note":"This block previously occurred before the flight landed. It has been moved to 19:50–20:30."},{"title":"Transfer to hotel; late Dotonbori food if energy allows","travel_mode":"Nankai train · then walk or taxi","travel_details":"For a Namba-area hotel, take the Nankai Rapi:t or Airport Express from Kansai Airport to Nankai Namba. Rapi:t is faster with reserved seating; the Airport Express is cheaper. Use a short taxi for luggage if the hotel is not close to the station.","planning_note":"Landing at 19:50 makes Dotonbori optional. Expect hotel arrival around 21:30–22:30 after immigration and the airport train."},{"title":"Kuromon Ichiba Market","travel_mode":"Walk","travel_details":"From Namba, walk about 10–15 minutes to the market’s west or south entrance. Start near opening time and continue on foot toward Dotonbori afterwards.","planning_note":null},{"title":"Dotonbori, Shinsaibashi, Amerikamura, Orange Street","travel_mode":"Walk","travel_details":"Make this a one-way walking loop: Kuromon or Namba → Dotonbori → Shinsaibashi-suji → Amerikamura → Orange Street. Use Osaka Metro only if heat or fatigue catches up.","planning_note":null},{"title":"Shinsekai; dinner in Ura Namba or Hozenji Yokocho","travel_mode":"Osaka Metro · walk","travel_details":"Take the Midosuji Line from Namba to Dobutsuen-mae for Shinsekai. Return toward Namba by metro for Ura Namba or Hozenji Yokocho; both dinner areas are easiest on foot from Namba.","planning_note":"Shinsekai plus a second dinner district may feel rushed. Choose Shinsekai dinner or return to Namba based on energy."},{"title":"Universal Studios Japan or Osaka Castle","travel_mode":"JR for USJ · Osaka Metro for castle","travel_details":"USJ: travel via JR Osaka Loop Line and transfer at Nishikujo to the JR Yumesaki Line for Universal City. Osaka Castle: use Tanimachi 4-chome or Morinomiya station and walk through the park.","planning_note":"Choose USJ or Osaka Castle before booking. They are alternative plans, not a workable combined morning."},{"title":"USJ full day or Umeda/Pokémon Center/shopping","travel_mode":"JR","travel_details":"USJ: remain in the park for the full day. Umeda alternative: take the Midosuji Line from Namba to Umeda; Pokémon Center Osaka is inside Daimaru at Osaka Station City.","planning_note":"This depends on the morning decision. If choosing USJ, treat it as the entire day and pre-book dated tickets."},{"title":"Easy Namba dinner or teamLab Botanical Garden Osaka","travel_mode":"Walk · or Osaka Metro","travel_details":"Namba dinner is walkable from the hotel area. For teamLab Botanical Garden, take the Midosuji Line to Nagai Station, then walk roughly 10 minutes into Nagai Botanical Garden; return by the same route.","planning_note":"teamLab Botanical Garden is an evening commitment after a long USJ day. Keep Namba dinner as the low-energy fallback."},{"title":"Train Osaka to Kyoto; Fushimi Inari","travel_mode":"JR trains","travel_details":"Travel from Namba to Osaka/Umeda, then take a JR Special Rapid service to Kyoto Station. Drop luggage at the hotel or station lockers, then take the JR Nara Line two stops to Inari Station.","planning_note":"Luggage must be stored before Fushimi Inari. Confirm the Kyoto hotel bag-drop arrangement or use Kyoto Station lockers."},{"title":"Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka","travel_mode":"Keihan train · taxi/bus · walk","travel_details":"From Fushimi Inari, use the Keihan Line from Fushimi-inari to Gion-shijo. Walk to Nishiki Market, then use a taxi or city bus toward Kiyomizu-michi and finish uphill on foot. Walk downhill through Sannenzaka and Ninenzaka.","planning_note":"This is the densest block of the trip. Nishiki stalls begin closing late afternoon, while Kiyomizu involves hills and crowds; keep lunch brief and consider a taxi."},{"title":"Gion, Pontocho, Kamo River dinner","travel_mode":"Walk","travel_details":"Continue downhill from Higashiyama into Gion, cross the Kamo River near Shijo, then explore Pontocho on foot. Take a taxi back to the hotel if everyone is tired.","planning_note":null},{"title":"Optional Arashiyama or slow Kyoto morning","travel_mode":"JR · or walk locally","travel_details":"For Arashiyama, take the JR Sagano Line from Kyoto Station to Saga-Arashiyama, then walk to the bamboo grove. Leave luggage at the hotel or Kyoto Station. Otherwise keep the morning close to the hotel and station.","planning_note":"Arashiyama adds roughly an hour of return travel before the Tokyo transfer. Only do it with an early start and confirmed luggage storage."},{"title":"Shinkansen to Tokyo; check in","travel_mode":"Tokaido Shinkansen · local train","travel_details":"Take a Nozomi from Kyoto to Tokyo or Shinagawa; reserve seats together. Continue to the Tokyo hotel by JR or metro. Check oversized-luggage rules before booking if any bag exceeds the limit.","planning_note":"Train time and Tokyo hotel are still needed before the evening plan can be timed accurately."},{"title":"Shibuya Crossing, Hachiko, Shibuya Sky, dinner","travel_mode":"JR/metro · then walk","travel_details":"Travel to Shibuya Station, use the Hachiko exit for the statue and crossing, then walk through Shibuya Scramble Square to Shibuya Sky. Keep the neighbourhood portion entirely on foot.","planning_note":"Shibuya Sky requires a timed ticket. Choose this evening or 9 July, not both, and book around sunset only if the transfer day has enough buffer."},{"title":"Meiji Shrine; Harajuku; Takeshita Street","travel_mode":"JR Yamanote Line · walk","travel_details":"Use Harajuku Station for Meiji Shrine’s main approach. After the shrine, exit toward Harajuku and walk Takeshita Street; Meiji-jingumae metro station is useful for the next leg.","planning_note":null},{"title":"Teen independent block: Tokyu Plaza to Hachiko via Cat Street/Miyashita/Shibuya Parco","travel_mode":"Walk","travel_details":"Use a simple southbound walking route: Tokyu Plaza Harajuku → Cat Street → Miyashita Park → Shibuya Parco → Hachiko. Agree on fixed check-in times and a meeting point before splitting up.","planning_note":"Add phone data, live location sharing and a clear fallback meeting point before treating this as independent time."},{"title":"Shibuya Sky or dinner in Ebisu/Nakameguro","travel_mode":"JR Yamanote Line · Tokyo Metro","travel_details":"Shibuya Sky is beside Shibuya Station. For Ebisu, take the JR Yamanote Line one stop; for Nakameguro, use the Tokyu Toyoko Line or travel via Ebisu and the Hibiya Line.","planning_note":"This duplicates the previous night’s Shibuya Sky option. Keep it as the weather backup and choose one dinner neighbourhood."},{"title":"Travel to Maihama / Tokyo Disney Resort","travel_mode":"JR trains","travel_details":"Travel to Tokyo Station, follow the long internal walk to the Keiyo Line, then take a train to Maihama. From Shibuya allow roughly 50–65 minutes door to door, plus queue time before park opening.","planning_note":"Park tickets and opening strategy are still unresolved. Aim to arrive well before the published opening time."},{"title":"Tokyo DisneySea and/or Disneyland","travel_mode":"Walk · Disney Resort Line","travel_details":"Disneyland is walkable from Maihama. For DisneySea, take the Disney Resort Line from Resort Gateway Station to Tokyo DisneySea Station.","planning_note":"Choose one park. Trying to cover both in a single day will sacrifice major attractions and requires ticket products that may not be available."},{"title":"Return to Tokyo hotel","travel_mode":"Disney Resort Line · JR trains","travel_details":"Return to Maihama, take the JR Keiyo Line to Tokyo Station, then connect to the hotel. Expect crowded trains after closing and agree on a family meeting point before leaving the park.","planning_note":null},{"title":"Asakusa, Senso-ji, Nakamise","travel_mode":"Tokyo Metro Ginza Line · walk","travel_details":"Use the Ginza Line to Asakusa Station, then walk to Kaminarimon, Nakamise and Senso-ji. Continue beyond the main hall or along the Sumida River when the central approach becomes crowded.","planning_note":null},{"title":"Akihabara gaming/anime/electronics","travel_mode":"Tokyo Metro or Tsukuba Express","travel_details":"From Asakusa, take the Ginza Line to Suehirocho for northern Akihabara, or the Tsukuba Express to Akihabara Station. Explore on foot and set a meeting point because shops are spread across multiple buildings and floors.","planning_note":null},{"title":"teamLab; final dinner in Ebisu or Nakameguro","travel_mode":"Tokyo Metro Hibiya Line","travel_details":"For teamLab Borderless at Azabudai Hills, take the Hibiya Line to Kamiyacho. Afterward the same line runs directly toward Ebisu and Nakameguro for dinner.","planning_note":"A timed teamLab ticket is required. Confirm Borderless rather than Planets, then book dinner with enough travel buffer."},{"title":"Final shopping / breakfast","travel_mode":"Walk · local train","travel_details":"Stay close to the hotel or a direct station route. Avoid crossing the city with luggage and choose shops that open early enough for the departure schedule.","planning_note":"Leave purchases packable and keep passports, flight documents and airport clothes out of checked luggage."},{"title":"Lunch; collect bags; transfer to Narita","travel_mode":"Narita Express or Keisei Skyliner","travel_details":"From Shibuya/Shinjuku/Tokyo use a reserved Narita Express; from Ueno/Nippori use the Keisei Skyliner. Choose after the Tokyo hotel is booked. Aim to reach Narita Terminal 3 by about 17:00 for the 20:05 flight.","planning_note":"The hotel location determines the best airport train. Plan to leave central Tokyo around 15:30–16:00 and do not rely on a 17:00 city departure."},{"title":"JQ26 + JQ953 Tokyo to Sydney via Cairns","travel_mode":"Flight · domestic connection","travel_details":"Jetstar JQ26 departs Narita Terminal 3 for Cairns. After arriving, follow transfer instructions for JQ953 to Sydney and allow for immigration, customs and the domestic-terminal connection.","planning_note":"The Cairns connection is 2 hr 15 min. Keep arrival documents and the domestic boarding details accessible."}]$recommendations$::jsonb)
    as item(title text, travel_mode text, travel_details text, planning_note text)
)
update public.itinerary_events event
set travel_mode = source.travel_mode,
    travel_details = source.travel_details,
    planning_note = source.planning_note,
    updated_at = now()
from source, public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = source.title;

with source as (
  select *
  from jsonb_to_recordset($facts$[{"place":"Dotonbori","fact":"Dotonbori developed around its canal and theatre district and is now Osaka’s most recognisable night-time streetscape. Ebisu Bridge faces the Glico running-man sign, while the surrounding lanes are packed with oversized restaurant signs and casual food counters.","tip":"Visit around dusk to see the signs in daylight and illuminated. Ebisu Bridge becomes extremely crowded; take photos from the canal walk and use the parallel lanes for easier movement and shorter food queues."},{"place":"Kuromon Ichiba Market","fact":"This covered market runs for roughly 600 metres and has supplied Osaka kitchens for generations. Today it mixes specialist produce shops with seafood, wagyu, fruit, sweets and ready-to-eat snacks aimed at visitors.","tip":"Arrive in the morning, ideally before 10:30, because the aisles become congested and popular items sell out. Compare prices between stalls and eat beside the stall where purchased rather than blocking the walkway."},{"place":"Osaka Castle","fact":"Toyotomi Hideyoshi began the original castle in 1583. The present main tower is a concrete museum reconstruction with an observation level; the huge stone walls, moats and park communicate the scale of the former fortress better than the modern interior alone.","tip":"Go early if entering the museum because lift and ticket queues build quickly. If time is short, prioritise the grounds, moat viewpoints and Nishinomaru area rather than rushing every museum floor."},{"place":"Shinsekai","fact":"Shinsekai grew as an early-20th-century entertainment district inspired by Paris and New York. Rebuilt Tsutenkaku tower anchors its retro streets, which are known for kushikatsu restaurants, bright signs and old-school game arcades.","tip":"The district is most atmospheric after the signs come on. For kushikatsu, order in rounds and follow the house rule against double-dipping shared sauce; quieter restaurants sit a street or two away from the tower."},{"place":"Fushimi Inari","fact":"Fushimi Inari Taisha is the head shrine of Inari worship and is famous for the Senbon Torii paths climbing Mount Inari. The full summit circuit takes roughly two to three hours, but the crowds thin substantially beyond the first major viewpoint.","tip":"Arrive before about 08:00 if possible, wear shoes suitable for steps and carry water in July. Even without completing the summit, continue beyond the first dense gate tunnels for a calmer experience."},{"place":"Gion","fact":"Gion is Kyoto’s best-known traditional entertainment district, centred on areas including Hanamikoji and the Shirakawa canal. Its machiya buildings contain restaurants, teahouses and working arts venues rather than being an open-air museum.","tip":"Visit around late afternoon or early evening, but stay on public streets and never block or chase geiko or maiko for photographs. Shirakawa is generally calmer than Hanamikoji."},{"place":"Nishiki Market","fact":"Often called Kyoto’s Kitchen, Nishiki is a narrow five-block covered street where long-established shops specialise in pickles, tea, knives, sweets, seafood and seasonal Kyoto ingredients.","tip":"Aim for roughly 10:00–11:30: early enough to move comfortably but late enough for most shops to be open. Avoid eating while walking; many stalls provide a small space where food should be finished."},{"place":"Kiyomizu-dera","fact":"Kiyomizu-dera is a UNESCO-listed temple whose wooden stage projects from the Higashiyama hillside above Kyoto. Its name refers to the pure water of Otowa Waterfall, where visitors queue to drink from separate streams.","tip":"The final approach is steep, hot and crowded in July. Use a taxi or bus to reduce the climb, arrive early or later in the afternoon, and allow extra time if queuing at Otowa Waterfall."},{"place":"Ninenzaka and Sannenzaka","fact":"These preserved sloping streets connect Kiyomizu-dera with lower Higashiyama. Traditional façades now house craft shops, snack counters, cafés and souvenir stores, with Yasaka Pagoda visible from nearby lanes.","tip":"Walk downhill from Kiyomizu-dera rather than uphill, wear shoes with grip on the stone slopes and explore before mid-morning if photographs matter. Keep to one side when stopping."},{"place":"Pontocho and the Kamo River","fact":"Pontocho is a narrow dining and entertainment lane running parallel to the Kamo River. In summer, some restaurants build raised riverside platforms called kawayuka, offering a distinctive but often premium-priced evening setting.","tip":"Check menus, seating charges and whether a river terrace is guaranteed before committing. Reserve a terrace restaurant if it matters; otherwise nearby Kiyamachi and side streets offer more flexible choices."},{"place":"Arashiyama","fact":"Arashiyama combines the famous bamboo path with Tenryu-ji, villa gardens, Togetsukyo Bridge and trails along the Katsura River. The bamboo section itself is short, so the district rewards combining it with at least one garden or temple.","tip":"Reach the bamboo grove before about 08:00 for the best chance of space. Enter via Tenryu-ji or continue to Okochi Sanso rather than turning around at the busiest central section."},{"place":"Shibuya Crossing","fact":"Shibuya’s scramble crossing stops vehicles and releases pedestrians in every direction at once. The surrounding station district has several elevated viewpoints, while street level delivers the scale and sound that photographs cannot.","tip":"Cross once, then watch a later cycle from above. Station exits are confusing, so use the Hachiko exit as the family meeting point and avoid stopping in the middle of the crossing for photos."},{"place":"Harajuku","fact":"Harajuku spans several different moods: youth-oriented Takeshita Street, independent fashion around Cat Street and more polished architecture and brands along Omotesando. Meiji Shrine’s forest begins immediately beside the busy station area.","tip":"Treat Harajuku as connected neighbourhoods rather than only Takeshita Street. Start at the shrine, then visit Takeshita before the afternoon crush and continue toward Cat Street."},{"place":"Hachiko","fact":"The small bronze statue commemorates the Akita dog remembered for returning to Shibuya Station after his owner’s death. It has become one of Tokyo’s most famous meeting places beside the scramble crossing.","tip":"Expect a queue for close photographs and heavy meeting-point crowds. Agree on a precise side of the statue or the nearby police box if using the area to regroup."},{"place":"Shibuya Sky","fact":"Shibuya Sky occupies the upper levels of Shibuya Scramble Square, with indoor galleries and an open-air rooftop above the crossing. Entry is timed and rooftop access can be restricted by rain or strong wind.","tip":"Sunset slots sell quickly, so book as soon as the date opens. Loose items must go into lockers before the roof; keep a secure phone strap and allow at least an hour without scheduling dinner too tightly."},{"place":"Meiji Shrine","fact":"Meiji Jingu is dedicated to Emperor Meiji and Empress Shoken. Its broad gravel approach passes through a man-made forest planted from trees donated across Japan, creating a marked contrast with neighbouring Harajuku.","tip":"Allow 10–15 minutes each way just for the forest approach. Walk at the side of the path, bow lightly at torii gates and use the purification basin before approaching the main shrine."},{"place":"Takeshita Street","fact":"Takeshita Street is a compact pedestrian lane associated with youth fashion, accessories, character shops and highly visual sweets. Its popularity means the experience changes dramatically between morning and peak afternoon.","tip":"Go before lunch for easier browsing and avoid joining a long food queue merely because it is visible. The side streets and nearby Laforet area often have more interesting fashion with less congestion."},{"place":"Akihabara","fact":"Akihabara layers electronics retailers, arcades, anime and manga shops, hobby stores and themed cafés across entire multi-storey buildings. Specialist stock is often upstairs or in back streets rather than on the most obvious ground floors.","tip":"Choose two or three priority stores before arriving and set a family meeting point. Carry some cash or an IC card for arcade machines, and check tax-free conditions before opening sealed purchases."},{"place":"Asakusa","fact":"Asakusa preserves the atmosphere of Tokyo’s older entertainment districts around Senso-ji, Kaminarimon and the Sumida River. It combines an active temple, shopping streets and small lanes that become much calmer away from Nakamise.","tip":"Arrive early for the temple and photographs, then stay until shops open around mid-morning. Explore one parallel street or the riverside when Nakamise becomes shoulder-to-shoulder."},{"place":"Senso-ji and Nakamise","fact":"Senso-ji is traditionally dated to 628 and is regarded as Tokyo’s oldest temple. Nakamise forms the historic shopping approach between Kaminarimon and the temple precinct, selling snacks, crafts and souvenirs.","tip":"The temple grounds are accessible earlier than most Nakamise shops. Visit the main hall first in quieter conditions, then browse the shopping street on the way back; carry rubbish because public bins are scarce."},{"place":"Tokyo DisneySea","fact":"DisneySea is a Tokyo-exclusive Disney park organised around themed ports, with detailed environments and attractions not found in the same form elsewhere. Entry, attraction access, mobile ordering and some shows are managed through the resort app.","tip":"Install and sign into the official app before arrival, link everyone’s tickets and decide the first priority attraction in advance. Arrive before opening and check Premier Access, Entry Request and mobile-order availability immediately after entry."},{"place":"teamLab","fact":"teamLab Borderless at Azabudai Hills is an immersive digital-art museum without a fixed route; artworks move between rooms and react to visitors. Dark spaces, mirrors, sound and repeated exploration are central to the experience.","tip":"Book a timed entry, travel light and use the lockers. Keep phones charged, supervise meeting points in dark rooms and allow around two to three hours so nobody feels forced through the spaces."}]$facts$::jsonb)
    as item(place text, fact text, tip text)
)
update public.place_facts place_fact
set fact = source.fact,
    tip = source.tip
from source, public.trips trip
where place_fact.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and place_fact.place = source.place;

update public.itinerary_events event
set start_time = '19:50',
    end_time = '20:30',
    status = 'confirmed',
    start_point = 'Kansai International Airport aircraft gate',
    end_point = 'Kansai International Airport arrivals hall',
    google_maps_url = null,
    planning_note = null,
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Arrive Kansai International Airport';

update public.itinerary_events event
set start_time = '20:30',
    end_time = '23:30',
    start_point = 'Kansai International Airport',
    google_maps_url = null,
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title = 'Transfer to hotel; late Dotonbori food if energy allows';

update public.itinerary_events event
set status = 'decision_needed',
    updated_at = now()
from public.trips trip
where event.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and event.title in (
    'Optional Arashiyama or slow Kyoto morning',
    'Shibuya Sky or dinner in Ebisu/Nakameguro',
    'Tokyo DisneySea and/or Disneyland'
  );
