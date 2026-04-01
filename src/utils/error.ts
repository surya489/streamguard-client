export class ApiRequestError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

function fallbackMessage(status: number): string {
  if (status === 400) return "Request could not be processed. Please check the form details.";
  if (status === 401) return "Your session is invalid or expired. Please login again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Requested data was not found.";
  if (status === 409) return "This action conflicts with existing data.";
  if (status === 413) return "Uploaded file is too large.";
  if (status === 422) return "Validation failed. Please verify your input.";
  if (status >= 500) return "Server is temporarily unavailable. Please try again shortly.";
  return "Something went wrong. Please try again.";
}

function messageLooksSafe(message: string): boolean {
  const lower = message.toLowerCase();
  if (lower.includes("exception") || lower.includes("stack") || lower.includes("mongodb")) return false;
  if (lower.includes("sql") || lower.includes("ecast") || lower.includes("trace")) return false;
  return message.trim().length >= 4 && message.trim().length <= 120;
}

export function getApiErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage && messageLooksSafe(serverMessage)) {
    return serverMessage;
  }
  return fallbackMessage(status);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
}
