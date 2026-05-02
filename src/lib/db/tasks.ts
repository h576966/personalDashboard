import { getSupabase } from "./supabase";

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
    id: row.id as string,
    title: row.title as string,
    isCompleted: row.is_completed as boolean,
    dueDate: row.due_date as string | null,
    assignedTo: row.assigned_to as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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
