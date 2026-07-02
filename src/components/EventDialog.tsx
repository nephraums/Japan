"use client";

import { useState } from "react";
import { ExternalLink, MapPin, MessageCircle, Save, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { googleMapsSearchUrl, usableMapLink } from "@/lib/maps";
import { itineraryStatusOptions, statusLabels } from "@/lib/trip-utils";
import type { EventComment, FamilyProfile, ItineraryEvent } from "@/lib/types";

export function EventDialog({
  event,
  comments,
  profile,
  demo,
  onClose,
  onUpdated,
  onCommentAdded,
  readOnly = false,
}: {
  event: ItineraryEvent;
  comments: EventComment[];
  profile: FamilyProfile | null;
  demo: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onUpdated: (event: ItineraryEvent) => void;
  onCommentAdded: (comment: EventComment) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [startTime, setStartTime] = useState(event.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(event.end_time.slice(0, 5));
  const [mapUrl, setMapUrl] = useState(event.google_maps_url ?? "");
  const [status, setStatus] = useState(event.status);
  const [travelMode, setTravelMode] = useState(event.travel_mode ?? "");
  const [travelDetails, setTravelDetails] = useState(event.travel_details ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const previewMapUrl = event.category === "flight" ? null : usableMapLink(mapUrl) ?? googleMapsSearchUrl(title, event.city, "Japan");

  async function saveEvent(saveEvent: React.FormEvent) {
    saveEvent.preventDefault();
    setMessage("");
    if (readOnly) return setMessage("Guest view is read-only.");
    if (!title.trim()) return setMessage("Add a title before saving.");
    if (endTime <= startTime) return setMessage("The end time must be after the start time.");
    setSaving(true);

    if (demo) {
      onUpdated({
        ...event,
        title: title.trim(),
        description: description.trim() || null,
        start_time: startTime,
        end_time: endTime,
        google_maps_url: mapUrl.trim() || null,
        status,
        travel_mode: travelMode.trim() || null,
        travel_details: travelDetails.trim() || null,
      });
      setMessage("Changes saved in this preview.");
      setSaving(false);
      return;
    }

    const { data, error } = await createClient().rpc("update_itinerary_event", {
      p_event_id: event.id,
      p_title: title,
      p_description: description,
      p_start_time: startTime,
      p_end_time: endTime,
      p_google_maps_url: mapUrl,
      p_status: status,
      p_travel_mode: travelMode,
      p_travel_details: travelDetails,
    });
    if (error || !data) {
      setMessage(error?.message ?? "Couldn’t save those changes.");
    } else {
      onUpdated(data as ItineraryEvent);
      setMessage("Itinerary updated for everyone.");
    }
    setSaving(false);
  }

  async function addComment(commentEvent: React.FormEvent) {
    commentEvent.preventDefault();
    if (readOnly) return setMessage("Guest view is read-only.");
    const body = commentBody.trim();
    if (!body) return;
    setPosting(true);
    setMessage("");

    if (demo) {
      onCommentAdded({
        id: `demo-comment-${Date.now()}`,
        trip_id: event.trip_id,
        event_id: event.id,
        user_id: profile?.id ?? "demo-user",
        body,
        created_at: new Date().toISOString(),
        author: profile
          ? { display_name: profile.display_name, avatar_emoji: profile.avatar_emoji }
          : { display_name: "Nigel", avatar_emoji: "🗻" },
      });
      setCommentBody("");
      setPosting(false);
      return;
    }

    if (!profile) {
      setMessage("Sign in again before adding a comment.");
      setPosting(false);
      return;
    }
    const { data, error } = await createClient()
      .from("comments")
      .insert({
        trip_id: event.trip_id,
        event_id: event.id,
        suggestion_id: null,
        user_id: profile.id,
        body,
      })
      .select("id, trip_id, event_id, user_id, body, created_at")
      .single();
    if (error || !data) {
      setMessage(error?.message ?? "Couldn’t add that comment.");
    } else {
      onCommentAdded({
        ...(data as Omit<EventComment, "author">),
        author: { display_name: profile.display_name, avatar_emoji: profile.avatar_emoji },
      });
      setCommentBody("");
    }
    setPosting(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1d1a17]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[#f7f1e7] p-5 shadow-2xl sm:rounded-[2rem] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9f2a22]">Edit and discuss</p>
            <h2 id="event-dialog-title" className="font-japanese mt-1 text-2xl font-bold">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full border border-[#ded3c3] bg-white" aria-label="Close event details"><X size={20} /></button>
        </div>

        {event.flight_details && <FlightDetailsPanel details={event.flight_details} />}

        {readOnly && <p className="mt-5 rounded-xl bg-[#efe5d6] p-3 text-sm font-semibold text-[#655e56]">Guest view is read-only, so itinerary edits and comments are hidden.</p>}

        {!readOnly && <form onSubmit={saveEvent} className="mt-6 space-y-4 rounded-2xl border border-[#ded3c3] bg-white/75 p-4 sm:p-5">
          <label className="block text-sm font-bold text-[#514b45]">Activity title
            <input value={title} onChange={(input) => setTitle(input.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-[#514b45]">Start
              <input type="time" value={startTime} onChange={(input) => setStartTime(input.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" required />
            </label>
            <label className="block text-sm font-bold text-[#514b45]">End
              <input type="time" value={endTime} onChange={(input) => setEndTime(input.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" required />
            </label>
          </div>
          <label className="block text-sm font-bold text-[#514b45]">Notes
            <textarea value={description} onChange={(input) => setDescription(input.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="Anything the family should know" />
          </label>
          <label className="block text-sm font-bold text-[#514b45]">Status
            <select value={status} onChange={(input) => setStatus(input.target.value as typeof status)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal">{itineraryStatusOptions.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}</select>
          </label>
          <div className="rounded-xl border border-[#ded3c3] bg-[#f8f4ed] p-3">
            <p className="text-sm font-bold text-[#514b45]">Recommended travel</p>
            <label className="mt-3 block text-xs font-bold text-[#655e56]">Method
              <input value={travelMode} onChange={(input) => setTravelMode(input.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="Train, walk, taxi…" />
            </label>
            <label className="mt-3 block text-xs font-bold text-[#655e56]">Route details
              <textarea value={travelDetails} onChange={(input) => setTravelDetails(input.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="Stations, lines and useful transfer notes" />
            </label>
          </div>
          <label className="block text-sm font-bold text-[#514b45]">Google Maps link
            <input type="url" value={mapUrl} onChange={(input) => setMapUrl(input.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ded3c3] bg-white px-3 font-normal" placeholder="https://www.google.com/maps/…" />
          </label>
          {previewMapUrl && <a href={previewMapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45]"><MapPin size={15} /> Open Google Maps <ExternalLink size={13} /></a>}
          <button disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#26231f] px-5 text-sm font-bold text-white disabled:opacity-60"><Save size={17} />{saving ? "Saving…" : "Save changes"}</button>
        </form>}

        <section className="mt-6" aria-labelledby="comments-heading">
          <div className="flex items-center gap-2"><MessageCircle size={19} className="text-[#9f2a22]" /><h3 id="comments-heading" className="font-japanese text-xl font-bold">Family comments</h3><span className="rounded-full bg-[#efe5d6] px-2 py-0.5 text-xs font-bold">{comments.length}</span></div>
          <div className="mt-3 space-y-3">
            {comments.length ? comments.map((comment) => (
              <article key={comment.id} className="rounded-2xl border border-[#ded3c3] bg-white/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold"><span aria-hidden="true">{comment.author?.avatar_emoji ?? "🎌"}</span>{comment.author?.display_name ?? "Family"}<span className="font-normal text-[#8b8279]">· {new Date(comment.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div>
                <p className="mt-2 text-sm leading-relaxed text-[#514b45]">{comment.body}</p>
              </article>
            )) : <p className="rounded-2xl border border-dashed border-[#c7b6a1] p-4 text-sm text-[#716a62]">No comments yet. Start the family conversation.</p>}
          </div>
          {!readOnly && <form onSubmit={addComment} className="mt-4 flex items-end gap-2">
            <label className="min-w-0 flex-1 text-sm font-bold text-[#514b45]">Add a comment
              <textarea value={commentBody} onChange={(input) => setCommentBody(input.target.value)} rows={2} maxLength={1000} className="mt-2 w-full rounded-xl border border-[#ded3c3] bg-white p-3 font-normal" placeholder="What do you think?" />
            </label>
            <button disabled={posting || !commentBody.trim()} className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#c83b2f] text-white disabled:opacity-40" aria-label="Post comment"><Send size={18} /></button>
          </form>}
        </section>

        {message && <p role="status" className="mt-4 rounded-xl bg-[#efe5d6] p-3 text-sm font-semibold text-[#655e56]">{message}</p>}
      </section>
    </div>
  );
}
