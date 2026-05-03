# Model Routing Policy

## Default

All normal implementation, debugging, review, documentation, and mechanical work uses V4 Flash.

## V4 Pro Triggers

Escalate deliberately, not automatically. V4 Pro is warranted when:

- The same test fails twice after attempted fixes
- More than 5 files require coordinated changes
- The task requires changing public APIs, data models, or schemas
- The task affects auth, authorization, billing, secrets, migrations, deployment, or irreversible operations
- The worker cannot clearly explain the failure or root cause
- The worker is uncertain about architecture, hidden coupling, or side effects
- Context has become too large or noisy (exceeds effective reasoning window)

## Anti-Escalation

Do NOT use V4 Pro for:

- Basic file search, reading logs, formatting
- Simple docs edits, straightforward tests
- Rewriting obvious boilerplate
- Tasks where deterministic tools alone suffice
- Single-line or single-file mechanical changes

## Handoff Protocol

Escalation is always a human decision. Present options directly in the chat; never auto-switch models.
