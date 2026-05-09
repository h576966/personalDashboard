import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { createEvent, getEvents } from "@/lib/db/events";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET events failed", error);
    return errorResponse("Failed to load events", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const startDate = typeof body.startDate === "string" ? body.startDate : "";

    if (!title) {
      return errorResponse("Event title is required", "INVALID_INPUT", 400);
    }

    if (!startDate) {
      return errorResponse("Event date is required", "INVALID_INPUT", 400);
    }

    const event = await createEvent({
      title,
      description: typeof body.description === "string" ? body.description : "",
      startDate,
      endDate: typeof body.endDate === "string" ? body.endDate : null,
      allDay: body.allDay !== false,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST events failed", error);
    return errorResponse("Failed to create event", "INTERNAL_ERROR", 500);
  }
}
