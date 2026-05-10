import assert from "node:assert/strict";
import test from "node:test";
import { createErrorPayload } from "../../src/lib/api/errorPayload.mjs";

test("createErrorPayload returns the documented API error shape", () => {
  assert.deepEqual(createErrorPayload("title is required", "INVALID_INPUT"), {
    error: {
      message: "title is required",
      code: "INVALID_INPUT",
    },
  });
});
