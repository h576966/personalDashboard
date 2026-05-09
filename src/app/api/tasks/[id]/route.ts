import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { deleteTask, updateTask } from "@/lib/db/tasks";

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

    if (body.isCompleted !== undefined && typeof body.isCompleted !== "boolean") {
      return errorResponse("isCompleted must be a boolean", "INVALID_INPUT", 400);
    }

    const task = await updateTask(id, {
      title: typeof body.title === "string" ? body.title.trim() : undefined,
      isCompleted: body.isCompleted,
      dueDate: typeof body.dueDate === "string" ? body.dueDate : undefined,
      assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : undefined,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("PATCH task failed", error);
    return errorResponse("Failed to update task", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE task failed", error);
    return errorResponse("Failed to delete task", "INTERNAL_ERROR", 500);
  }
}
