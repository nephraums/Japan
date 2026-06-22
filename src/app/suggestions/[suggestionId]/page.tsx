import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2, ExternalLink, Lightbulb, MapPin, PauseCircle, Pencil, Plus, Save, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getTripData } from "@/lib/data";
import { castVote, decideSuggestion, updateSuggestion } from "@/app/suggestions/actions";

export default async function SuggestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ suggestionId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const data = await getTripData();
  if (!data || (!data.demo && !data.profile)) redirect("/login");
  const { suggestionId } = await params;
  const suggestion = data.suggestions.find((item) => item.id === suggestionId);
  if (!suggestion) notFound();
  const target = data.events.find((event) => event.id === suggestion.target_event_id);
  const canEdit = suggestion.status === "open" && data.profile?.id === suggestion.suggested_by;
  const canDecide = ["open", "parked"].includes(suggestion.status) && data.profile?.role === "parent";
  const defaultDate = suggestion.date ?? target?.date ?? data.trip.start_date;
  const defaultCity = suggestion.city ?? target?.city ?? "";
  const preferredSlot = suggestion.preferred_time?.toLowerCase();
  const defaultStart = target?.start_time.slice(0, 5) ?? (preferredSlot === "afternoon" ? "13:00" : preferredSlot === "evening" ? "18:00" : "09:00");
  const defaultEnd = target?.end_time.slice(0, 5) ?? (preferredSlot === "afternoon" ? "17:00" : preferredSlot === "evening" ? "21:00" : "12:00");
  const message = (await searchParams).message;

  return (
    <AppShell profile={data.profile} demo={data.demo}>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-9">
        <Link href="/suggestions" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ded3c3] bg-white/70 px-4 text-sm font-bold text-[#514b45]"><ArrowLeft size={17} /> Back to ideas</Link>

        <article className="mt-5 rounded-[1.8rem] border border-white/80 bg-white/80 p-5 shadow-[0_16px_45px_rgba(66,51,38,.09)] sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span aria-hidden="true">{suggestion.author?.avatar_emoji ?? "🎌"}</span>
            {suggestion.author?.display_name ?? "Family"}
            <span className="rounded-full bg-[#efe5d6] px-2 py-1 uppercase tracking-wider text-[#655e56]">{suggestion.status}</span>
          </div>
          <div className="mt-5 flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#c83b2f] text-white"><Lightbulb size={21} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9f2a22]">Family idea</p>
              <h1 className="font-japanese mt-1 text-3xl font-bold leading-tight">{suggestion.title}</h1>
            </div>
          </div>
          {suggestion.description && <p className="mt-5 text-sm leading-relaxed text-[#514b45]">{suggestion.description}</p>}

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#716a62]">
            {suggestion.city && <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f0e8] px-3 py-1.5"><MapPin size={13} />{suggestion.city}</span>}
            {suggestion.date && <span className="rounded-full bg-[#f5f0e8] px-3 py-1.5">{format(parseISO(suggestion.date), "EEEE d MMMM")}</span>}
            {suggestion.preferred_time && <span className="rounded-full bg-[#f5f0e8] px-3 py-1.5">{suggestion.preferred_time}</span>}
          </div>

          {target && <section className="mt-5 rounded-2xl border-l-2 border-[#c83b2f] bg-[#faf6ef] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9f2a22]">Related itinerary activity</p><Link href={`/itinerary/event/${target.id}`} className="font-japanese mt-1 block font-bold underline decoration-[#c83b2f]/35 underline-offset-3">{target.title}</Link><p className="mt-1 text-xs text-[#716a62]">{target.date} · {target.city}</p></section>}

          {suggestion.google_maps_url && <a href={suggestion.google_maps_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] px-4 text-xs font-bold">Open Google Maps <ExternalLink size={14} /></a>}

          {canEdit && (
            <details className="group mt-6 rounded-2xl border border-[#ded3c3] bg-[#faf6ef]">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-japanese font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2"><Pencil size={17} className="text-[#9f2a22]" />Edit your idea</span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#9f2a22] group-open:hidden">Open form</span>
              </summary>
              <form action={updateSuggestion} className="grid gap-4 border-t border-[#ded3c3] p-4 sm:grid-cols-2">
                <input type="hidden" name="suggestion_id" value={suggestion.id} />
                <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Idea title
                  <input name="title" defaultValue={suggestion.title} required className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" />
                </label>
                <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Why this would be good
                  <textarea name="description" defaultValue={suggestion.description ?? ""} rows={4} className="mt-2 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" />
                </label>
                <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Replace or relate to
                  <select name="target_event_id" defaultValue={suggestion.target_event_id ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                    <option value="">General idea</option>
                    {data.events.map((event) => <option key={event.id} value={event.id}>{event.date} · {event.title}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold text-[#514b45]">City
                  <select name="city" defaultValue={suggestion.city ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                    <option value="">Any city</option><option>Osaka</option><option>Kyoto</option><option>Tokyo</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-[#514b45]">Preferred date
                  <input name="date" type="date" min={data.trip.start_date} max={data.trip.end_date} defaultValue={suggestion.date ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" />
                </label>
                <label className="text-sm font-bold text-[#514b45]">Preferred time
                  <select name="preferred_time" defaultValue={suggestion.preferred_time ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                    <option value="">Flexible</option><option>Morning</option><option>Afternoon</option><option>Evening</option>
                  </select>
                </label>
                <label className="sm:col-span-2 text-sm font-bold text-[#514b45]">Google Maps link
                  <input name="google_maps_url" type="url" defaultValue={suggestion.google_maps_url ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="https://www.google.com/maps/…" />
                </label>
                <button className="sm:col-span-2 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-[#26231f] px-5 text-sm font-bold text-white"><Save size={17} />Save idea</button>
              </form>
            </details>
          )}

          {canDecide && (
            <section className="mt-6 rounded-2xl border border-[#d8c49f] bg-[#f8ecd3] p-4" aria-labelledby="parent-decision-heading">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b31]">Nigel & Sarah only</p>
              <h2 id="parent-decision-heading" className="font-japanese mt-1 text-xl font-bold">Parent decision</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#65583f]">Accept this into the plan, park it for later, or close it as rejected.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {target && (
                  <form action={decideSuggestion}>
                    <input type="hidden" name="suggestion_id" value={suggestion.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <input type="hidden" name="accept_mode" value="replace" />
                    <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white"><CheckCircle2 size={16} />Accept & replace linked activity</button>
                  </form>
                )}
                <form action={decideSuggestion}>
                  <input type="hidden" name="suggestion_id" value={suggestion.id} />
                  <input type="hidden" name="decision" value="park" />
                  <button className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-bold text-amber-800"><PauseCircle size={16} />Park for later</button>
                </form>
                <form action={decideSuggestion}>
                  <input type="hidden" name="suggestion_id" value={suggestion.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <button className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-bold text-rose-800"><XCircle size={16} />Reject</button>
                </form>
              </div>

              <details className="group mt-3 rounded-xl border border-[#d8c49f] bg-white/55">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><Plus size={16} />Accept as a new activity</span><span className="text-[10px] uppercase tracking-wider text-[#8a6b31] group-open:hidden">Choose slot</span></summary>
                <form action={decideSuggestion} className="grid gap-3 border-t border-[#d8c49f] p-4 sm:grid-cols-2">
                  <input type="hidden" name="suggestion_id" value={suggestion.id} />
                  <input type="hidden" name="decision" value="accept" />
                  <input type="hidden" name="accept_mode" value="add" />
                  <label className="text-xs font-bold text-[#514b45]">Date
                    <input name="date" type="date" min={data.trip.start_date} max={data.trip.end_date} defaultValue={defaultDate} required className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" />
                  </label>
                  <label className="text-xs font-bold text-[#514b45]">City
                    <select name="city" defaultValue={defaultCity} required className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">
                      <option value="" disabled>Choose city</option><option>Osaka</option><option>Kyoto</option><option>Tokyo</option><option>Tokyo → Narita</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-[#514b45]">Start
                    <input name="start_time" type="time" defaultValue={defaultStart} required className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" />
                  </label>
                  <label className="text-xs font-bold text-[#514b45]">End
                    <input name="end_time" type="time" defaultValue={defaultEnd} required className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" />
                  </label>
                  <button className="sm:col-span-2 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white"><CheckCircle2 size={17} />Add to itinerary</button>
                </form>
              </details>
            </section>
          )}

          <div className="mt-6 border-t border-[#ded3c3] pt-5">
            <p className="mb-3 text-sm font-bold text-[#514b45]">What do you think?</p>
            <div className="flex gap-2">
              <form action={castVote}><input type="hidden" name="suggestion_id" value={suggestion.id} /><input type="hidden" name="vote" value="for" /><input type="hidden" name="return_to" value={`/suggestions/${suggestion.id}`} /><button className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-800"><ThumbsUp size={17} />Yes · {suggestion.votes_for}</button></form>
              <form action={castVote}><input type="hidden" name="suggestion_id" value={suggestion.id} /><input type="hidden" name="vote" value="against" /><input type="hidden" name="return_to" value={`/suggestions/${suggestion.id}`} /><button className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-800"><ThumbsDown size={17} />No · {suggestion.votes_against}</button></form>
            </div>
          </div>
        </article>

        {message && <p role="status" className="mt-4 rounded-xl bg-[#efe5d6] p-3 text-sm font-semibold text-[#655e56]">{message}</p>}
      </div>
    </AppShell>
  );
}
