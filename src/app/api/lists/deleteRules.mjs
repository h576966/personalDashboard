export function getDeleteListRuleFailure(input) {
  if (!input.listExists) {
    return { message: "List not found", code: "NOT_FOUND", status: 404 };
  }

  if (input.listCount <= 1) {
    return { message: "Keep at least one list", code: "LAST_LIST", status: 400 };
  }

  if (input.itemCount > 0) {
    return { message: "Only empty lists can be deleted", code: "LIST_NOT_EMPTY", status: 400 };
  }

  return null;
}

