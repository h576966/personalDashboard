export type Status<T = unknown> =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; data: T }
  | { type: "error"; message: string };
