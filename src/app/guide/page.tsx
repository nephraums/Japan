import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenText, Landmark, Languages, MapPin, Search, SignpostBig } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getTripData } from "@/lib/data";

type GuideTab = "phrases" | "signs" | "facts";

const tabs: { id: GuideTab; label: string; icon: typeof Languages }[] = [
  { id: "phrases", label: "Phrases", icon: Languages },
  { id: "signs", label: "Signs", icon: SignpostBig },
  { id: "facts", label: "Place facts", icon: Landmark },
];

function matches(query: string, values: (string | null | undefined)[]) {
  if (!query) return true;
  return values.some((value) => value?.toLocaleLowerCase().includes(query));
}

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; category?: string; city?: string; event?: string }>;
}) {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");
  const params = await searchParams;
  const tab: GuideTab = tabs.some((item) => item.id === params.tab) ? params.tab as GuideTab : "phrases";
  const rawQuery = params.q?.trim() ?? "";
  const query = rawQuery.toLocaleLowerCase();
  const category = params.category ?? "all";
  const city = params.city ?? "all";
  const eventId = params.event;
  const categories = [...new Set(data.phrases.map((phrase) => phrase.category))].sort();
  const cities = [...new Set(data.facts.map((fact) => fact.city).filter((value): value is string => Boolean(value)))].sort();
  const phrases = data.phrases.filter((phrase) =>
    (category === "all" || phrase.category === category) &&
    matches(query, [phrase.english, phrase.japanese, phrase.romaji, phrase.note, phrase.category]),
  );
  const signs = data.signs.filter((sign) => matches(query, [sign.symbol, sign.romaji, sign.meaning, sign.where_seen]));
  const facts = data.facts.filter((fact) =>
    (city === "all" || fact.city === city) &&
    (!eventId || fact.itinerary_event_id === eventId) &&
    matches(query, [fact.place, fact.city, fact.fact]),
  );
  const resultCount = tab === "phrases" ? phrases.length : tab === "signs" ? signs.length : facts.length;

  return (
    <AppShell profile={data.profile} demo={data.demo}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
        <header>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#9f2a22]"><BookOpenText size={16} /> Pocket Japan guide</p>
          <h1 className="font-japanese mt-2 text-3xl font-bold tracking-tight sm:text-5xl">A little help, right when you need it.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#716a62]">Useful words, signs you’ll actually see, and snack-sized facts about the places on our route.</p>
        </header>

        <nav className="mt-6 grid grid-cols-3 gap-2 rounded-[1.4rem] border border-[#ded3c3] bg-white/60 p-1.5" aria-label="Japan guide sections">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = item.id === tab;
            return <Link key={item.id} href={`/guide?tab=${item.id}`} aria-current={active ? "page" : undefined} className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-xs font-bold transition sm:flex-row sm:text-sm ${active ? "bg-[#263c44] text-white shadow-sm" : "text-[#655e56] hover:bg-white"}`}><Icon size={18} />{item.label}</Link>;
          })}
        </nav>

        <form action="/guide" method="get" className="mt-5 grid gap-3 rounded-2xl border border-[#ded3c3] bg-white/70 p-3 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="tab" value={tab} />
          {eventId && <input type="hidden" name="event" value={eventId} />}
          <label className="relative block">
            <span className="sr-only">Search the Japan guide</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8279]" size={18} />
            <input name="q" defaultValue={rawQuery} className="min-h-13 w-full rounded-xl border border-[#ded3c3] bg-white pl-11 pr-4 text-sm" placeholder={tab === "phrases" ? "Search English, Japanese or romaji" : tab === "signs" ? "Search a sign or meaning" : "Search a place or city"} />
          </label>
          {tab === "phrases" && <select name="category" defaultValue={category} aria-label="Phrase category" className="min-h-13 rounded-xl border border-[#ded3c3] bg-white px-4 text-sm font-semibold"><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>}
          {tab === "facts" && <select name="city" defaultValue={city} aria-label="Filter facts by city" className="min-h-13 rounded-xl border border-[#ded3c3] bg-white px-4 text-sm font-semibold"><option value="all">All cities</option>{cities.map((item) => <option key={item}>{item}</option>)}</select>}
          <button className="min-h-12 rounded-xl bg-[#c83b2f] px-5 text-sm font-bold text-white sm:col-span-2 sm:justify-self-end">Search guide</button>
        </form>

        <div className="mb-4 mt-7 flex items-end justify-between gap-3">
          <h2 className="font-japanese text-2xl font-bold">{tabs.find((item) => item.id === tab)?.label}</h2>
          <span className="text-xs font-bold text-[#716a62]">{resultCount} result{resultCount === 1 ? "" : "s"}</span>
        </div>

        {tab === "phrases" && (phrases.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {phrases.map((phrase) => (
              <article key={phrase.id} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_35px_rgba(66,51,38,.06)]">
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#efe5d6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#655e56]">{phrase.category}</span><span className="text-xs font-bold text-[#9f2a22]">{phrase.english}</span></div>
                <p className="font-japanese mt-5 text-3xl font-bold leading-tight text-[#22201d]">{phrase.japanese}</p>
                {phrase.romaji && <p className="mt-2 text-sm font-bold text-[#c83b2f]">{phrase.romaji}</p>}
                {phrase.note && <p className="mt-3 border-t border-[#ded3c3] pt-3 text-xs leading-relaxed text-[#716a62]">{phrase.note}</p>}
              </article>
            ))}
          </div>
        ) : <EmptyGuideResult />)}

        {tab === "signs" && (signs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((sign) => (
              <article key={sign.id} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 text-center shadow-[0_12px_35px_rgba(66,51,38,.06)]">
                <p className="font-japanese text-4xl font-bold text-[#c83b2f]">{sign.symbol}</p>
                {sign.romaji && <p className="mt-2 text-sm font-bold text-[#9f2a22]">{sign.romaji}</p>}
                <h3 className="font-japanese mt-4 text-lg font-bold">{sign.meaning}</h3>
                {sign.where_seen && <p className="mt-2 text-xs leading-relaxed text-[#716a62]">Usually seen: {sign.where_seen}</p>}
              </article>
            ))}
          </div>
        ) : <EmptyGuideResult />)}

        {tab === "facts" && (facts.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {facts.map((fact) => (
              <article key={fact.id} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_35px_rgba(66,51,38,.06)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9f2a22]"><MapPin size={14} />{fact.city ?? "Japan"}</div>
                <h3 className="font-japanese mt-3 text-xl font-bold">{fact.place}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#655e56]">{fact.fact}</p>
                {fact.tip && <div className="mt-4 rounded-xl bg-[#f8f4ed] p-3 text-xs leading-relaxed text-[#655e56]"><strong className="text-[#9f2a22]">Traveller tip:</strong> {fact.tip}</div>}
                {fact.itinerary_event_id && <Link href={`/itinerary/event/${fact.itinerary_event_id}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45]">View itinerary activity <ArrowRight size={15} /></Link>}
              </article>
            ))}
          </div>
        ) : <EmptyGuideResult />)}
      </div>
    </AppShell>
  );
}

function EmptyGuideResult() {
  return <div className="rounded-[1.6rem] border border-dashed border-[#c7b6a1] p-8 text-center"><Search className="mx-auto text-[#c83b2f]" /><p className="font-japanese mt-3 text-lg font-bold">Nothing matched</p><p className="mt-1 text-sm text-[#716a62]">Try a shorter or different search.</p></div>;
}
