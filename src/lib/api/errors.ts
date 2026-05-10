import { NextResponse } from "next/server";
import { createErrorPayload } from "./errorPayload.mjs";

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

export function errorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json(createErrorPayload(message, code), { status });
}
