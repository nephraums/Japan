alter table public.signs_symbols
  add column if not exists romaji text;

alter table public.place_facts
  add column if not exists itinerary_event_id uuid
  references public.itinerary_events(id) on delete set null;

create index if not exists place_facts_itinerary_event_idx
  on public.place_facts(itinerary_event_id)
  where itinerary_event_id is not null;

with sign_readings(symbol, romaji) as (
  values
    ('駅', 'Eki'),
    ('入口', 'Iriguchi'),
    ('出口', 'Deguchi'),
    ('北 / 南 / 東 / 西', 'Kita / Minami / Higashi / Nishi'),
    ('精算機', 'Seisanki'),
    ('現金のみ', 'Genkin nomi'),
    ('禁煙', 'Kinen'),
    ('お手洗い', 'Otearai')
)
update public.signs_symbols signs
set romaji = readings.romaji
from sign_readings readings
join public.trips trip on trip.slug = 'japan-2026'
where signs.trip_id = trip.id
  and signs.symbol = readings.symbol;

delete from public.phrasebook phrases
using public.trips trip
where phrases.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and phrases.english = 'No pork, please';

with dining_phrases(category, english, japanese, romaji, note) as (
  values
    ('Food', 'Can we have the menu?', 'メニューをお願いします', 'Menyū o onegaishimasu', null),
    ('Food', 'A table for four, please', '4人です', 'Yonin desu', 'Literally: We are four people'),
    ('Food', 'Do you have an English menu?', '英語のメニューはありますか', 'Eigo no menyū wa arimasu ka?', null),
    ('Food', 'What do you recommend?', 'おすすめは何ですか', 'Osusume wa nan desu ka?', null),
    ('Food', 'We''ll have this, please', 'これをお願いします', 'Kore o onegaishimasu', 'Point to the menu item as you say it'),
    ('Food', 'Water, please', 'お水をお願いします', 'Omizu o onegaishimasu', null),
    ('Food', 'Another one, please', 'もう一つお願いします', 'Mō hitotsu onegaishimasu', 'Useful for another dish, drink or item'),
    ('Food', 'The bill, please', 'お会計をお願いします', 'Okaikei o onegaishimasu', 'In many restaurants you take the bill to the register'),
    ('Food', 'Can I pay by card?', 'カードは使えますか', 'Kādo wa tsukaemasu ka?', null),
    ('Food', 'It was delicious', 'おいしかったです', 'Oishikatta desu', 'A warm compliment after the meal'),
    ('Food', 'Thanks for the meal', 'ごちそうさまでした', 'Gochisōsama deshita', 'Say this when finishing or leaving'),
    ('Restaurant etiquette', 'Welcome', 'いらっしゃいませ', 'Irasshaimase', 'Staff say this when customers enter. You do not need to reply; a smile or nod is fine.'),
    ('Restaurant etiquette', 'Thank you very much', 'ありがとうございました', 'Arigatō gozaimashita', 'Staff often say this as customers leave. It thanks you for your visit.'),
    ('Restaurant etiquette', 'Please come again', 'またお越しくださいませ', 'Mata okoshi kudasaimase', 'A polite farewell that means they hope you will visit again.')
), japan_trip as (
  select id from public.trips where slug = 'japan-2026'
)
insert into public.phrasebook (trip_id, category, english, japanese, romaji, note)
select trip.id, phrase.category, phrase.english, phrase.japanese, phrase.romaji, phrase.note
from japan_trip trip
cross join dining_phrases phrase
where not exists (
  select 1 from public.phrasebook existing
  where existing.trip_id = trip.id and existing.english = phrase.english
);

update public.phrasebook phrases
set romaji = 'Menyū o onegaishimasu'
from public.trips trip
where phrases.trip_id = trip.id
  and trip.slug = 'japan-2026'
  and phrases.english = 'Can we have the menu?';

with new_facts(place, city, fact, event_title) as (
  values
    ('Dotonbori', 'Osaka', 'Osaka’s neon-heavy food district, famous for takoyaki, giant signs, and the Glico running man.', 'Dotonbori, Shinsaibashi, Amerikamura, Orange Street'),
    ('Kuromon Ichiba Market', 'Osaka', 'A covered food market known for seafood, grilled snacks, fruit and grazing-style eating.', 'Kuromon Ichiba Market'),
    ('Osaka Castle', 'Osaka', 'Toyotomi Hideyoshi began the original castle in 1583. Today’s main tower is a museum reconstruction surrounded by large stone walls and moats.', 'Universal Studios Japan or Osaka Castle'),
    ('Shinsekai', 'Osaka', 'This retro entertainment district grew in the early 1900s. Tsutenkaku tower is its landmark, and kushikatsu is the classic local snack.', 'Shinsekai; dinner in Ura Namba or Hozenji Yokocho'),
    ('Fushimi Inari', 'Kyoto', 'Known for thousands of vermilion torii gates climbing the mountain behind the shrine. Fox statues appear throughout because foxes are regarded as messengers of Inari.', 'Train Osaka to Kyoto; Fushimi Inari'),
    ('Gion', 'Kyoto', 'Kyoto’s historic entertainment district with preserved streets and traditional atmosphere. Its geiko and maiko are working artists, so give them space and avoid blocking private lanes.', 'Gion, Pontocho, Kamo River dinner'),
    ('Nishiki Market', 'Kyoto', 'The narrow covered shopping street is often called Kyoto’s Kitchen. Many stalls specialise in one food or ingredient passed down through generations.', 'Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka'),
    ('Kiyomizu-dera', 'Kyoto', 'The temple’s famous wooden stage projects from the hillside without nails. Its name means Pure Water Temple, after the Otowa waterfall below.', 'Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka'),
    ('Ninenzaka and Sannenzaka', 'Kyoto', 'These preserved sloping streets lead toward Kiyomizu-dera and are lined with traditional buildings, small shops and teahouses.', 'Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka'),
    ('Pontocho and the Kamo River', 'Kyoto', 'Pontocho is a narrow dining alley beside the Kamo River. In summer, some restaurants build raised riverside terraces called kawayuka.', 'Gion, Pontocho, Kamo River dinner'),
    ('Arashiyama', 'Kyoto', 'The district is known for its bamboo grove, temple gardens and Togetsukyo Bridge. Early morning is usually the calmest time to explore.', 'Optional Arashiyama or slow Kyoto morning'),
    ('Shibuya Crossing', 'Tokyo', 'One of Tokyo’s best-known intersections and a strong first-night Tokyo moment. The scramble phase lets pedestrians cross in every direction at once.', 'Shibuya Crossing, Hachiko, Shibuya Sky, dinner'),
    ('Harajuku', 'Tokyo', 'Youth culture, fashion, Takeshita Street snacks, and easy access to Meiji Shrine.', 'Meiji Shrine; Harajuku; Takeshita Street'),
    ('Hachiko', 'Tokyo', 'The statue remembers an Akita dog famous for continuing to wait at Shibuya Station for his owner. It is now one of Tokyo’s best-known meeting points.', 'Shibuya Crossing, Hachiko, Shibuya Sky, dinner'),
    ('Shibuya Sky', 'Tokyo', 'This open-air observation deck sits above Shibuya Scramble Square and looks directly over the crossing and Tokyo skyline.', 'Shibuya Crossing, Hachiko, Shibuya Sky, dinner'),
    ('Meiji Shrine', 'Tokyo', 'Meiji Jingu is dedicated to Emperor Meiji and Empress Shoken. Its forest was planted with donated trees from across Japan.', 'Meiji Shrine; Harajuku; Takeshita Street'),
    ('Takeshita Street', 'Tokyo', 'The compact pedestrian street is associated with youth fashion, colourful sweets and small independent shops; it is busiest after late morning.', 'Meiji Shrine; Harajuku; Takeshita Street'),
    ('Akihabara', 'Tokyo', 'Tokyo’s electronics, anime, gaming and arcade district. Look above street level too: many specialist shops and cafés occupy upper floors.', 'Akihabara gaming/anime/electronics'),
    ('Asakusa', 'Tokyo', 'Home to Senso-ji, Tokyo’s oldest temple, and Nakamise shopping street.', 'Asakusa, Senso-ji, Nakamise'),
    ('Senso-ji and Nakamise', 'Tokyo', 'Senso-ji is traditionally dated to 628. Nakamise, the shopping approach between Kaminarimon gate and the temple, sells snacks and souvenirs.', 'Asakusa, Senso-ji, Nakamise'),
    ('Tokyo DisneySea', 'Tokyo', 'Opened in 2001, DisneySea is a sea-themed park unique to Tokyo Disney Resort, organised around themed ports rather than traditional lands.', 'Tokyo DisneySea and/or Disneyland'),
    ('teamLab', 'Tokyo', 'teamLab creates immersive digital artworks that respond to movement and change over time. The experience can involve dark rooms, mirrors and water.', 'teamLab; final dinner in Ebisu or Nakameguro')
), japan_trip as (
  select id from public.trips where slug = 'japan-2026'
), linked_facts as (
  select trip.id as trip_id, source.place, source.city, source.fact, event.id as itinerary_event_id
  from japan_trip trip
  cross join new_facts source
  left join public.itinerary_events event
    on event.trip_id = trip.id and event.title = source.event_title
)
insert into public.place_facts (trip_id, place, city, fact, itinerary_event_id)
select trip_id, place, city, fact, itinerary_event_id
from linked_facts source
where not exists (
  select 1 from public.place_facts existing
  where existing.trip_id = source.trip_id and existing.place = source.place
);

with fact_links(place, event_title) as (
  values
    ('Dotonbori', 'Dotonbori, Shinsaibashi, Amerikamura, Orange Street'),
    ('Kuromon Ichiba Market', 'Kuromon Ichiba Market'),
    ('Osaka Castle', 'Universal Studios Japan or Osaka Castle'),
    ('Shinsekai', 'Shinsekai; dinner in Ura Namba or Hozenji Yokocho'),
    ('Fushimi Inari', 'Train Osaka to Kyoto; Fushimi Inari'),
    ('Gion', 'Gion, Pontocho, Kamo River dinner'),
    ('Nishiki Market', 'Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka'),
    ('Kiyomizu-dera', 'Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka'),
    ('Ninenzaka and Sannenzaka', 'Nishiki Market; Kiyomizu-dera; Ninenzaka/Sannenzaka'),
    ('Pontocho and the Kamo River', 'Gion, Pontocho, Kamo River dinner'),
    ('Arashiyama', 'Optional Arashiyama or slow Kyoto morning'),
    ('Shibuya Crossing', 'Shibuya Crossing, Hachiko, Shibuya Sky, dinner'),
    ('Harajuku', 'Meiji Shrine; Harajuku; Takeshita Street'),
    ('Hachiko', 'Shibuya Crossing, Hachiko, Shibuya Sky, dinner'),
    ('Shibuya Sky', 'Shibuya Crossing, Hachiko, Shibuya Sky, dinner'),
    ('Meiji Shrine', 'Meiji Shrine; Harajuku; Takeshita Street'),
    ('Takeshita Street', 'Meiji Shrine; Harajuku; Takeshita Street'),
    ('Akihabara', 'Akihabara gaming/anime/electronics'),
    ('Asakusa', 'Asakusa, Senso-ji, Nakamise'),
    ('Senso-ji and Nakamise', 'Asakusa, Senso-ji, Nakamise'),
    ('Tokyo DisneySea', 'Tokyo DisneySea and/or Disneyland'),
    ('teamLab', 'teamLab; final dinner in Ebisu or Nakameguro')
)
update public.place_facts facts
set itinerary_event_id = event.id
from public.trips trip
join fact_links link on true
join public.itinerary_events event
  on event.trip_id = trip.id and event.title = link.event_title
where trip.slug = 'japan-2026'
  and facts.trip_id = trip.id
  and facts.place = link.place;
