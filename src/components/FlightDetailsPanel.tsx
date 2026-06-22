import { format, parseISO } from "date-fns";
import { Clock3, Luggage, Plane, Users } from "lucide-react";
import type { FlightDetails } from "@/lib/types";

export function FlightDetailsPanel({ details, compact = false }: { details: FlightDetails; compact?: boolean }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#d8c8b6] bg-[#f8f4ed] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9f2a22]"><Plane size={15} /> Confirmed flight</p>
        <p className="text-xs font-bold text-[#514b45]">Booking {details.booking_reference}</p>
      </div>
      <p className="mt-1 text-xs text-[#716a62]">{details.fare} · {details.cabin} · Times shown are local</p>

      <div className="mt-4 space-y-3">
        {details.segments.map((segment) => (
          <div key={`${segment.flight_number}-${segment.date}`} className="rounded-xl bg-white/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-[#26231f]">{segment.flight_number} · {segment.aircraft}</p>
              <p className="flex items-center gap-1 text-xs font-semibold text-[#716a62]"><Clock3 size={13} />{segment.duration}</p>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div><p className="text-lg font-bold">{segment.departure_time}</p><p className="text-xs font-bold">{segment.origin}</p>{segment.origin_terminal && <p className="mt-0.5 text-[11px] text-[#716a62]">{segment.origin_terminal}</p>}<p className="mt-1 text-[11px] text-[#8b8279]">{format(parseISO(segment.date), "d MMM")}</p></div>
              <span className="text-[#c83b2f]" aria-hidden="true">→</span>
              <div className="text-right"><p className="text-lg font-bold">{segment.arrival_time}</p><p className="text-xs font-bold">{segment.destination}</p>{segment.destination_terminal && <p className="mt-0.5 text-[11px] text-[#716a62]">{segment.destination_terminal}</p>}<p className="mt-1 text-[11px] text-[#8b8279]">{format(parseISO(segment.arrival_date), "d MMM")}</p></div>
            </div>
          </div>
        ))}
      </div>

      {!compact && <div className="mt-4 border-t border-[#d8c8b6] pt-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#655e56]"><Users size={14} /> Seats and baggage</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {details.passengers.map((passenger) => <div key={passenger.name} className="rounded-xl bg-white/75 p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-bold">{passenger.name}</span><span className="rounded-full bg-[#efe5d6] px-2 py-1 font-bold text-[#9f2a22]">Seat {passenger.seat}</span></div><p className="mt-2 flex items-center gap-1 text-[#716a62]"><Luggage size={13} /> Carry-on {passenger.carry_on} · Checked {passenger.checked_baggage}</p></div>)}
        </div>
      </div>}
    </div>
  );
}
