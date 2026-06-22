import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventDialog } from "@/components/EventDialog";
import type { ItineraryEvent } from "@/lib/types";

const event: ItineraryEvent = {
  id: "event-1",
  trip_id: "trip-1",
  date: "2026-07-04",
  city: "Osaka",
  title: "Original activity",
  description: null,
  start_time: "09:00",
  end_time: "12:00",
  sort_order: 100,
  status: "draft",
  category: "activity",
  location_name: null,
  google_maps_url: null,
  start_point: null,
  end_point: null,
  teen_interest: null,
  food_ideas: null,
  flight_details: null,
  travel_mode: null,
  travel_details: null,
  planning_note: null,
};

describe("event details", () => {
  it("saves edits in preview mode", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    render(<EventDialog event={event} comments={[]} profile={null} demo onClose={vi.fn()} onUpdated={onUpdated} onCommentAdded={vi.fn()} />);

    const title = screen.getByLabelText("Activity title");
    await user.clear(title);
    await user.type(title, "Updated activity");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ title: "Updated activity" }));
    expect(screen.getByText("Changes saved in this preview.")).toBeInTheDocument();
  });

  it("adds a family comment in preview mode", async () => {
    const user = userEvent.setup();
    const onCommentAdded = vi.fn();
    render(<EventDialog event={event} comments={[]} profile={null} demo onClose={vi.fn()} onUpdated={vi.fn()} onCommentAdded={onCommentAdded} />);

    await user.type(screen.getByLabelText("Add a comment"), "Let’s book this one.");
    await user.click(screen.getByRole("button", { name: "Post comment" }));

    expect(onCommentAdded).toHaveBeenCalledWith(expect.objectContaining({ body: "Let’s book this one." }));
  });
});
