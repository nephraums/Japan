import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-[#ded3c3] bg-white/80 p-7 text-center shadow-[0_24px_60px_rgba(83,61,42,.12)]">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#efe5d6] text-[#9f2a22]"><CloudOff size={26} /></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.22em] text-[#9f2a22]">Offline in Japan</p>
        <h1 className="font-japanese mt-2 text-3xl font-bold">No connection just now</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#716a62]">Previously saved trip pages are still available. Return home, or reconnect and try again for pages that have not been saved yet.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#c83b2f] px-4 text-sm font-bold text-white">Saved trip home</Link>
          <form action="/"><button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#ded3c3] bg-white px-4 text-sm font-bold"><RefreshCw size={15} /> Try connection</button></form>
        </div>
      </section>
    </main>
  );
}
