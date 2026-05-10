"use client";

import { useEffect, useMemo, useState } from "react";
import { canDeleteList, canRenameList, partitionListItems } from "./lists/helpers";

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

export interface UseListsDataInput {
  onOpenCountChange?: (count: number) => void;
  copy: {
    lists: {
      deleteListConfirm: (name: string) => string;
    };
  };
}

export interface UseListsDataResult {
  lists: HouseholdList[];
  activeList: HouseholdList | undefined;
  activeListId: string | null;
  newListName: string;
  listNameDraft: string;
  newItemLabel: string;
  editingItemId: string | null;
  editingLabel: string;
  isLoading: boolean;
  isCreatingList: boolean;
  isCreatingItem: boolean;
  pendingListId: string | null;
  pendingItemIds: Set<string>;
  isClearingCompleted: boolean;
  error: string | null;
  openItems: ListItem[];
  completedItems: ListItem[];
  canRenameActiveList: boolean;
  canDeleteActiveList: boolean;
  setNewListName: (value: string) => void;
  setListNameDraft: (value: string) => void;
  setNewItemLabel: (value: string) => void;
  setEditingLabel: (value: string) => void;
  setEditingItemId: (value: string | null) => void;
  selectList: (id: string) => void;
  createList: () => Promise<void>;
  renameActiveList: () => Promise<void>;
  deleteActiveList: () => Promise<void>;
  createItem: () => Promise<void>;
  updateItem: (
    item: ListItem,
    updates: Partial<Pick<ListItem, "label" | "is_completed">>,
  ) => Promise<boolean>;
  deleteItem: (item: ListItem) => Promise<boolean>;
  clearCompleted: () => Promise<void>;
}

export function useListsData({ onOpenCountChange, copy }: UseListsDataInput): UseListsDataResult {
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
  const { openItems, completedItems } = useMemo(
    () => partitionListItems(activeList?.items ?? []),
    [activeList?.items],
  );
  const canRenameActiveList = canRenameList(activeList, listNameDraft, pendingListId, activeList?.id);
  const canDeleteActiveList = canDeleteList(activeList, lists.length, pendingListId, activeList?.id);

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

        const nextActiveList = loadedLists[0];
        setLists(loadedLists);
        setActiveListId((current) => current ?? nextActiveList?.id ?? null);
        setListNameDraft(nextActiveList?.name ?? "");
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

  function selectList(id: string) {
    const list = lists.find((candidate) => candidate.id === id);
    setActiveListId(id);
    setListNameDraft(list?.name ?? "");
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

  return {
    lists,
    activeList,
    activeListId,
    newListName,
    listNameDraft,
    newItemLabel,
    editingItemId,
    editingLabel,
    isLoading,
    isCreatingList,
    isCreatingItem,
    pendingListId,
    pendingItemIds,
    isClearingCompleted,
    error,
    openItems,
    completedItems,
    canRenameActiveList,
    canDeleteActiveList,
    setNewListName,
    setListNameDraft,
    setNewItemLabel,
    setEditingLabel,
    setEditingItemId,
    selectList,
    createList,
    renameActiveList,
    deleteActiveList,
    createItem,
    updateItem,
    deleteItem,
    clearCompleted,
  };
}

