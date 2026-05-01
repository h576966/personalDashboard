---
paths: ["src/api/**/*", "src/db/**/*", "src/app/api/**/*"]
---

# Backend Conventions

Apply these rules when working with API and database code.

## REST API Conventions

- Use consistent HTTP status codes: 200 for success, 201 for creation, 400 for client errors, 404 for not found, 500 for server errors.
- Return structured error responses with at least `error.message` and `error.code` fields.
- Handle errors explicitly. Never swallow exceptions with empty catch blocks.

## Input Validation

- Validate all inputs at API boundaries. Return 400 with a descriptive error message for invalid input.
- Sanitize inputs before processing. Assume all client data is untrusted.

## Database

- Use parameterized queries or ORM methods. Never concatenate user input into queries.
- Handle database errors explicitly. Surface meaningful errors to callers, not raw stack traces.
- Keep transactions short. Release connections promptly.
