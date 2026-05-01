# Development Workflow

## Phase 1: Plan → Gate: Plan Approved

1. Use `/plan` or switch to the **plan** agent.
2. The plan agent produces a structured plan.
3. Review the plan before approving.
4. **Gate:** All implementation steps are specific enough to execute without ambiguity.

## Phase 2: Execute → Gate: Lint + Tests Pass

1. Delegate each plan step to the **code** agent via Task tool.
2. Code implements the change, runs lint and tests.
3. **Gate:** Lint and tests must pass. After 2 failed attempts, escalate — do not retry.

Before reporting completion, the code agent MUST:
1. Run lint and fix any issues
2. Run relevant tests and fix any failures
3. Confirm no regressions in related functionality

## Phase 3: Review → Gate: No CRITICAL Issues

1. Run `/review` (or delegate to **reviewer**) after each meaningful change.
2. Fix all CRITICAL issues. WARNING issues should be fixed or documented. INFO is optional.
3. **Gate:** No CRITICAL issues remain.

## Common Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|---|---|---|
| Kitchen sink session | Context fills with unrelated tasks | Start a new session or `/clear` between unrelated work |
| Over-correcting | Agent retries the same failed approach 3+ times | After 2 failures, escalate; do not retry the same approach |
| Trust-then-verify gap | Agent produces plausible output that is wrong | Always include specific verification criteria in task prompts |
| Infinite exploration | Agent reads hundreds of files, filling context | Scope investigations narrowly; use code delegation for focused tasks |
