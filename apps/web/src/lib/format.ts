export const toDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : "-";

export const toDateInputValue = (value: string | null | undefined) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export const toPublishedLabel = (value: string | null | undefined) =>
  value ? `Published ${value}` : null;

export const toPublishedYearLabel = (value: number | null | undefined) =>
  value ? `Published ${value}` : null;

export const fallbackTitle = (bookKey: string) =>
  bookKey.split("/").filter(Boolean).pop() ?? bookKey;
