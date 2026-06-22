"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock3,
  ExternalLink,
  GripVertical,
  MapPin,
  MessageCircle,
  BookOpenText,
  Pencil,
  Route,
  Sparkles,
  Utensils,
  Navigation,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { EventDialog } from "@/components/EventDialog";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { itineraryMapUrl } from "@/lib/maps";
import { reassignTimeSlots, statusLabels } from "@/lib/trip-utils";
import type { EventComment, FamilyProfile, ItineraryEvent, PlaceFact } from "@/lib/types";

const categoryMarks: Record<ItineraryEvent["category"], string> = {
  flight: "✈",
  hotel: "宿",
  transport: "線",
  activity: "遊",
  food: "食",
  shopping: "買",
  free_time: "休",
};

function displayTime(value: string) {
  return value.slice(0, 5);
}

function EventCard({ event, index, commentCount, factCount, onOpen }: { event: ItineraryEvent; index: number; commentCount: number; factCount: number; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const mapUrl = itineraryMapUrl(event);
  const firstFlight = event.flight_details?.segments[0];
  const finalFlight = event.flight_details?.segments.at(-1);
  const shownStartTime = firstFlight?.departure_time ?? displayTime(event.start_time);
  const shownEndTime = finalFlight?.arrival_time ?? displayTime(event.end_time);
  const arrivesNextDay = Boolean(firstFlight && finalFlight && finalFlight.arrival_date !== firstFlight.date);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "relative grid grid-cols-[56px_1fr] gap-3 sm:grid-cols-[82px_1fr] sm:gap-5",
        isDragging && "z-30 opacity-80",
      )}
    >
      <div className="relative pt-5 text-right">
        <p className="text-xs font-bold text-[#514b45] sm:text-sm">{shownStartTime}</p>
        <p className="mt-0.5 text-[10px] text-[#8b8279] sm:text-xs">{shownEndTime}{arrivesNextDay ? " +1d" : ""}</p>
        {index >= 0 && <span className="absolute -right-[19px] top-6 size-3 rounded-full border-[3px] border-[#f7f1e7] bg-[#c83b2f] sm:-right-[29px]" aria-hidden="true" />}
      </div>

      <div className={clsx("rounded-[1.6rem] border border-white/80 bg-white/85 p-4 shadow-[0_12px_35px_rgba(66,51,38,.08)] transition sm:p-5", isDragging && "shadow-[0_20px_55px_rgba(66,51,38,.2)]")}>
        <div className="flex items-start gap-3">
          <span className="font-japanese grid size-10 shrink-0 place-items-center rounded-xl bg-[#efe5d6] font-bold text-[#9f2a22]" aria-hidden="true">{categoryMarks[event.category]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={clsx("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", event.status === "decision_needed" ? "bg-amber-100 text-amber-800" : event.status === "to_book" ? "bg-rose-100 text-rose-700" : "bg-stone-100 text-stone-600")}>{statusLabels[event.status]}</span>
              <span className="text-xs font-semibold text-[#8b8279]">{event.city}</span>
            </div>
            <h3 className="font-japanese mt-2 text-lg font-bold leading-snug sm:text-xl">{event.title}</h3>
          </div>
          <button
            type="button"
            className="grid size-11 shrink-0 touch-none place-items-center rounded-xl border border-[#ded3c3] bg-[#faf7f1] text-[#716a62] transition hover:border-[#c83b2f] hover:text-[#9f2a22] active:cursor-grabbing"
            aria-label={`Move ${event.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={21} aria-hidden="true" />
          </button>
        </div>

        {(event.start_point || event.end_point) && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f8f4ed] p-3 text-xs leading-relaxed text-[#655e56]">
            <Route size={16} className="mt-0.5 shrink-0 text-[#9f2a22]" aria-hidden="true" />
            <span>{event.start_point || "Start"} <span aria-hidden="true">→</span> {event.end_point || "Finish"}</span>
          </div>
        )}

        {event.flight_details && <FlightDetailsPanel details={event.flight_details} compact />}

        {(event.travel_mode || event.travel_details) && <div className="mt-3 rounded-xl border border-[#d8c8b6] bg-[#f8f4ed] p-3"><p className="flex items-center gap-2 text-xs font-bold text-[#9f2a22]"><Navigation size={15} /> Recommended travel{event.travel_mode ? ` · ${event.travel_mode}` : ""}</p>{event.travel_details && <p className="mt-1 text-xs leading-relaxed text-[#655e56]">{event.travel_details}</p>}</div>}

        {event.planning_note && <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span><strong>Planning gap:</strong> {event.planning_note}</span></div>}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {event.teen_interest && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-[#716a62]"><Sparkles size={15} className="mt-0.5 shrink-0 text-[#b88a2f]" aria-hidden="true" />{event.teen_interest}</p>
          )}
          {event.food_ideas && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-[#716a62]"><Utensils size={15} className="mt-0.5 shrink-0 text-[#c83b2f]" aria-hidden="true" />{event.food_ideas}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45] transition hover:border-[#c83b2f] hover:text-[#9f2a22]">
              <MapPin size={16} aria-hidden="true" /> Open Google Maps <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
          <Link href={`/itinerary/event/${event.id}`} onClick={(clickEvent) => { clickEvent.preventDefault(); onOpen(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45] transition hover:border-[#c83b2f] hover:text-[#9f2a22]">
            <Pencil size={15} aria-hidden="true" /> Edit
          </Link>
          <Link href={`/itinerary/event/${event.id}#comments`} onClick={(clickEvent) => { clickEvent.preventDefault(); onOpen(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45] transition hover:border-[#c83b2f] hover:text-[#9f2a22]">
            <MessageCircle size={15} aria-hidden="true" /> {commentCount || "Comment"}
          </Link>
          {factCount > 0 && <Link href={`/guide?tab=facts&event=${event.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-3 text-xs font-bold text-[#514b45] transition hover:border-[#c83b2f] hover:text-[#9f2a22]"><BookOpenText size={15} aria-hidden="true" /> {factCount} place fact{factCount === 1 ? "" : "s"}</Link>}
        </div>
      </div>
    </article>
  );
}

export function SortableTimeline({ initialEvents, initialComments, facts, profile, demo }: { initialEvents: ItineraryEvent[]; initialComments: EventComment[]; facts: PlaceFact[]; profile: FamilyProfile | null; demo: boolean }) {
  const storageKey = `japan-2026-order-${initialEvents[0]?.date ?? "empty"}`;
  const [events, setEvents] = useState(initialEvents);
  const [comments, setComments] = useState(initialComments);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!demo) return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const ids = JSON.parse(saved) as string[];
      if (ids.length === initialEvents.length) {
        queueMicrotask(() => setEvents(reassignTimeSlots(initialEvents, ids)));
      }
    } catch { /* Ignore malformed local preview data. */ }
  }, [demo, initialEvents, storageKey]);

  const ids = useMemo(() => events.map((event) => event.id), [events]);

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = events.findIndex((event) => event.id === active.id);
    const newIndex = events.findIndex((event) => event.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = events;
    const reorderedIds = arrayMove(ids, oldIndex, newIndex);
    const optimistic = reassignTimeSlots(events, reorderedIds);
    setEvents(optimistic);
    setMessage("Saving new order…");

    if (demo) {
      window.localStorage.setItem(storageKey, JSON.stringify(reorderedIds));
      setMessage("Order saved on this device.");
      return;
    }

    const { data, error } = await createClient().rpc("reorder_itinerary_day", {
      p_event_ids: reorderedIds,
    });
    if (error) {
      setEvents(previous);
      setMessage("Couldn’t save that move. The previous order has been restored.");
      return;
    }
    setEvents((data as ItineraryEvent[]) ?? optimistic);
    setMessage("Plan updated for the family.");
  }

  if (!events.length) {
    return <div className="rounded-2xl border border-dashed border-[#c7b6a1] p-8 text-center text-sm text-[#716a62]">No activities are planned for this day yet.</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <p className="mb-3 flex min-h-5 items-center gap-2 text-xs font-semibold text-[#716a62]" aria-live="polite">
        {message ? <><Clock3 size={14} aria-hidden="true" />{message}</> : "Drag a handle to rearrange this day. Times move with the available slots."}
      </p>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="relative space-y-4 before:absolute before:bottom-8 before:left-[66px] before:top-8 before:w-px before:bg-[#d7cab9] sm:space-y-5 sm:before:left-[109px]">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              commentCount={comments.filter((comment) => comment.event_id === event.id).length}
              factCount={facts.filter((fact) => fact.itinerary_event_id === event.id).length}
              onOpen={() => setOpenEventId(event.id)}
            />
          ))}
        </div>
      </SortableContext>
      {openEventId && events.find((event) => event.id === openEventId) && (
        <EventDialog
          event={events.find((event) => event.id === openEventId)!}
          comments={comments.filter((comment) => comment.event_id === openEventId)}
          profile={profile}
          demo={demo}
          onClose={() => setOpenEventId(null)}
          onUpdated={(updated) => setEvents((current) => current.map((event) => event.id === updated.id ? updated : event))}
          onCommentAdded={(comment) => setComments((current) => [...current, comment])}
        />
      )}
    </DndContext>
  );
}
