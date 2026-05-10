export function createErrorPayload(message, code) {
  return { error: { message, code } };
}
