import assert from "node:assert/strict";
import test from "node:test";
import { canDeleteList, canRenameList, partitionListItems } from "../../src/app/lists/helpers.mjs";

test("partitionListItems splits open and completed deterministically", () => {
  const input = [
    { id: "1", is_completed: false },
    { id: "2", is_completed: true },
    { id: "3", is_completed: false },
  ];
  const { openItems, completedItems } = partitionListItems(input);

  assert.deepEqual(openItems.map((item) => item.id), ["1", "3"]);
  assert.deepEqual(completedItems.map((item) => item.id), ["2"]);
});

test("canRenameList enforces active/pending/meaningful rename checks", () => {
  const list = { name: "Shopping", items: [] };
  assert.equal(canRenameList(list, "Shopping", null, "a"), false);
  assert.equal(canRenameList(list, "  ", null, "a"), false);
  assert.equal(canRenameList(list, "Groceries", "a", "a"), false);
  assert.equal(canRenameList(list, "Groceries", null, "a"), true);
});

test("canDeleteList allows only empty non-last active lists", () => {
  const emptyList = { name: "To-do", items: [] };
  const nonEmptyList = { name: "To-do", items: [{ id: "1" }] };

  assert.equal(canDeleteList(undefined, 2, null, "a"), false);
  assert.equal(canDeleteList(emptyList, 1, null, "a"), false);
  assert.equal(canDeleteList(nonEmptyList, 2, null, "a"), false);
  assert.equal(canDeleteList(emptyList, 2, "a", "a"), false);
  assert.equal(canDeleteList(emptyList, 2, null, "a"), true);
});

