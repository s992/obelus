import { format, isValid, parseISO } from "date-fns";

const legacyUtcMidnightPattern = /T00:00:00(?:\.000)?Z$/;

const isLegacyUtcMidnight = (value: string) => legacyUtcMidnightPattern.test(value);

const toUtcDateLabel = (value: string) => {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

export const toDate = (value: string | null) => {
  if (!value) return "-";
  if (isLegacyUtcMidnight(value)) {
    return toUtcDateLabel(value);
  }
  const date = new Date(value);
  return isValid(date) ? format(date, "yyyy-MM-dd") : "-";
};

export const toDateInputValue = (value: string | null | undefined) =>
  value
    ? (() => {
        if (isLegacyUtcMidnight(value)) {
          return toUtcDateLabel(value);
        }
        const date = new Date(value);
        return isValid(date) ? format(date, "yyyy-MM-dd") : "";
      })()
    : "";

export const toIsoFromLocalDateInput = (value: string): string => {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return new Date(value).toISOString();
  }
  return new Date(year, month - 1, day).toISOString();
};

export const toPublishedYear = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const inlineYearMatch = normalized.match(/\b(\d{4})\b/);
  if (inlineYearMatch?.[1]) {
    return inlineYearMatch[1];
  }

  const parsedIso = parseISO(normalized);
  if (isValid(parsedIso)) {
    return format(parsedIso, "yyyy");
  }

  const parsedDate = new Date(normalized);
  if (isValid(parsedDate)) {
    return format(parsedDate, "yyyy");
  }

  return null;
};

export const toPublishedLabel = (value: string | null | undefined) => {
  const year = toPublishedYear(value);
  return year ? `Published ${year}` : null;
};

export const toPublishedYearLabel = (value: number | null | undefined) =>
  value ? `Published ${value}` : null;

export const fallbackTitle = (bookKey: string) =>
  bookKey.split("/").filter(Boolean).pop() ?? bookKey;
