# Development Workflow

## Phase 1: Plan → Gate: Plan Approved

1. Use `/plan` or switch to the **plan** agent for routine planning.
2. Before planning, apply the complexity gate:
   - +1 for each subsystem/domain touched
   - +1 for schema, data model, API contract, or public interface changes
   - +1 for nontrivial concurrency, access-control, migration, deployment, or irreversible behavior
   - +1 if requirements remain ambiguous after one clarification/exploration pass
   - +1 if there was a prior failed implementation attempt
3. Routing:
   - Score 0-2: continue with **plan** (V4 Flash).
   - Score >= 3: stop and manually rerun planning with V4 Pro using the compact handoff.
   - High-risk paths may trigger a manual V4 Pro rerun immediately: credential handling, access-control, payment logic, migrations, deployment, data loss, irreversible operations, or architecture-heavy changes.
4. The plan agent produces either a structured plan or a compact V4 Pro handoff.
5. Review the plan before approving.
6. **Gate:** All implementation steps are specific enough to execute without ambiguity.

## Phase 2: Execute → Gate: Lint + Tests Pass

1. Delegate each plan step to the **code** agent via Task tool.
2. Code implements the change, runs lint and tests.
3. **Gate:** Lint and tests must pass.
4. After 2 failed attempts on the same issue, escalate — do not retry.
5. Escalate after 1 failed attempt for hard-failure classes:
   - Parser/type-system-wide failure affecting many files
   - Failure suggests architecture or ownership misunderstanding
   - Failure appears in high-risk paths
   - The plan step appears wrong, incomplete, or based on an invalid assumption
   - The fix likely requires coordinated changes across more than 3 files or more than 2 domains

Before reporting completion, the code agent MUST:
1. Run lint and fix any issues
2. Run relevant tests and fix any failures
3. Confirm no regressions in related functionality
4. Review git diff and summarize only observed changes

## Phase 3: Review → Gate: No CRITICAL Issues

1. Run `/review` (or delegate to **reviewer**) after each meaningful change.
2. Fix all CRITICAL issues. WARNING issues should be fixed or documented. INFO is optional.
3. **Gate:** No CRITICAL issues remain.

## Cost / Quality Measurement

Track escalation quality using the existing logging scripts where practical:

- % tasks escalated
- success-after-escalation rate
- recurring escalation reasons
- cost per completed task class, if token/cost data is available

Tune thresholds periodically based on outcomes, not intuition.

## Common Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|---|---|---|
| Pro-by-default planning | Routine plans use the expensive model | Use Flash plan unless complexity score >= 3 or high-risk trigger applies |
| Under-escalation in execute | Flash repeats low-probability fixes | Escalate after 1 hard-failure attempt; otherwise after 2 normal failures |
| Kitchen sink session | Context fills with unrelated tasks | Start a new session or `/clear` between unrelated work |
| Over-correcting | Agent retries the same failed approach 3+ times | After 2 normal failures, escalate; for hard-failure classes, escalate after 1 |
| Trust-then-verify gap | Agent produces plausible output that is wrong | Always include specific verification criteria in task prompts |
| Infinite exploration | Agent reads hundreds of files, filling context | Scope investigations narrowly; use code delegation for focused tasks |

