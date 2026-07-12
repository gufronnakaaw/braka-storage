import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status_code = 200) {
  return NextResponse.json(
    { success: true, status_code, data },
    { status: status_code }
  );
}

export function apiError(
  name: string,
  message: string,
  status_code = 500,
  errors: unknown | null = null
) {
  return NextResponse.json(
    { success: false, status_code, error: { name, message, errors } },
    { status: status_code }
  );
}
