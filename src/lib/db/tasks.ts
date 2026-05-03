import { getSupabase } from "./supabase";
import { assertField } from "./assert";

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
  assignedTo: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: assertField<string>(row, "id", "string"),
    title: assertField<string>(row, "title", "string"),
    isCompleted: assertField<boolean>(row, "is_completed", "boolean"),
    dueDate: (row.due_date as string | null) ?? null,
    assignedTo: assertField<string>(row, "assigned_to", "string"),
    sortOrder: assertField<number>(row, "sort_order", "number"),
    createdAt: assertField<string>(row, "created_at", "string"),
    updatedAt: assertField<string>(row, "updated_at", "string"),
  };
}

export async function getTasks(): Promise<Task[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToTask(row as Record<string, unknown>));
}

export async function createTask(task: {
  title: string;
  dueDate?: string | null;
  assignedTo?: string;
  sortOrder?: number;
}): Promise<Task> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      due_date: task.dueDate ?? null,
      assigned_to: task.assignedTo ?? "",
      sort_order: task.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToTask(data as Record<string, unknown>);
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    isCompleted: boolean;
    dueDate: string | null;
    assignedTo: string;
    sortOrder: number;
  }>,
): Promise<Task> {
  const supabase = getSupabase();
  const dbUpdates: Record<string, unknown> = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(dbUpdates)
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return rowToTask(data as Record<string, unknown>);
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderTasks(
  updates: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  const supabase = getSupabase();
  // Update each task's sort_order in sequence
  for (const { id, sortOrder } of updates) {
    const { error } = await supabase
      .from("tasks")
      .update({ sort_order: sortOrder, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }
}
