import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarRange, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DayTabs } from "@/components/DayTabs";
import { SortableTimeline } from "@/components/SortableTimeline";
import { getTripData } from "@/lib/data";
import { nearestTripDate } from "@/lib/trip-utils";

export default async function ItineraryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");

  const dates = [...new Set(data.events.map((event) => event.date))];
  const requestedDate = (await searchParams).date;
  const fallbackDate = nearestTripDate(new Date(), data.trip.start_date, data.trip.end_date);
  const selectedDate = requestedDate && dates.includes(requestedDate) ? requestedDate : fallbackDate;
  const events = data.events.filter((event) => event.date === selectedDate);
  const city = events[0]?.city ?? "Japan";

  return (
    <AppShell profile={data.profile} demo={data.demo}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
        <header className="mb-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#9f2a22]"><CalendarRange size={16} /> The family plan</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-japanese text-3xl font-bold tracking-tight sm:text-5xl">Itinerary by day</h1>
              <p className="mt-2 text-sm text-[#716a62]">Move a card to change the running order. The day’s time slots move with it.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#263c44] px-4 py-2 text-xs font-bold text-white"><MapPin size={14} />{city}</span>
          </div>
        </header>

        <DayTabs dates={dates} selected={selectedDate} />

        <section className="mt-6" aria-labelledby="selected-day-heading">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9f2a22]">Day {dates.indexOf(selectedDate) + 1} of {dates.length}</p>
            <h2 id="selected-day-heading" className="font-japanese mt-1 text-2xl font-bold sm:text-3xl">{format(parseISO(selectedDate), "EEEE d MMMM")} · {city}</h2>
          </div>
          <SortableTimeline
            key={selectedDate}
            initialEvents={events}
            initialComments={data.comments.filter((comment) => comment.event_id && events.some((event) => event.id === comment.event_id))}
            facts={data.facts.filter((fact) => fact.itinerary_event_id && events.some((event) => event.id === fact.itinerary_event_id))}
            profile={data.profile}
            demo={data.demo}
            readOnly={data.profile?.role === "guest"}
          />
        </section>
      </div>
    </AppShell>
  );
}
