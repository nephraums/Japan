import Link from "next/link";
import { BookOpenText, CalendarDays, House, Lightbulb, Map, Sparkles } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import type { FamilyProfile } from "@/lib/types";

export function AppShell({
  children,
  profile,
  demo,
}: {
  children: React.ReactNode;
  profile: FamilyProfile | null;
  demo: boolean;
}) {
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-[#ded3c3]/80 bg-[#f7f1e7]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Japan 2026 home">
            <span className="grid size-10 place-items-center rounded-xl border border-[#ded3c3] bg-white shadow-sm">
              <span className="size-5 rounded-full bg-[#c83b2f]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[.22em] text-[#9f2a22]">Family trip</span>
              <span className="font-japanese block text-lg font-bold leading-tight">Japan 2026</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/70">Home</Link>
            <Link href="/itinerary" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/70">Itinerary</Link>
            <Link href="/maps" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/70">Maps</Link>
            <Link href="/suggestions" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/70">Ideas</Link>
            <Link href="/guide" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/70">Guide</Link>
          </nav>
          <div className="flex items-center gap-2">
            {demo ? (
              <span className="hidden rounded-full bg-[#efe5d6] px-3 py-1.5 text-xs font-bold text-[#716a62] sm:inline">Preview mode</span>
            ) : profile ? (
              <span className="hidden items-center gap-2 text-sm font-semibold sm:flex">
                <span aria-hidden="true">{profile.avatar_emoji}</span>{profile.display_name}
                {profile.role === "guest" && <span className="rounded-full bg-[#efe5d6] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#716a62]">Read only</span>}
              </span>
            ) : null}
            <PwaInstallButton />
            <LogoutButton demo={demo} />
          </div>
        </div>
        <div className="asanoha-border h-1 w-full opacity-70" aria-hidden="true" />
      </header>

      {demo && (
        <div className="border-b border-[#d8c49f] bg-[#f3e5c7] px-4 py-2 text-center text-xs font-semibold text-[#65583f]">
          Supabase is not connected yet. You can explore the complete interface; drag changes are saved only on this device.
        </div>
      )}

      {!demo && profile?.role === "guest" && (
        <div className="border-b border-[#d8c49f] bg-[#f3e5c7] px-4 py-2 text-center text-xs font-semibold text-[#65583f]">
          Guest view is read-only. You can browse the plan, maps, ideas and guide, but only the family can make changes.
        </div>
      )}

      <main>{children}</main>

      <nav
        className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-5 rounded-[1.4rem] border border-white/60 bg-[#26231f]/95 p-1.5 text-white shadow-[0_18px_55px_rgba(34,32,29,.3)] backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        <Link href="/" className="flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition hover:bg-white/10">
          <House size={20} aria-hidden="true" /> Home
        </Link>
        <Link href="/itinerary" className="flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition hover:bg-white/10">
          <CalendarDays size={20} aria-hidden="true" /> Plan
        </Link>
        <Link href="/maps" className="flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition hover:bg-white/10">
          <Map size={20} aria-hidden="true" /> Maps
        </Link>
        <Link href="/suggestions" className="flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition hover:bg-white/10">
          <Lightbulb size={20} aria-hidden="true" /> Ideas
        </Link>
        <Link href="/guide" className="flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition hover:bg-white/10">
          <BookOpenText size={20} aria-hidden="true" /> Guide
        </Link>
      </nav>

      <div className="pointer-events-none fixed bottom-28 right-5 -z-10 text-[#c83b2f]/8 md:bottom-8" aria-hidden="true">
        <Sparkles size={110} strokeWidth={1} />
      </div>
    </div>
  );
}
