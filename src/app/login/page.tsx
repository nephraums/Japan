import { LoginForm } from "@/components/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { FamilyProfile } from "@/lib/types";

const previewProfiles: FamilyProfile[] = [
  { id: "preview-nigel", display_name: "Nigel", role: "parent", avatar_emoji: "🗻" },
  { id: "preview-sarah", display_name: "Sarah", role: "parent", avatar_emoji: "🌸" },
  { id: "preview-harrison", display_name: "Harrison", role: "teen", avatar_emoji: "🎮" },
  { id: "preview-evelyn", display_name: "Evelyn", role: "teen", avatar_emoji: "🍡" },
  { id: "preview-guest", display_name: "Guest", role: "guest", avatar_emoji: "🧳" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = isSupabaseConfigured();
  let profiles = previewProfiles;
  let loadError: string | undefined;

  if (configured) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_login_profiles", {
      p_trip_slug: "japan-2026",
    });
    if (error || !data?.length) {
      loadError = "We couldn’t load the family profiles. Check the Supabase setup.";
    } else {
      profiles = data as FamilyProfile[];
    }
  }
  const requestedError = (await searchParams).error;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="absolute left-[-90px] top-[-80px] size-64 rounded-full border-[42px] border-[#c83b2f]/8" aria-hidden="true" />
      <div className="absolute bottom-[-110px] right-[-90px] size-72 rounded-full bg-[#263c44]/5" aria-hidden="true" />
      <section className="relative z-10 w-full max-w-md">
        <div className="mb-7 text-center">
          <span className="font-japanese mx-auto grid size-16 place-items-center rounded-full bg-[#c83b2f] text-2xl font-bold text-white shadow-lg shadow-[#c83b2f]/20">旅</span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[.3em] text-[#9f2a22]">4–12 July 2026</p>
          <h1 className="font-japanese mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Our Japan trip</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#716a62]">One family plan for Osaka, Kyoto and Tokyo. Choose your name to come in.</p>
        </div>
        <LoginForm configured={configured} profiles={profiles} error={requestedError || loadError} />
      </section>
    </main>
  );
}
