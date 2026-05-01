# Personal Dashboard

A minimal, local-first agentic development template for [Kilo Code](https://kilo.ai). Structured Plan → Execute → Review workflow with DeepSeek-powered agents.

## Directory Structure

```
├── kilo.jsonc
├── AGENTS.md
├── README.md
├── scripts/
│   ├── activate-rules.mjs
│   ├── log-event.mjs
│   └── review-logs.mjs
├── logs/
└── .kilo/
    ├── agents/
    │   ├── plan.md
    │   ├── ask.md
    │   ├── reviewer.md
    │   ├── code.md
    │   ├── flash-patch.md
    │   ├── flash-debug.md
    │   └── ship.md
    ├── commands/
    │   ├── plan.md
    │   ├── review.md
    │   ├── patch.md
    │   ├── debug.md
    │   └── ship.md
    ├── skills/
    │   └── example/SKILL.md
    └── rules/
        ├── 00-conventions.md
        ├── 10-workflow.md
        ├── 20-security.md
        ├── 21-docs.md
        └── 22-backend.md
```

## Philosophy

- **Local-first** — Everything lives in your repo.
- **Minimal** — Seven focused agents, one skill stub, two base rules, three path-scoped rules, five commands.
- **Verified** — Every phase has a non-negotiable quality gate.
- **Convention over configuration** — Follow existing patterns.
