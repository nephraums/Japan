import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowRight, ExternalLink, Lightbulb, MapPin, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getTripData } from "@/lib/data";
import { castVote, createSuggestion } from "@/app/suggestions/actions";

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");
  const message = (await searchParams).message;
  const suggestions = [...data.suggestions].sort((a, b) => {
    if (a.status === "open" && b.status !== "open") return -1;
    if (a.status !== "open" && b.status === "open") return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <AppShell profile={data.profile} demo={data.demo}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
        <header>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#9f2a22]"><Lightbulb size={16} /> Family ideas</p>
          <h1 className="font-japanese mt-2 text-3xl font-bold tracking-tight sm:text-5xl">What should we do?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#716a62]">Suggest a new stop, meal or swap. Everyone gets one vote each way—and changing your mind simply updates your vote.</p>
        </header>

        {message && <p role="status" className="mt-5 rounded-xl bg-[#efe5d6] p-3 text-sm font-semibold text-[#655e56]">{message}</p>}

        <details className="group mt-6 rounded-[1.6rem] border border-[#ded3c3] bg-white/75 shadow-[0_12px_35px_rgba(66,51,38,.06)]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-5 font-japanese text-lg font-bold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#c83b2f] text-white"><Plus size={20} /></span>Add an idea</span>
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#9f2a22] group-open:hidden">Open form</span>
          </summary>
          <form action={createSuggestion} className="grid gap-4 border-t border-[#ded3c3] p-5 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Idea title
              <input name="title" required className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="e.g. Visit the Pokémon Café" />
            </label>
            <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Why this would be good
              <textarea name="description" rows={3} className="mt-2 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="Give the family the pitch" />
            </label>
            <label className="text-sm font-bold text-[#514b45]">Replace or relate to
              <select name="target_event_id" className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                <option value="">General idea</option>
                {data.events.map((event) => <option key={event.id} value={event.id}>{event.date} · {event.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-[#514b45]">City
              <select name="city" className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                <option value="">Any city</option><option>Osaka</option><option>Kyoto</option><option>Tokyo</option>
              </select>
            </label>
            <label className="text-sm font-bold text-[#514b45]">Preferred date
              <input name="date" type="date" min={data.trip.start_date} max={data.trip.end_date} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" />
            </label>
            <label className="text-sm font-bold text-[#514b45]">Preferred time
              <select name="preferred_time" className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                <option value="">Flexible</option><option>Morning</option><option>Afternoon</option><option>Evening</option>
              </select>
            </label>
            <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Google Maps link
              <input name="google_maps_url" type="url" className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="https://www.google.com/maps/…" />
            </label>
            <button className="sm:col-span-2 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-[#c83b2f] px-5 text-sm font-bold text-white"><Plus size={17} />Share idea</button>
          </form>
        </details>

        <section className="mt-8" aria-labelledby="ideas-heading">
          <div className="mb-4 flex items-end justify-between"><h2 id="ideas-heading" className="font-japanese text-2xl font-bold">Family shortlist</h2><span className="text-xs font-bold text-[#716a62]">{suggestions.length} idea{suggestions.length === 1 ? "" : "s"}</span></div>
          {suggestions.length ? <div className="space-y-4">{suggestions.map((suggestion) => {
            const target = data.events.find((event) => event.id === suggestion.target_event_id);
            return (
              <article key={suggestion.id} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_35px_rgba(66,51,38,.07)]">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span aria-hidden="true">{suggestion.author?.avatar_emoji ?? "🎌"}</span>{suggestion.author?.display_name ?? "Family"}<span className="rounded-full bg-[#efe5d6] px-2 py-1 uppercase tracking-wider text-[#655e56]">{suggestion.status}</span></div>
                <h3 className="font-japanese mt-3 text-xl font-bold"><Link href={`/suggestions/${suggestion.id}`} className="decoration-[#c83b2f]/40 underline-offset-4 hover:underline">{suggestion.title}</Link></h3>
                {suggestion.description && <p className="mt-2 text-sm leading-relaxed text-[#655e56]">{suggestion.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#716a62]">
                  {suggestion.city && <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f0e8] px-3 py-1.5"><MapPin size={13} />{suggestion.city}</span>}
                  {suggestion.date && <span className="rounded-full bg-[#f5f0e8] px-3 py-1.5">{format(parseISO(suggestion.date), "EEE d MMM")}</span>}
                  {suggestion.preferred_time && <span className="rounded-full bg-[#f5f0e8] px-3 py-1.5">{suggestion.preferred_time}</span>}
                </div>
                {target && <p className="mt-3 rounded-xl border-l-2 border-[#c83b2f] bg-[#faf6ef] p-3 text-xs text-[#655e56]"><strong>Related plan:</strong> <Link href={`/itinerary/event/${target.id}`} className="underline decoration-[#c83b2f]/40 underline-offset-2">{target.title}</Link></p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <form action={`/suggestions/${suggestion.id}`} method="get">
                    <button type="submit" className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl bg-[#26231f] px-4 text-xs font-bold text-white">Open idea <ArrowRight size={14} /></button>
                  </form>
                  <form action={castVote}><input type="hidden" name="suggestion_id" value={suggestion.id} /><input type="hidden" name="vote" value="for" /><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-800"><ThumbsUp size={15} />Yes · {suggestion.votes_for}</button></form>
                  <form action={castVote}><input type="hidden" name="suggestion_id" value={suggestion.id} /><input type="hidden" name="vote" value="against" /><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-800"><ThumbsDown size={15} />No · {suggestion.votes_against}</button></form>
                  {suggestion.google_maps_url && <a href={suggestion.google_maps_url} target="_blank" rel="noreferrer" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] px-3 text-xs font-bold">Map <ExternalLink size={13} /></a>}
                </div>
              </article>
            );
          })}</div> : <div className="rounded-[1.6rem] border border-dashed border-[#c7b6a1] p-8 text-center"><Lightbulb className="mx-auto text-[#c83b2f]" /><p className="font-japanese mt-3 text-lg font-bold">No ideas yet</p><p className="mt-1 text-sm text-[#716a62]">Someone has to go first. Your pitch awaits.</p></div>}
        </section>
      </div>
    </AppShell>
  );
}
