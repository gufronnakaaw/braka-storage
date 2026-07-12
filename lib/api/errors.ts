export class ApiError extends Error {
  status: number;
  errors: unknown | null;

  constructor(
    name: string,
    message: string,
    status: number,
    errors: unknown | null = null,
  ) {
    super(message);
    this.name = name;
    this.status = status;
    this.errors = errors;
  }
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: { name: string; message: string; errors?: unknown };
  };
  if (!json.success || !json.data) {
    throw new ApiError(
      json.error?.name ?? "ApiError",
      json.error?.message ?? "Something went wrong",
      res.status,
      json.error?.errors ?? null,
    );
  }
  return json.data;
}
