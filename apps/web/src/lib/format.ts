const legacyUtcMidnightPattern = /T00:00:00(?:\.000)?Z$/;

const isLegacyUtcMidnight = (value: string) => legacyUtcMidnightPattern.test(value);

export const toDate = (value: string | null) => {
  if (!value) return "-";
  if (isLegacyUtcMidnight(value)) {
    return new Intl.DateTimeFormat(undefined, { timeZone: "UTC" }).format(new Date(value));
  }
  return new Date(value).toLocaleDateString();
};

export const toDateInputValue = (value: string | null | undefined) =>
  value
    ? (() => {
        const date = new Date(value);
        if (isLegacyUtcMidnight(value)) {
          return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

export const toPublishedLabel = (value: string | null | undefined) =>
  value ? `Published ${value}` : null;

export const toPublishedYearLabel = (value: number | null | undefined) =>
  value ? `Published ${value}` : null;

export const fallbackTitle = (bookKey: string) =>
  bookKey.split("/").filter(Boolean).pop() ?? bookKey;
