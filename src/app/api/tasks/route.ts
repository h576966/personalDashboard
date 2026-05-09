import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { createTask, getTasks } from "@/lib/db/tasks";

export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET tasks failed", error);
    return errorResponse("Failed to load tasks", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return errorResponse("Task title is required", "INVALID_INPUT", 400);
    }

    const task = await createTask({
      title,
      dueDate: typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null,
      assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : "",
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST tasks failed", error);
    return errorResponse("Failed to create task", "INTERNAL_ERROR", 500);
  }
}
