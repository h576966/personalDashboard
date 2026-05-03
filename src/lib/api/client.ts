export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  error?: { message?: string; code?: string };
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code = "UNKNOWN";

    try {
      const body: ErrorBody = await res.json();
      if (body.error?.message) message = body.error.message;
      if (body.error?.code) code = body.error.code;
    } catch {
      // Response body is not JSON — use defaults
    }

    throw new ApiError(message, res.status, code);
  }

  return (await res.json()) as T;
}
