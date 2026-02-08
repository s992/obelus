export const normalizeInputValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    if (
      "currentTarget" in value &&
      value.currentTarget &&
      typeof value.currentTarget === "object" &&
      "value" in value.currentTarget &&
      typeof value.currentTarget.value === "string"
    ) {
      return value.currentTarget.value;
    }
    if (
      "target" in value &&
      value.target &&
      typeof value.target === "object" &&
      "value" in value.target &&
      typeof value.target.value === "string"
    ) {
      return value.target.value;
    }
  }
  return "";
};

export const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (value && typeof value === "object" && "value" in value && typeof value.value === "string") {
    const normalized = value.value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  return null;
};

export const normalizeOptionalNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const normalizeOptionalIsbn13 = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const normalized = normalizeOptionalString(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }
  return normalizeOptionalString(value);
};

export const normalizeBookKeyFromParam = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  if (!decoded.trim()) {
    return null;
  }

  return decoded.startsWith("/") ? decoded : `/${decoded}`;
};
