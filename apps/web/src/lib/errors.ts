const fallbackMessage = "Something went wrong. Please try again.";

const messageByCode: Record<string, string> = {
  UNAUTHORIZED: "You are not authorized for this action.",
  FORBIDDEN: "Security check failed. Refresh and try again.",
  CONFLICT: "This value is already in use.",
  PRECONDITION_FAILED: "This action is not available right now.",
};

export const getErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return fallbackMessage;
  }

  if ("data" in error && error.data && typeof error.data === "object") {
    const data = error.data as { code?: unknown };
    if (typeof data.code === "string" && messageByCode[data.code]) {
      return messageByCode[data.code] ?? fallbackMessage;
    }
  }

  if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
    return fallbackMessage;
  }

  return fallbackMessage;
};
