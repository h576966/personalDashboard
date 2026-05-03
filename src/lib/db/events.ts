import { getSupabase } from "./supabase";
import { assertField } from "./assert";

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  createdAt: string;
  updatedAt: string;
}

function rowToEvent(row: Record<string, unknown>): Event {
  return {
    id: assertField<string>(row, "id", "string"),
    title: assertField<string>(row, "title", "string"),
    description: assertField<string>(row, "description", "string"),
    startDate: assertField<string>(row, "start_date", "string"),
    endDate: (row.end_date as string | null) ?? null,
    allDay: assertField<boolean>(row, "all_day", "boolean"),
    createdAt: assertField<string>(row, "created_at", "string"),
    updatedAt: assertField<string>(row, "updated_at", "string"),
  };
}

export async function getEvents(): Promise<Event[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToEvent(row as Record<string, unknown>));
}

export async function createEvent(event: {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
}): Promise<Event> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: event.title,
      description: event.description ?? "",
      start_date: event.startDate,
      end_date: event.endDate ?? null,
      all_day: event.allDay ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToEvent(data as Record<string, unknown>);
}

export async function updateEvent(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    startDate: string;
    endDate: string | null;
    allDay: boolean;
  }>,
): Promise<Event> {
  const supabase = getSupabase();
  const dbUpdates: Record<string, unknown> = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.allDay !== undefined) dbUpdates.all_day = updates.allDay;

  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("events")
    .update(dbUpdates)
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return rowToEvent(data as Record<string, unknown>);
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
