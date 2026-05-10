export function partitionListItems(items) {
  const openItems = [];
  const completedItems = [];

  for (const item of items) {
    if (item.is_completed) completedItems.push(item);
    else openItems.push(item);
  }

  return { openItems, completedItems };
}

export function canRenameList(activeList, nameDraft, pendingListId, activeListId) {
  if (!activeList) return false;
  if (pendingListId === activeListId) return false;
  const trimmed = nameDraft.trim();
  if (!trimmed) return false;
  return trimmed !== activeList.name;
}

export function canDeleteList(activeList, totalLists, pendingListId, activeListId) {
  if (!activeList) return false;
  if (pendingListId === activeListId) return false;
  if (totalLists <= 1) return false;
  return activeList.items.length === 0;
}

