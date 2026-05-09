"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

interface ListItem {
  id: string;
  list_id: string;
  label: string;
  is_completed: boolean;
}

interface HouseholdList {
  id: string;
  name: string;
  items: ListItem[];
}

export default function ListsModule() {
  const [lists, setLists] = useState<HouseholdList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? lists[0],
    [activeListId, lists],
  );

  useEffect(() => {
    let isMounted = true;

    fetch("/api/lists")
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message ?? "Failed to load lists");
        }

        return data.lists ?? [];
      })
      .then((loadedLists: HouseholdList[]) => {
        if (!isMounted) return;

        setLists(loadedLists);
        setActiveListId((current) => current ?? loadedLists[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;

        setError(err instanceof Error ? err.message : "Failed to load lists");
        setLists([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function createList() {
    const name = newListName.trim();
    if (!name) return;

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to create list");
      return;
    }

    setLists((prev) => [...prev, data.list]);
    setActiveListId(data.list.id);
    setNewListName("");
  }

  async function createItem() {
    if (!activeList) return;

    const label = newItemLabel.trim();
    if (!label) return;

    const res = await fetch(`/api/lists/${activeList.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to add item");
      return;
    }

    setLists((prev) =>
      prev.map((list) =>
        list.id === activeList.id ? { ...list, items: [...list.items, data.item] } : list,
      ),
    );
    setNewItemLabel("");
  }

  async function updateItem(item: ListItem, updates: Partial<Pick<ListItem, "label" | "is_completed">>) {
    const res = await fetch(`/api/list-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to update item");
      return;
    }

    setLists((prev) =>
      prev.map((list) =>
        list.id === data.item.list_id
          ? {
              ...list,
              items: list.items.map((existing) =>
                existing.id === data.item.id ? data.item : existing,
              ),
            }
          : list,
      ),
    );
  }

  async function deleteItem(item: ListItem) {
    const res = await fetch(`/api/list-items/${item.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to delete item");
      return;
    }

    setLists((prev) =>
      prev.map((list) =>
        list.id === item.list_id
          ? { ...list, items: list.items.filter((existing) => existing.id !== item.id) }
          : list,
      ),
    );
  }

  function startEditing(item: ListItem) {
    setEditingItemId(item.id);
    setEditingLabel(item.label);
  }

  async function saveEditing(item: ListItem) {
    const label = editingLabel.trim();
    if (!label) return;

    await updateItem(item, { label });
    setEditingItemId(null);
    setEditingLabel("");
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Lists</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Shared household lists for groceries, errands, and to-dos.
        </p>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading lists...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                    (activeList?.id === list.id
                      ? "border-primary bg-primary-hover text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                  }
                >
                  {list.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") createList();
                }}
                placeholder="New list"
                className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={createList}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {activeList ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newItemLabel}
                    onChange={(event) => setNewItemLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") createItem();
                    }}
                    placeholder={`Add to ${activeList.name}`}
                    className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={createItem}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Item
                  </button>
                </div>

                {activeList.items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    Nothing here yet. Add the first item when something needs doing or buying.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
                    {activeList.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex min-h-14 items-center gap-3 px-3 py-2 dark:bg-zinc-900"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item, { is_completed: !item.is_completed })
                          }
                          className={
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors " +
                            (item.is_completed
                              ? "border-primary bg-primary text-white"
                              : "border-zinc-300 text-transparent hover:border-primary dark:border-zinc-600")
                          }
                          aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        {editingItemId === item.id ? (
                          <input
                            value={editingLabel}
                            onChange={(event) => setEditingLabel(event.target.value)}
                            onBlur={() => saveEditing(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") saveEditing(item);
                              if (event.key === "Escape") setEditingItemId(null);
                            }}
                            autoFocus
                            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        ) : (
                          <span
                            className={
                              "min-w-0 flex-1 text-sm " +
                              (item.is_completed
                                ? "text-zinc-400 line-through"
                                : "text-zinc-800 dark:text-zinc-100")
                            }
                          >
                            {item.label}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-primary dark:hover:bg-zinc-800"
                          aria-label="Edit item"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item)}
                          className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Create a list to start sharing household items.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
