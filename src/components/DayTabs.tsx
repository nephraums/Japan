import Link from "next/link";
import { format, parseISO } from "date-fns";

export function DayTabs({ dates, selected }: { dates: string[]; selected: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6" aria-label="Trip days">
      <div className="flex min-w-max gap-2">
        {dates.map((date, index) => {
          const active = date === selected;
          return (
            <Link
              key={date}
              href={`/itinerary?date=${date}`}
              aria-current={active ? "date" : undefined}
              className={`min-w-20 rounded-2xl border px-3 py-2.5 text-center transition ${active ? "border-[#c83b2f] bg-[#c83b2f] text-white shadow-md shadow-[#c83b2f]/15" : "border-[#ded3c3] bg-white/65 text-[#514b45] hover:border-[#c7b6a1]"}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-75">Day {index + 1}</span>
              <span className="mt-0.5 block text-sm font-bold">{format(parseISO(date), "EEE d")}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
