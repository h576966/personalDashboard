"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  ModuleCard,
  ModuleHeader,
  SkeletonList,
} from "./components/ModuleChrome";
import type { AppCopy } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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

interface ListsModuleProps {
  onOpenCountChange?: (count: number) => void;
  copy: AppCopy;
}

export default function ListsModule({ onOpenCountChange, copy }: ListsModuleProps) {
  const [lists, setLists] = useState<HouseholdList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [listNameDraft, setListNameDraft] = useState("");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? lists[0],
    [activeListId, lists],
  );
  const openItems = activeList?.items.filter((item) => !item.is_completed) ?? [];
  const completedItems = activeList?.items.filter((item) => item.is_completed) ?? [];
  const canRenameActiveList =
    Boolean(activeList) &&
    listNameDraft.trim().length > 0 &&
    listNameDraft.trim() !== activeList?.name &&
    pendingListId !== activeList?.id;
  const canDeleteActiveList =
    Boolean(activeList) &&
    activeList?.items.length === 0 &&
    pendingListId !== activeList?.id &&
    lists.length > 1;

  useEffect(() => {
    onOpenCountChange?.(
      lists.reduce(
        (count, list) => count + list.items.filter((item) => !item.is_completed).length,
        0,
      ),
    );
  }, [lists, onOpenCountChange]);

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
        setListNameDraft(loadedLists[0]?.name ?? "");
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

  function setItemPending(id: string, pending: boolean) {
    setPendingItemIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function createList() {
    const name = newListName.trim();
    if (!name || isCreatingList) return;

    setIsCreatingList(true);
    setError(null);

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    setIsCreatingList(false);

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to create list");
      return;
    }

    setLists((prev) => [...prev, data.list]);
    setActiveListId(data.list.id);
    setListNameDraft(data.list.name);
    setNewListName("");
  }

  async function renameActiveList() {
    if (!activeList || !canRenameActiveList) return;

    const name = listNameDraft.trim();
    setPendingListId(activeList.id);
    setError(null);

    const res = await fetch(`/api/lists/${activeList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    setPendingListId(null);

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to rename list");
      return;
    }

    setLists((prev) =>
      prev.map((list) =>
        list.id === data.list.id ? { ...list, name: data.list.name } : list,
      ),
    );
    setListNameDraft(data.list.name);
  }

  async function deleteActiveList() {
    if (!activeList || !canDeleteActiveList) return;
    if (!window.confirm(copy.lists.deleteListConfirm(activeList.name))) return;

    setPendingListId(activeList.id);
    setError(null);

    const res = await fetch(`/api/lists/${activeList.id}`, { method: "DELETE" });
    const data = await res.json();

    setPendingListId(null);

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to delete list");
      return;
    }

    const remainingLists = lists.filter((list) => list.id !== activeList.id);
    setLists(remainingLists);
    setActiveListId(remainingLists[0]?.id ?? null);
    setListNameDraft(remainingLists[0]?.name ?? "");
  }

  async function createItem() {
    if (!activeList || isCreatingItem) return;

    const label = newItemLabel.trim();
    if (!label) return;

    setIsCreatingItem(true);
    setError(null);

    const res = await fetch(`/api/lists/${activeList.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();

    setIsCreatingItem(false);

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

  async function updateItem(
    item: ListItem,
    updates: Partial<Pick<ListItem, "label" | "is_completed">>,
  ): Promise<boolean> {
    if (pendingItemIds.has(item.id)) return false;

    setItemPending(item.id, true);
    setError(null);

    const res = await fetch(`/api/list-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();

    setItemPending(item.id, false);

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to update item");
      return false;
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
    return true;
  }

  async function deleteItem(item: ListItem): Promise<boolean> {
    if (pendingItemIds.has(item.id)) return false;

    setItemPending(item.id, true);
    setError(null);

    const res = await fetch(`/api/list-items/${item.id}`, { method: "DELETE" });
    const data = await res.json();

    setItemPending(item.id, false);

    if (!res.ok) {
      setError(data.error?.message ?? "Failed to delete item");
      return false;
    }

    setLists((prev) =>
      prev.map((list) =>
        list.id === item.list_id
          ? { ...list, items: list.items.filter((existing) => existing.id !== item.id) }
          : list,
      ),
    );
    return true;
  }

  async function clearCompleted() {
    if (completedItems.length === 0 || isClearingCompleted) return;

    setIsClearingCompleted(true);
    await Promise.all(completedItems.map((item) => deleteItem(item)));
    setIsClearingCompleted(false);
  }

  function startEditing(item: ListItem) {
    setEditingItemId(item.id);
    setEditingLabel(item.label);
  }

  async function saveEditing(item: ListItem) {
    const label = editingLabel.trim();
    if (!label) return;

    const updated = await updateItem(item, { label });
    if (updated) {
      setEditingItemId(null);
      setEditingLabel("");
    }
  }

  return (
    <ModuleCard>
      <ModuleHeader
        title={copy.lists.title}
        description={copy.lists.description}
      />

      <div className="space-y-4 p-4">
        {error && <InlineNotice tone="error">{error}</InlineNotice>}

        {isLoading ? (
          <SkeletonList count={2} />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => {
                    setActiveListId(list.id);
                    setListNameDraft(list.name);
                  }}
                  className={cn(
                    "min-h-10 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    activeList?.id === list.id
                      ? "border-primary bg-primary-hover text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
                  )}
                >
                  {list.name}
                  <span className="ml-1 text-xs opacity-70">
                    {list.items.filter((item) => !item.is_completed).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void createList();
                }}
                placeholder={copy.lists.newList}
                className="min-h-10 min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <ActionButton onClick={createList} disabled={isCreatingList}>
                <Plus className="h-4 w-4" />
                {isCreatingList ? copy.lists.adding : copy.lists.addList}
              </ActionButton>
            </div>

            {activeList ? (
              <div className="space-y-4">
                <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {copy.lists.listName}
                    </span>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <input
                        value={listNameDraft}
                        onChange={(event) => setListNameDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void renameActiveList();
                        }}
                        disabled={pendingListId === activeList.id}
                        className="min-h-10 min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                      <ActionButton
                        onClick={renameActiveList}
                        disabled={!canRenameActiveList}
                        className="min-h-10"
                      >
                        <Pencil className="h-4 w-4" />
                        {pendingListId === activeList.id ? copy.lists.saving : copy.lists.saveName}
                      </ActionButton>
                      <ActionButton
                        onClick={deleteActiveList}
                        disabled={!canDeleteActiveList}
                        variant="danger"
                        className="min-h-10"
                        title={
                          activeList.items.length > 0
                            ? copy.lists.deleteEmptyOnly
                            : lists.length <= 1
                              ? copy.lists.keepOneList
                              : copy.lists.deleteList
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        {copy.lists.deleteList}
                      </ActionButton>
                    </div>
                  </label>
                  {(activeList.items.length > 0 || lists.length <= 1) && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {activeList.items.length > 0
                        ? copy.lists.deleteEmptyOnly
                        : copy.lists.keepOneList}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    value={newItemLabel}
                    onChange={(event) => setNewItemLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void createItem();
                    }}
                    placeholder={copy.lists.addTo(activeList.name)}
                    className="min-h-11 min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <ActionButton onClick={createItem} disabled={isCreatingItem} variant="primary">
                    <Plus className="h-4 w-4" />
                    {isCreatingItem ? copy.lists.adding : copy.lists.addItem}
                  </ActionButton>
                </div>

                <ItemSection
                  title={copy.lists.open}
                  items={openItems}
                  emptyTitle={copy.lists.nothingOpenTitle}
                  emptyDescription={copy.lists.nothingOpenDescription}
                  editingItemId={editingItemId}
                  editingLabel={editingLabel}
                  pendingItemIds={pendingItemIds}
                  onEditingLabelChange={setEditingLabel}
                  onStartEditing={startEditing}
                  onSaveEditing={saveEditing}
                  onCancelEditing={() => setEditingItemId(null)}
                  onToggle={(item) => updateItem(item, { is_completed: true })}
                  onDelete={deleteItem}
                  copy={copy}
                />

                {completedItems.length > 0 && (
                  <ItemSection
                    title={copy.lists.completed}
                    items={completedItems}
                    action={
                      <ActionButton
                        variant="ghost"
                        onClick={clearCompleted}
                        disabled={isClearingCompleted}
                        className="min-h-8 px-2 py-1 text-xs"
                      >
                        {isClearingCompleted ? copy.lists.clearing : copy.lists.clearCompleted}
                      </ActionButton>
                    }
                    editingItemId={editingItemId}
                    editingLabel={editingLabel}
                    pendingItemIds={pendingItemIds}
                    muted
                    onEditingLabelChange={setEditingLabel}
                    onStartEditing={startEditing}
                    onSaveEditing={saveEditing}
                    onCancelEditing={() => setEditingItemId(null)}
                    onToggle={(item) => updateItem(item, { is_completed: false })}
                    onDelete={deleteItem}
                    copy={copy}
                  />
                )}
              </div>
            ) : (
              <EmptyState
                title={copy.lists.createListTitle}
                description={copy.lists.createListDescription}
              />
            )}
          </>
        )}
      </div>
    </ModuleCard>
  );
}

function ItemSection({
  title,
  items,
  action,
  muted = false,
  emptyTitle,
  emptyDescription,
  editingItemId,
  editingLabel,
  pendingItemIds,
  onEditingLabelChange,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onToggle,
  onDelete,
  copy,
}: {
  title: string;
  items: ListItem[];
  action?: ReactNode;
  muted?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  editingItemId: string | null;
  editingLabel: string;
  pendingItemIds: Set<string>;
  onEditingLabelChange: (value: string) => void;
  onStartEditing: (item: ListItem) => void;
  onSaveEditing: (item: ListItem) => void | Promise<void>;
  onCancelEditing: () => void;
  onToggle: (item: ListItem) => void | Promise<unknown>;
  onDelete: (item: ListItem) => void | Promise<unknown>;
  copy: AppCopy;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
          <span className="ml-1 text-zinc-400">{items.length}</span>
        </p>
        {action}
      </div>

      {items.length === 0 ? (
        <EmptyState title={emptyTitle ?? copy.lists.nothingHere} description={emptyDescription} />
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {items.map((item) => {
            const pending = pendingItemIds.has(item.id);

            return (
              <li
                key={item.id}
                className={cn(
                  "flex min-h-14 items-center gap-3 px-3 py-2 dark:bg-zinc-900",
                  muted && "bg-zinc-50/50 dark:bg-zinc-900/70",
                  pending && "opacity-60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  disabled={pending}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-wait",
                    item.is_completed
                      ? "border-primary bg-primary text-white"
                      : "border-zinc-300 text-transparent hover:border-primary dark:border-zinc-600",
                  )}
                  aria-label={item.is_completed ? copy.lists.markIncomplete : copy.lists.markComplete}
                >
                  <Check className="h-4 w-4" />
                </button>

                {editingItemId === item.id ? (
                  <input
                    value={editingLabel}
                    onChange={(event) => onEditingLabelChange(event.target.value)}
                    onBlur={() => onSaveEditing(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void onSaveEditing(item);
                      if (event.key === "Escape") onCancelEditing();
                    }}
                    autoFocus
                    disabled={pending}
                    className="min-h-9 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-primary disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                ) : (
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-sm",
                      item.is_completed
                        ? "text-zinc-400 line-through"
                        : "text-zinc-800 dark:text-zinc-100",
                    )}
                  >
                    {item.label}
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  <ActionButton
                    variant="ghost"
                    onClick={() => onStartEditing(item)}
                    disabled={pending}
                    className="min-h-9 w-9 px-0"
                    aria-label={copy.lists.editItem}
                  >
                    <Pencil className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    onClick={() => onDelete(item)}
                    disabled={pending}
                    className="min-h-9 w-9 px-0 hover:text-red-600"
                    aria-label={copy.lists.deleteItem}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
