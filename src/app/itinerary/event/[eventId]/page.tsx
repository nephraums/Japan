import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpenText, ExternalLink, MapPin, MessageCircle, Save, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { getTripData } from "@/lib/data";
import { addEventComment, updateEvent } from "@/app/itinerary/event/[eventId]/actions";
import { itineraryMapUrl } from "@/lib/maps";
import { itineraryStatusOptions, statusLabels } from "@/lib/trip-utils";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");
  const { eventId } = await params;
  const event = data.events.find((item) => item.id === eventId);
  if (!event) notFound();
  const comments = data.comments.filter((comment) => comment.event_id === event.id);
  const facts = data.facts.filter((fact) => fact.itinerary_event_id === event.id);
  const mapUrl = itineraryMapUrl(event);
  const message = (await searchParams).message;

  return (
    <AppShell profile={data.profile} demo={data.demo}>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-9">
        <Link href={`/itinerary?date=${event.date}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ded3c3] bg-white/70 px-4 text-sm font-bold text-[#514b45]"><ArrowLeft size={17} /> Back to {event.city}</Link>
        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9f2a22]">Edit and discuss</p>
          <h1 className="font-japanese mt-2 text-3xl font-bold leading-tight">{event.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#716a62]"><MapPin size={15} />{event.city} · {event.date}</p>
          {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c83b2f] px-4 text-xs font-bold text-white"><MapPin size={15} /> Open Google Maps <ExternalLink size={13} /></a>}
        </header>

        {message && <p role="status" className="mt-5 rounded-xl bg-[#efe5d6] p-3 text-sm font-semibold text-[#655e56]">{message}</p>}

        {event.flight_details && <FlightDetailsPanel details={event.flight_details} />}

        <form action={updateEvent} className="mt-6 space-y-4 rounded-[1.6rem] border border-[#ded3c3] bg-white/80 p-5 shadow-[0_12px_35px_rgba(66,51,38,.07)]">
          <input type="hidden" name="event_id" value={event.id} />
          <label className="block text-sm font-bold text-[#514b45]">Activity title
            <input name="title" defaultValue={event.title} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-[#514b45]">Start
              <input name="start_time" type="time" defaultValue={event.start_time.slice(0, 5)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" required />
            </label>
            <label className="block text-sm font-bold text-[#514b45]">End
              <input name="end_time" type="time" defaultValue={event.end_time.slice(0, 5)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" required />
            </label>
          </div>
          <label className="block text-sm font-bold text-[#514b45]">Notes
            <textarea name="description" defaultValue={event.description ?? ""} rows={4} className="mt-2 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="Anything the family should know" />
          </label>
          <label className="block text-sm font-bold text-[#514b45]">Status
            <select name="status" defaultValue={event.status} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">{itineraryStatusOptions.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}</select>
          </label>
          <div className="rounded-xl border border-[#ded3c3] bg-[#f8f4ed] p-3">
            <p className="text-sm font-bold text-[#514b45]">Recommended travel</p>
            <label className="mt-3 block text-xs font-bold text-[#655e56]">Method
              <input name="travel_mode" defaultValue={event.travel_mode ?? ""} className="mt-1 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="Train, walk, taxi…" />
            </label>
            <label className="mt-3 block text-xs font-bold text-[#655e56]">Route details
              <textarea name="travel_details" defaultValue={event.travel_details ?? ""} rows={3} className="mt-1 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="Stations, lines and transfer notes" />
            </label>
          </div>
          <label className="block text-sm font-bold text-[#514b45]">Google Maps link
            <input name="google_maps_url" type="url" defaultValue={event.google_maps_url ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="https://www.google.com/maps/…" />
          </label>
          <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#26231f] px-5 text-sm font-bold text-white"><Save size={17} />Save changes</button>
        </form>

        {facts.length > 0 && <section className="pt-8" aria-labelledby="facts-heading">
          <div className="flex items-center gap-2"><BookOpenText size={20} className="text-[#9f2a22]" /><h2 id="facts-heading" className="font-japanese text-2xl font-bold">Place facts</h2></div>
          <div className="mt-4 space-y-3">
            {facts.map((fact) => <article key={fact.id} className="rounded-2xl border border-[#ded3c3] bg-white/75 p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#9f2a22]">{fact.city}</p><h3 className="font-japanese mt-1 text-lg font-bold">{fact.place}</h3><p className="mt-2 text-sm leading-relaxed text-[#655e56]">{fact.fact}</p></article>)}
          </div>
          <Link href={`/guide?tab=facts&event=${event.id}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45]">Open in Japan guide</Link>
        </section>}

        <section id="comments" className="scroll-mt-5 pt-8" aria-labelledby="comments-heading">
          <div className="flex items-center gap-2"><MessageCircle size={20} className="text-[#9f2a22]" /><h2 id="comments-heading" className="font-japanese text-2xl font-bold">Family comments</h2><span className="rounded-full bg-[#efe5d6] px-2 py-0.5 text-xs font-bold">{comments.length}</span></div>
          <div className="mt-4 space-y-3">
            {comments.length ? comments.map((comment) => (
              <article key={comment.id} className="rounded-2xl border border-[#ded3c3] bg-white/75 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span aria-hidden="true">{comment.author?.avatar_emoji ?? "🎌"}</span>{comment.author?.display_name ?? "Family"}<span className="font-normal text-[#8b8279]">· {new Date(comment.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div>
                <p className="mt-2 text-sm leading-relaxed text-[#514b45]">{comment.body}</p>
              </article>
            )) : <p className="rounded-2xl border border-dashed border-[#c7b6a1] p-4 text-sm text-[#716a62]">No comments yet. Start the family conversation.</p>}
          </div>
          <form action={addEventComment} className="mt-4 rounded-2xl border border-[#ded3c3] bg-white/75 p-4">
            <input type="hidden" name="event_id" value={event.id} />
            <input type="hidden" name="trip_id" value={event.trip_id} />
            <label className="block text-sm font-bold text-[#514b45]">Add a comment
              <textarea name="body" rows={3} maxLength={1000} required className="mt-2 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="What do you think?" />
            </label>
            <button className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#c83b2f] px-5 text-sm font-bold text-white"><Send size={17} />Post comment</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
