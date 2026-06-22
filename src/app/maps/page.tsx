import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowRight, BookOpenText, ExternalLink, Map, MapPin, Search, Utensils } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getTripData } from "@/lib/data";
import { googleMapsSearchUrl, usableMapLink } from "@/lib/maps";

type MapView = "places" | "food";

function matches(query: string, values: (string | null | undefined)[]) {
  if (!query) return true;
  return values.some((value) => value?.toLocaleLowerCase().includes(query));
}

export default async function MapsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; view?: string; q?: string }>;
}) {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");

  const params = await searchParams;
  const view: MapView = params.view === "food" ? "food" : "places";
  const city = params.city ?? "all";
  const rawQuery = params.q?.trim() ?? "";
  const query = rawQuery.toLocaleLowerCase();
  const cities = [...new Set([...data.events.map((event) => event.city), ...data.restaurants.map((restaurant) => restaurant.city)])].sort();
  const places = data.events.filter((event) =>
    event.category !== "flight" &&
    (city === "all" || event.city === city) &&
    matches(query, [event.title, event.location_name, event.city, event.description, event.food_ideas]),
  );
  const restaurants = data.restaurants.filter((restaurant) =>
    (city === "all" || restaurant.city === city) &&
    matches(query, [restaurant.idea, restaurant.area, restaurant.type, restaurant.city, restaurant.notes]),
  );
  const resultCount = view === "places" ? places.length : restaurants.length;

  return (
    <AppShell profile={data.profile} demo={data.demo}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
        <header>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#9f2a22]"><Map size={16} /> Maps hub</p>
          <h1 className="font-japanese mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Every stop, ready to open.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#716a62]">Tap a map button to search that place in Google Maps. If the app is installed, your phone will usually hand the link over to it.</p>
        </header>

        <nav className="mt-6 grid grid-cols-2 gap-2 rounded-[1.4rem] border border-[#ded3c3] bg-white/60 p-1.5" aria-label="Map collections">
          <Link href={{ pathname: "/maps", query: { view: "places", city } }} aria-current={view === "places" ? "page" : undefined} className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${view === "places" ? "bg-[#263c44] text-white shadow-sm" : "text-[#655e56] hover:bg-white"}`}><MapPin size={18} /> Itinerary places</Link>
          <Link href={{ pathname: "/maps", query: { view: "food", city } }} aria-current={view === "food" ? "page" : undefined} className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${view === "food" ? "bg-[#263c44] text-white shadow-sm" : "text-[#655e56] hover:bg-white"}`}><Utensils size={18} /> Food ideas</Link>
        </nav>

        <form action="/maps" method="get" className="mt-5 grid gap-3 rounded-2xl border border-[#ded3c3] bg-white/70 p-3 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="view" value={view} />
          <label className="relative block">
            <span className="sr-only">Search maps</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8279]" size={18} />
            <input name="q" defaultValue={rawQuery} className="min-h-13 w-full rounded-xl border border-[#ded3c3] bg-white pl-11 pr-4 text-sm" placeholder={view === "places" ? "Search places or activities" : "Search food, areas or meal types"} />
          </label>
          <select name="city" defaultValue={city} aria-label="Filter maps by city" className="min-h-13 rounded-xl border border-[#ded3c3] bg-white px-4 text-sm font-semibold"><option value="all">All cities</option>{cities.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="min-h-12 rounded-xl bg-[#c83b2f] px-5 text-sm font-bold text-white sm:col-span-2 sm:justify-self-end">Show places</button>
        </form>

        <div className="mb-4 mt-7 flex items-end justify-between gap-3">
          <h2 className="font-japanese text-2xl font-bold">{view === "places" ? "Itinerary places" : "Food and restaurant ideas"}</h2>
          <span className="text-xs font-bold text-[#716a62]">{resultCount} result{resultCount === 1 ? "" : "s"}</span>
        </div>

        {view === "places" && <div className="grid gap-4 md:grid-cols-2">
          {places.map((event) => {
            const relatedFacts = data.facts.filter((fact) => fact.itinerary_event_id === event.id);
            const mapUrl = googleMapsSearchUrl(event.location_name ?? event.title, event.city, "Japan");
            return <article key={event.id} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_35px_rgba(66,51,38,.06)]">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-[#efe5d6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#655e56]">{event.city}</span><span className="text-xs font-semibold text-[#8b8279]">{format(parseISO(event.date), "EEE d MMM")}</span></div>
              <h3 className="font-japanese mt-3 text-lg font-bold leading-snug">{event.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c83b2f] px-3 text-xs font-bold text-white"><MapPin size={15} /> Open Google Maps <ExternalLink size={13} /></a>
                <Link href={`/itinerary/event/${event.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45]">Itinerary <ArrowRight size={14} /></Link>
                {relatedFacts.length > 0 && <Link href={`/guide?tab=facts&event=${event.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45]"><BookOpenText size={14} /> {relatedFacts.length} fact{relatedFacts.length === 1 ? "" : "s"}</Link>}
              </div>
            </article>;
          })}
        </div>}

        {view === "food" && <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant) => {
            const mapUrl = usableMapLink(restaurant.link) ?? googleMapsSearchUrl(restaurant.idea, restaurant.area, restaurant.city, "Japan");
            return <article key={restaurant.id} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_35px_rgba(66,51,38,.06)]">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#efe5d6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#655e56]">{restaurant.city}</span>{restaurant.area && <span className="text-xs font-bold text-[#9f2a22]">{restaurant.area}</span>}</div>
              <h3 className="font-japanese mt-3 text-xl font-bold">{restaurant.idea}</h3>
              <p className="mt-1 text-xs font-semibold text-[#716a62]">{restaurant.type}{restaurant.booking_needed ? ` · Booking: ${restaurant.booking_needed}` : ""}</p>
              {restaurant.notes && <p className="mt-3 text-sm leading-relaxed text-[#655e56]">{restaurant.notes}</p>}
              <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c83b2f] px-3 text-xs font-bold text-white"><MapPin size={15} /> Find in Google Maps <ExternalLink size={13} /></a>
            </article>;
          })}
        </div>}

        {resultCount === 0 && <div className="rounded-[1.6rem] border border-dashed border-[#c7b6a1] p-8 text-center"><Search className="mx-auto text-[#c83b2f]" /><p className="font-japanese mt-3 text-lg font-bold">Nothing matched</p><p className="mt-1 text-sm text-[#716a62]">Try another city or a shorter search.</p></div>}
      </div>
    </AppShell>
  );
}
