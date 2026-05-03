# Context Budget Policy

## Preferred Context-Loading Flow

1. **Search first** (grep, glob, codebase_search) — form a hypothesis before reading files
2. **Read file outlines or relevant symbols** — use `read` with limited offset/limit to scan structure
3. **Read targeted snippets** — narrow reads of the specific functions/blocks needed
4. **Read full files** only when multiple sections are needed simultaneously
5. **Patch minimally** — use `edit` for existing files, `write` only for new files
6. **Run targeted tests** — only the tests relevant to the change
7. **Review diff** — use `git diff` to verify scope is correct

## Avoid

- Reading many full files before forming a hypothesis
- Sending entire log files or stack traces into the model
- Keeping obsolete tool output in context after it has been acted on
- Continuing long loops (3+ iterations) without compaction or task restructuring
- Repeating the same full context when escalating to V4 Pro — only send the relevant failure evidence
