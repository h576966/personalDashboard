import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { deleteEvent, updateEvent } from "@/lib/db/events";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (body.title !== undefined && typeof body.title !== "string") {
      return errorResponse("title must be a string", "INVALID_INPUT", 400);
    }

    const event = await updateEvent(id, {
      title: typeof body.title === "string" ? body.title.trim() : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      endDate: typeof body.endDate === "string" ? body.endDate : undefined,
      allDay: typeof body.allDay === "boolean" ? body.allDay : undefined,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("PATCH event failed", error);
    return errorResponse("Failed to update event", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE event failed", error);
    return errorResponse("Failed to delete event", "INTERNAL_ERROR", 500);
  }
}
