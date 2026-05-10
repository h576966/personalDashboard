import assert from "node:assert/strict";
import test from "node:test";
import { getDeleteListRuleFailure } from "../../src/app/api/lists/deleteRules.mjs";

test("lists lifecycle delete rules: block non-empty, then allow delete when empty and not last list", () => {
  const state = {
    listExists: true,
    listCount: 2,
    itemCount: 1,
  };

  const blocked = getDeleteListRuleFailure(state);
  assert.deepEqual(blocked, {
    message: "Only empty lists can be deleted",
    code: "LIST_NOT_EMPTY",
    status: 400,
  });

  state.itemCount = 0;
  const allowed = getDeleteListRuleFailure(state);
  assert.equal(allowed, null);
});

test("lists lifecycle delete rules: prevent deleting last remaining list", () => {
  const failure = getDeleteListRuleFailure({
    listExists: true,
    listCount: 1,
    itemCount: 0,
  });

  assert.deepEqual(failure, {
    message: "Keep at least one list",
    code: "LAST_LIST",
    status: 400,
  });
});

