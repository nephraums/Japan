import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Map,
  Plane,
  Route,
  Sparkles,
  AlertTriangle,
  BedDouble,
  ExternalLink,
  MapPin,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { getTripData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { countdownCopy, nearestTripDate, statusLabels } from "@/lib/trip-utils";

const menuItems = [
  { title: "Itinerary", copy: "All nine days, ready to rearrange", icon: CalendarDays, href: "/itinerary", live: true },
  { title: "Japanese phrases", copy: "Phrases, signs and place facts", icon: BookOpenText, href: "/guide", live: true },
  { title: "Maps", copy: "Places and one-tap directions", icon: Map, href: "/maps", live: true },
  { title: "Ideas", copy: "Family suggestions and votes", icon: Lightbulb, href: "/suggestions", live: true },
];

export default async function HomePage() {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");

  const relevantDate = nearestTripDate(new Date(), data.trip.start_date, data.trip.end_date);
  const dayEvents = data.events.filter((event) => event.date === relevantDate);
  const dates = [...new Set(data.events.map((event) => event.date))];
  const dayNumber = dates.indexOf(relevantDate) + 1;
  const flights = data.events.filter((event) => event.category === "flight");
  const phrase = data.phrases.find((item) => item.english === "Thank you") ?? data.phrases[0];
  const configured = isSupabaseConfigured();
  const planningGaps = data.events.filter((event) => event.planning_note && (event.status === "decision_needed" || event.status === "to_book"));
  const confirmedStays = data.accommodations.filter((stay) => stay.actual_accommodation);

  return (
    <AppShell profile={data.profile} demo={!configured}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#d8c8b5] bg-[#fffaf2] px-5 py-7 shadow-[0_24px_60px_rgba(83,61,42,.13)] sm:px-9 sm:py-10">
          <Image src="/japan-sun.svg" alt="" width={600} height={420} priority className="pointer-events-none absolute -bottom-20 -right-24 w-[31rem] max-w-none opacity-90 sm:-bottom-24 sm:-right-8 sm:w-[38rem]" aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#c83b2f]" aria-hidden="true" />
          <p className="font-japanese absolute right-5 top-5 hidden text-sm font-bold tracking-[.4em] text-[#9f2a22]/60 [writing-mode:vertical-rl] sm:block" aria-hidden="true">日本の旅</p>
          <div className="relative max-w-3xl pr-8 sm:pr-44">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#9f2a22]">{countdownCopy(new Date(), data.trip.start_date, data.trip.end_date)}</p>
            <h1 className="font-japanese mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Japan, here we come.</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#5f574f] sm:text-base">Nine days of neon streets, temple paths, good food and a slightly heroic amount of train travel.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-[#ded3c3] bg-white/80 px-3 py-2">Osaka</span>
              <span className="self-center text-[#9f2a22]/60">→</span>
              <span className="rounded-full border border-[#ded3c3] bg-white/80 px-3 py-2">Kyoto</span>
              <span className="self-center text-[#9f2a22]/60">→</span>
              <span className="rounded-full border border-[#ded3c3] bg-white/80 px-3 py-2">Tokyo</span>
            </div>
          </div>
        </section>

        <section className="mt-7">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#9f2a22]">Nearest trip day</p>
                <h2 className="font-japanese mt-1 text-2xl font-bold sm:text-3xl">Day {dayNumber} · {dayEvents[0]?.city}</h2>
                <p className="mt-1 text-sm text-[#716a62]">{format(parseISO(relevantDate), "EEEE d MMMM")}</p>
              </div>
              <Link href={`/itinerary?date=${relevantDate}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[#26231f] px-4 text-xs font-bold text-white transition hover:bg-[#c83b2f]">Full day <ArrowRight size={15} /></Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {dayEvents.map((event) => (
                <div key={event.id} className="flex gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_28px_rgba(66,51,38,.06)]">
                  <div className="w-11 shrink-0 pt-0.5 text-right">
                    <p className="text-xs font-bold">{event.start_time.slice(0, 5)}</p>
                    <p className="text-[10px] text-[#8b8279]">{event.end_time.slice(0, 5)}</p>
                  </div>
                  <div className="min-w-0 border-l border-[#ded3c3] pl-4">
                    <p className="font-japanese font-bold leading-snug">{event.title}</p>
                    <span className="mt-2 inline-block rounded-full bg-[#efe5d6] px-2 py-1 text-[10px] font-bold text-[#655e56]">{statusLabels[event.status]}</span>
                  </div>
                </div>
              ))}
            </div>
        </section>

        <section className="mt-7 grid items-stretch gap-5 lg:grid-cols-[1.45fr_.55fr]">
          <div>
            <div className="mb-3 flex items-center gap-2"><Sparkles size={18} className="text-[#c83b2f]" /><h2 className="font-japanese text-xl font-bold">Trip menu</h2></div>
            <div className="grid h-[calc(100%-2rem)] grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const content = <><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#efe5d6] text-[#9f2a22]"><Icon size={20} /></span><span className="min-w-0"><span className="block font-japanese text-base font-bold">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#716a62]">{item.copy}</span><span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${item.live ? "text-[#9f2a22]" : "text-[#8b8279]"}`}>{item.live ? <>Open <ArrowRight size={12} /></> : <>Coming next <CheckCircle2 size={12} /></>}</span></span></>;
                return item.live ? <Link key={item.title} href={item.href ?? "/"} className="flex min-h-32 flex-col gap-3 rounded-[1.3rem] border border-[#ded3c3] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-[#c7b6a1] hover:shadow-lg sm:min-h-28 sm:flex-row">{content}</Link> : <div key={item.title} className="flex min-h-32 flex-col gap-3 rounded-[1.3rem] border border-[#ded3c3] bg-white/45 p-4 sm:min-h-28 sm:flex-row">{content}</div>;
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2"><BookOpenText size={18} className="text-[#c83b2f]" /><h2 className="font-japanese text-xl font-bold">Phrase to know</h2></div>
            <Link href="/guide" className="group relative flex min-h-56 h-[calc(100%-2rem)] flex-col overflow-hidden rounded-[1.7rem] border border-[#d8c8b5] bg-[#fffdf8] p-5 shadow-[0_16px_38px_rgba(83,61,42,.09)] transition hover:-translate-y-0.5 hover:shadow-lg lg:min-h-64">
              <div className="absolute inset-x-0 top-0 h-2 bg-[#c83b2f]" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-dashed border-[#d8c8b5] pb-3 pt-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#9f2a22]"><span>Japanese</span><span>日本語</span></div>
              {phrase && <div className="flex flex-1 flex-col justify-center py-5 text-center">
                <p className="font-japanese text-4xl font-bold leading-tight text-[#26231f]">{phrase.japanese}</p>
                <p className="mt-3 text-sm font-bold text-[#9f2a22]">{phrase.romaji}</p>
                <p className="mt-2 text-sm text-[#5f574f]">{phrase.english}</p>
                {phrase.note && <p className="mt-1 text-xs text-[#8b8279]">{phrase.note}</p>}
              </div>}
              <span className="inline-flex items-center justify-center gap-1 border-t border-dashed border-[#d8c8b5] pt-3 text-xs font-bold text-[#9f2a22]">Open phrasebook <ArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span>
            </Link>
          </div>
        </section>

        <section className="mt-7 grid items-start gap-5 lg:grid-cols-[.72fr_1.28fr]">
            <div className="rounded-[1.7rem] border border-[#ded3c3] bg-white/75 p-5">
              <div className="flex items-center gap-2"><Plane size={19} className="text-[#9f2a22]" /><h2 className="font-japanese text-lg font-bold">Flights at a glance</h2></div>
              <div className="mt-4 space-y-4">
                {flights.map((flight) => (
                  <div key={flight.id} className="flex items-start gap-3 border-l-2 border-[#c83b2f] pl-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#9f2a22]">{format(parseISO(flight.date), "EEE d MMM")}</p>
                      <p className="mt-1 text-sm font-bold leading-snug">{flight.title}</p>
                      {flight.flight_details ? <FlightDetailsPanel details={flight.flight_details} compact /> : <p className="mt-1 flex items-center gap-1 text-xs text-[#716a62]"><Clock3 size={12} /> Planned block {flight.start_time.slice(0, 5)}–{flight.end_time.slice(0, 5)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {confirmedStays.length > 0 && <div className="rounded-[1.7rem] border border-[#ded3c3] bg-white/75 p-5">
              <div className="flex items-center gap-2"><BedDouble size={19} className="text-[#9f2a22]" /><h2 className="font-japanese text-lg font-bold">Confirmed stays</h2></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {confirmedStays.map((stay) => <article key={stay.id} className="flex flex-col rounded-2xl bg-[#f8f4ed] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9f2a22]">{stay.city} · {stay.dates}</p>
                  <h3 className="mt-1 text-sm font-bold leading-snug">{stay.actual_accommodation}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#655e56]">{stay.room_type}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#655e56]"><p><strong>Check-in</strong><br />{stay.check_in_window ?? stay.scheduled_arrival_time}</p><p><strong>Total</strong><br />{stay.total_amount_jpy ? `¥${stay.total_amount_jpy.toLocaleString("en-US")}` : "—"}</p></div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">{stay.booking_link && <a href={stay.booking_link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c83b2f] px-3 text-xs font-bold text-white"><MapPin size={14} /> Map <ExternalLink size={12} /></a>}{stay.telephone && <a href={`tel:${stay.telephone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold"><Phone size={14} /> Call</a>}</div>
                </article>)}
              </div>
            </div>}
        </section>

        <section className="mt-7 flex items-center gap-3 rounded-2xl border border-[#ded3c3] bg-[#efe5d6]/55 p-4 text-xs leading-relaxed text-[#655e56]">
          <Route size={20} className="shrink-0 text-[#9f2a22]" />
          <p><strong>Trip dates:</strong> 4–12 July 2026 · Sydney → Osaka → Kyoto → Tokyo → Narita → Sydney</p>
        </section>

        {planningGaps.length > 0 && <section className="mt-7 rounded-[1.7rem] border border-amber-200 bg-amber-50/75 p-5 sm:p-6" aria-labelledby="planning-gaps-heading">
          <div className="flex items-center gap-2 text-amber-900"><AlertTriangle size={20} /><h2 id="planning-gaps-heading" className="font-japanese text-xl font-bold">Planning gaps to resolve</h2><span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold">{planningGaps.length}</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {planningGaps.map((event) => <Link key={event.id} href={`/itinerary/event/${event.id}`} className="rounded-xl border border-amber-200 bg-white/70 p-4 transition hover:bg-white"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">{format(parseISO(event.date), "EEE d MMM")} · {event.city}</p><h3 className="mt-1 text-sm font-bold">{event.title}</h3><p className="mt-2 text-xs leading-relaxed text-[#655e56]">{event.planning_note}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9f2a22]">Review activity <ArrowRight size={13} /></span></Link>)}
          </div>
        </section>}
      </div>
    </AppShell>
  );
}
