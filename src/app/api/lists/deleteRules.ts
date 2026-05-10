import { getDeleteListRuleFailure as getDeleteListRuleFailureImpl } from "./deleteRules.mjs";

export interface DeleteListRuleInput {
  listExists: boolean;
  listCount: number;
  itemCount: number;
}

export interface DeleteListRuleFailure {
  message: string;
  code: string;
  status: number;
}

export function getDeleteListRuleFailure(
  input: DeleteListRuleInput,
): DeleteListRuleFailure | null {
  return getDeleteListRuleFailureImpl(input) as DeleteListRuleFailure | null;
}

