import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";

export function toastSuccess(message: string) {
  toast.success(message);
}

export function toastError(err: unknown, fallback = "Something went wrong") {
  const message =
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : fallback;
  toast.error(message);
}

export function toastWarning(message: string) {
  toast.warning(message);
}
