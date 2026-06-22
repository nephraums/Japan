"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function ideasUrl(message: string) {
  return `/suggestions?message=${encodeURIComponent(message)}`;
}

function safeReturnUrl(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return /^\/suggestions(?:\/[0-9a-f-]{36})?$/.test(path) ? path : "/suggestions";
}

export async function createSuggestion(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const targetEventId = String(formData.get("target_event_id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!title) redirect(ideasUrl("Add a title for the idea."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_suggestion", {
    p_title: title,
    p_description: String(formData.get("description") ?? ""),
    p_target_event_id: targetEventId || null,
    p_city: String(formData.get("city") ?? ""),
    p_date: date || null,
    p_preferred_time: String(formData.get("preferred_time") ?? ""),
    p_google_maps_url: String(formData.get("google_maps_url") ?? ""),
  });
  if (error) redirect(ideasUrl(error.message));

  revalidatePath("/suggestions");
  redirect(ideasUrl("Idea added for the family."));
}

export async function castVote(formData: FormData) {
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const vote = String(formData.get("vote") ?? "");
  const returnTo = safeReturnUrl(formData.get("return_to"));
  if (!suggestionId || !["for", "against"].includes(vote)) {
    redirect(ideasUrl("That vote was not valid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cast_suggestion_vote", {
    p_suggestion_id: suggestionId,
    p_vote: vote,
  });
  if (error) redirect(ideasUrl(error.message));

  revalidatePath("/suggestions");
  revalidatePath(returnTo);
  redirect(`${returnTo}?message=${encodeURIComponent(vote === "for" ? "You voted for this idea." : "You voted against this idea.")}`);
}

export async function updateSuggestion(formData: FormData) {
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const targetEventId = String(formData.get("target_event_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const returnTo = `/suggestions/${suggestionId}`;
  if (!suggestionId) redirect("/suggestions");
  if (!title) redirect(`${returnTo}?message=${encodeURIComponent("Add a title for the idea.")}`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_suggestion", {
    p_suggestion_id: suggestionId,
    p_title: title,
    p_description: String(formData.get("description") ?? ""),
    p_target_event_id: targetEventId || null,
    p_city: String(formData.get("city") ?? ""),
    p_date: date || null,
    p_preferred_time: String(formData.get("preferred_time") ?? ""),
    p_google_maps_url: String(formData.get("google_maps_url") ?? ""),
  });
  if (error) redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/suggestions");
  revalidatePath(returnTo);
  redirect(`${returnTo}?message=${encodeURIComponent("Idea updated for the family.")}`);
}

export async function decideSuggestion(formData: FormData) {
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const acceptMode = String(formData.get("accept_mode") ?? "");
  const date = String(formData.get("date") ?? "");
  const returnTo = `/suggestions/${suggestionId}`;
  if (!suggestionId) redirect("/suggestions");

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_suggestion", {
    p_suggestion_id: suggestionId,
    p_decision: decision,
    p_accept_mode: acceptMode || null,
    p_date: date || null,
    p_city: String(formData.get("city") ?? ""),
    p_start_time: String(formData.get("start_time") ?? "") || null,
    p_end_time: String(formData.get("end_time") ?? "") || null,
  });
  if (error) redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/");
  revalidatePath("/itinerary");
  revalidatePath("/suggestions");
  revalidatePath(returnTo);
  const message = decision === "accept"
    ? acceptMode === "replace" ? "Idea accepted and linked activity replaced." : "Idea accepted and added to the itinerary."
    : decision === "park" ? "Idea parked for later." : "Idea rejected.";
  redirect(`${returnTo}?message=${encodeURIComponent(message)}`);
}
