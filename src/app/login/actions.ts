"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const profileId = formData.get("profile_id");
  const pin = formData.get("pin");

  if (typeof profileId !== "string" || !profileId) {
    loginError("Choose your name first.");
  }
  if (typeof pin !== "string" || !/^\d{6,}$/.test(pin)) {
    loginError("Enter the family PIN (at least six digits).");
  }

  const supabase = await createClient();
  const { data: current } = await supabase.auth.getUser();
  if (!current.user) {
    const { error: authError } = await supabase.auth.signInAnonymously();
    if (authError) {
      loginError(
        authError.message.toLowerCase().includes("anonymous sign-ins are disabled")
          ? "Anonymous sign-ins are disabled in Supabase."
          : "Supabase could not start a secure session. Please try again.",
      );
    }
  }

  const { error: claimError } = await supabase.rpc("claim_family_profile", {
    p_profile_id: profileId,
    p_pin: pin,
  });
  if (claimError) {
    await supabase.auth.signOut();
    loginError(
      claimError.message.toLowerCase().includes("incorrect family pin")
        ? "That PIN didn’t work. Please try again."
        : "We couldn’t connect this device to the family trip.",
    );
  }

  redirect("/");
}
