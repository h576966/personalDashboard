import { getSupabase } from "./supabase";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getNotes(): Promise<Note[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToNote(row as Record<string, unknown>));
}

export async function getNote(id: string): Promise<Note | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToNote(data as Record<string, unknown>) : null;
}

export async function createNote(note: {
  title: string;
  content?: string;
}): Promise<Note> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: note.title,
      content: note.content ?? "",
    })
    .select()
    .single();

  if (error) throw error;
  return rowToNote(data as Record<string, unknown>);
}

export async function updateNote(
  id: string,
  updates: Partial<{ title: string; content: string }>,
): Promise<Note> {
  const supabase = getSupabase();
  const dbUpdates: Record<string, unknown> = {};
  dbUpdates.updated_at = new Date().toISOString();

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;

  const { error } = await supabase
    .from("notes")
    .update(dbUpdates)
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return rowToNote(data as Record<string, unknown>);
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
