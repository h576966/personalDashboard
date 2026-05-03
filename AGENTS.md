Project Instructions
Local-first agentic development with a structured Plan → Execute → Review workflow.

Workflow
Standard: Plan → Execute → Review → Ship
Plan — Use /plan (plan agent) for multi-file work, new features, refactors, or any design decision. Plan is Flash-first; escalate to pro-plan only when complexity or risk triggers require it.
Execute — Delegate implementation steps to the code agent. One step at a time.
Review — /review after every meaningful change. Address CRITICAL issues before proceeding.
Ship — Use /ship (ship agent) as the final pre-push quality gate for single-developer workflows; verify diff, checks, commit message, and push readiness.
Fast Paths
Patch — Use /patch (flash-patch agent) for small, well-scoped edits where the change can be described briefly and verified with explicit passing command output.
Debug — Use /debug (flash-debug agent) when something is failing and you can provide the failing command and error output, plus the command/output expected after the fix.
Skip the plan phase for: trivial fixes (typos, formatting), well-scoped changes ("rename this variable"), or changes describable in one sentence. Always plan for multi-file changes, new features, refactoring, or design decisions.

Complexity Gate
Use a small complexity score before choosing the planning model:

+1 for each subsystem/domain touched
+1 for schema, data model, API contract, or public interface changes
+1 for nontrivial concurrency, security, permission, migration, deployment, or irreversible behavior
+1 if requirements remain ambiguous after one clarification/exploration pass
+1 if there was a prior failed implementation attempt
Routing:

Score 0-2: use Flash plan (plan).
Score >= 3: use Pro plan (pro-plan).
Any high-risk path involving auth, permissions, billing, secrets, migrations, deployment, data loss, or irreversible operations may use pro-plan immediately even if the score is lower.
Verification
The single highest-leverage thing you can do is give each agent a way to verify its own work. When delegating tasks, always specify verification criteria (tests to run, lint commands, expected outputs). Agents must self-verify before reporting completion — work is not done until lint, typecheck, and tests pass.

Agents
Agent	Mode	Model	Use for	Why
plan	primary	deepseek-v4-flash	Routine planning, scoped design, normal multi-file work	Cheap default planning with explicit complexity gate
pro-plan	primary	deepseek-v4-pro	High-complexity planning, architecture, risky changes, hard recovery	Deep reasoning only when it changes the decision
ask	primary	deepseek-v4-flash	Code explanation, questions, research	Fast, cost-effective for read-only queries
reviewer	subagent	deepseek-v4-flash	Code review (read-only)	Fast feedback; complex issues escalate to plan/pro-plan by trigger
code	primary	deepseek-v4-flash	Implementation of defined tasks	Fast execution of well-defined, pre-planned steps
flash-patch	subagent	deepseek-v4-flash	Small, scoped edits	Fast turnaround for minimal diffs with explicit verification output
flash-debug	subagent	deepseek-v4-flash	Debugging failing commands	Fast triage using failing output and rerun verification
ship	subagent	deepseek-v4-flash	Final commit + push gate	Solo workflow guardrail: diff review, verification, commit message, push decision
Rules
Rule files in .kilo/rules/ may have YAML frontmatter paths: to scope them to specific file patterns. Activated path-scoped rules: 20-security.md (.js, .ts, .py, .env), 21-docs.md (.md, docs/**/), 22-backend.md (src/api/**/, src/db/**/).

Do NOT
Do not jump to implementation without a plan. Non-trivial changes require a written plan first.
Do not default to Pro for routine planning. Use the complexity gate.
Do not delay escalation when failure class is clearly hard. Parser/type-system-wide failures, architecture misunderstandings, and high-risk path failures can escalate after one attempt.
Do not add dependencies or libraries without discussion.
Do not refactor unrelated code.
Do not leave debug logs, TODO comments, or commented-out code.
Do not skip linting, type-checking, or tests. Work is not done until all three pass. After 2 failed fix attempts, escalate; for hard-failure classes, escalate after 1 failed attempt.