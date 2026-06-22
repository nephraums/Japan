"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function eventUrl(eventId: string, message: string, hash = "") {
  return `/itinerary/event/${eventId}?message=${encodeURIComponent(message)}${hash}`;
}

export async function updateEvent(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const mapUrl = String(formData.get("google_maps_url") ?? "");
  const status = String(formData.get("status") ?? "draft");
  const travelMode = String(formData.get("travel_mode") ?? "");
  const travelDetails = String(formData.get("travel_details") ?? "");
  if (!eventId) redirect("/itinerary");

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_itinerary_event", {
    p_event_id: eventId,
    p_title: title,
    p_description: description,
    p_start_time: startTime,
    p_end_time: endTime,
    p_google_maps_url: mapUrl,
    p_status: status,
    p_travel_mode: travelMode,
    p_travel_details: travelDetails,
  });
  if (error) redirect(eventUrl(eventId, error.message));

  revalidatePath("/itinerary");
  revalidatePath(`/itinerary/event/${eventId}`);
  redirect(eventUrl(eventId, "Itinerary updated for everyone."));
}

export async function addEventComment(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!eventId || !tripId) redirect("/itinerary");
  if (!body) redirect(eventUrl(eventId, "Write a comment before posting.", "#comments"));

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");
  const { data: session } = await supabase
    .from("family_user_sessions")
    .select("family_user_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (!session) redirect("/login");

  const { error } = await supabase.from("comments").insert({
    trip_id: tripId,
    event_id: eventId,
    suggestion_id: null,
    user_id: session.family_user_id,
    body,
  });
  if (error) redirect(eventUrl(eventId, error.message, "#comments"));

  revalidatePath("/itinerary");
  revalidatePath(`/itinerary/event/${eventId}`);
  redirect(eventUrl(eventId, "Comment added.", "#comments"));
}
