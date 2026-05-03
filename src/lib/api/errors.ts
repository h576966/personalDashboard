import { NextResponse } from "next/server";

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
  return NextResponse.json({ error: { message, code } }, { status });
}
