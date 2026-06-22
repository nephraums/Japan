import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { login } from "@/app/login/actions";
import type { FamilyProfile } from "@/lib/types";

export function LoginForm({
  configured,
  profiles,
  error,
}: {
  configured: boolean;
  profiles: FamilyProfile[];
  error?: string;
}) {
  return (
    <form action={configured ? login : undefined} className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_24px_80px_rgba(68,53,38,.13)] backdrop-blur sm:p-7">
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-[#514b45]">Who’s travelling?</legend>
        <div className="grid grid-cols-2 gap-3">
          {profiles.map((profile) => (
            <label
              key={profile.display_name}
              className="relative min-h-25 cursor-pointer select-none overflow-hidden rounded-2xl border border-[#ded3c3] bg-white/60 p-4 text-center transition has-[:checked]:border-[#c83b2f] has-[:checked]:bg-[#fff1ed] has-[:checked]:text-[#8f281f] has-[:checked]:shadow-[0_0_0_2px_rgba(200,59,47,.12)] active:scale-[.98]"
            >
              <input
                type="radio"
                name="profile_id"
                value={profile.id}
                required
                className="peer absolute inset-0 z-10 size-full cursor-pointer touch-manipulation appearance-none opacity-[.01]"
                aria-label={`Continue as ${profile.display_name}`}
              />
              <span className="pointer-events-none block text-2xl" aria-hidden="true">{profile.avatar_emoji}</span>
              <span className="pointer-events-none mt-1 block text-sm font-bold">{profile.display_name}</span>
              <span className="pointer-events-none mt-1 hidden text-[10px] font-bold uppercase tracking-wider text-[#c83b2f] peer-checked:block">Selected</span>
            </label>
          ))}
        </div>
      </fieldset>

      {configured ? (
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-bold text-[#514b45]">Family PIN</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8279]" size={19} aria-hidden="true" />
            <input name="pin" inputMode="numeric" pattern="[0-9]{6,}" autoComplete="one-time-code" maxLength={12} required className="min-h-14 w-full rounded-2xl border border-[#ded3c3] bg-white pl-12 pr-4 text-lg tracking-[.3em] shadow-inner" placeholder="••••••" />
          </span>
        </label>
      ) : (
        <div className="mt-5 rounded-2xl border border-[#d8c49f] bg-[#f8ecd3] p-4 text-sm leading-relaxed text-[#65583f]">
          Supabase isn’t connected yet. Preview mode uses the real supplied itinerary without requiring a PIN.
        </div>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      {configured ? (
        <button type="submit" className="mt-5 flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#c83b2f] px-5 font-bold text-white shadow-lg shadow-[#c83b2f]/15 transition hover:bg-[#9f2a22] active:scale-[.99]">
          Enter the trip <ArrowRight size={19} />
        </button>
      ) : (
        <Link href="/" className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c83b2f] px-5 font-bold text-white shadow-lg shadow-[#c83b2f]/15 transition hover:bg-[#9f2a22]">
          Open preview <ArrowRight size={19} />
        </Link>
      )}
    </form>
  );
}
