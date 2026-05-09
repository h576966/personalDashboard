import { supabaseAdmin } from "@/lib/supabaseServer";

export interface ListItem {
  id: string;
  list_id: string;
  label: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HouseholdList {
  id: string;
  household_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items: ListItem[];
}

const listSelect = "id,household_id,name,sort_order,created_at,updated_at";
const itemSelect = "id,list_id,label,is_completed,sort_order,created_at,updated_at";

export async function getListsWithItems(householdId: string): Promise<HouseholdList[]> {
  const { data: lists, error: listsError } = await supabaseAdmin
    .from("lists")
    .select(listSelect)
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (listsError) throw listsError;

  const typedLists = (lists ?? []) as Omit<HouseholdList, "items">[];
  if (typedLists.length === 0) return [];

  const listIds = typedLists.map((list) => list.id);
  const { data: items, error: itemsError } = await supabaseAdmin
    .from("list_items")
    .select(itemSelect)
    .in("list_id", listIds)
    .order("is_completed", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByList = new Map<string, ListItem[]>();
  for (const item of (items ?? []) as ListItem[]) {
    const group = itemsByList.get(item.list_id) ?? [];
    group.push(item);
    itemsByList.set(item.list_id, group);
  }

  return typedLists.map((list) => ({
    ...list,
    items: itemsByList.get(list.id) ?? [],
  }));
}

export async function createList(householdId: string, name: string): Promise<HouseholdList> {
  const { count, error: countError } = await supabaseAdmin
    .from("lists")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId);

  if (countError) throw countError;

  const { data, error } = await supabaseAdmin
    .from("lists")
    .insert({
      household_id: householdId,
      name,
      sort_order: count ?? 0,
    })
    .select(listSelect)
    .single();

  if (error) throw error;

  return {
    ...(data as Omit<HouseholdList, "items">),
    items: [],
  };
}

export async function createListItem(listId: string, label: string): Promise<ListItem> {
  const { count, error: countError } = await supabaseAdmin
    .from("list_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);

  if (countError) throw countError;

  const { data, error } = await supabaseAdmin
    .from("list_items")
    .insert({
      list_id: listId,
      label,
      sort_order: count ?? 0,
    })
    .select(itemSelect)
    .single();

  if (error) throw error;
  return data as ListItem;
}

export async function updateListItem(
  id: string,
  updates: Partial<{ label: string; is_completed: boolean }>,
): Promise<ListItem> {
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.label !== undefined) dbUpdates.label = updates.label;
  if (updates.is_completed !== undefined) dbUpdates.is_completed = updates.is_completed;

  const { data, error } = await supabaseAdmin
    .from("list_items")
    .update(dbUpdates)
    .eq("id", id)
    .select(itemSelect)
    .single();

  if (error) throw error;
  return data as ListItem;
}

export async function deleteListItem(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("list_items").delete().eq("id", id);
  if (error) throw error;
}
