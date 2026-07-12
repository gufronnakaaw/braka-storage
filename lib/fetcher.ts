import { parseApiResponse } from "./api/errors";

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return parseApiResponse<T>(res);
}
