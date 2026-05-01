---
paths: ["*.js", "*.ts", "*.py", "*.env"]
---

# Security

Apply these rules when working with any code file or environment configuration.

## Secrets and Credentials

- Do not hardcode secrets, API keys, tokens, or passwords. Use environment variables.
- Never log or output sensitive values (secrets, tokens, PII).
- Do not commit `.env`, `.env.local`, `.env.production`, or any file containing secrets.

## Input Validation

- Validate and sanitize all user input at system boundaries (API entry points, CLI args, form fields).
- Reject invalid input with meaningful error messages. Never silently coerce or ignore bad input.
- Use parameterized queries or ORM methods for all database access. Never concatenate user input into SQL strings.

## Least Privilege

- Limit permissions to the minimum required for each operation.
- Avoid running with elevated privileges (root, admin) unless strictly necessary.
- Scope API tokens and service accounts to the narrowest set of resources needed.
