import {
  canDeleteList as canDeleteListImpl,
  canRenameList as canRenameListImpl,
  partitionListItems as partitionListItemsImpl,
} from "./helpers.mjs";

export interface ListItemLike {
  is_completed: boolean;
}

export interface HouseholdListLike<TItem extends ListItemLike = ListItemLike> {
  name: string;
  items: TItem[];
}

export function partitionListItems<TItem extends ListItemLike>(items: TItem[]): {
  openItems: TItem[];
  completedItems: TItem[];
} {
  return partitionListItemsImpl(items) as { openItems: TItem[]; completedItems: TItem[] };
}

export function canRenameList(
  activeList: HouseholdListLike | undefined,
  nameDraft: string,
  pendingListId: string | null,
  activeListId: string | undefined,
): boolean {
  return canRenameListImpl(activeList, nameDraft, pendingListId, activeListId);
}

export function canDeleteList(
  activeList: HouseholdListLike | undefined,
  totalLists: number,
  pendingListId: string | null,
  activeListId: string | undefined,
): boolean {
  return canDeleteListImpl(activeList, totalLists, pendingListId, activeListId);
}

