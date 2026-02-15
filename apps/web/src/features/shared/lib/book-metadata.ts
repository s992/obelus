import { toPublishedYear } from "@/lib/format";
import {
  normalizeOptionalIsbn13,
  normalizeOptionalNumber,
  normalizeOptionalString,
} from "@/lib/normalize";

export const METADATA_DESCRIPTION_COLLAPSE_LENGTH = 280;

export const statusLabel = (entry: {
  finishedAt: string | null;
  judgment: "Accepted" | "Rejected" | null;
}): "Accepted" | "Rejected" | "Reading" | "Unjudged" => {
  if (entry.judgment === "Accepted") return "Accepted";
  if (entry.judgment === "Rejected") return "Rejected";
  if (entry.finishedAt) return "Unjudged";
  return "Reading";
};

export const detailMetadataFromRaw = (detail: Record<string, unknown> | null) => {
  if (!detail) {
    return {
      firstPublished: null as string | null,
      pages: null as string | null,
      isbn: null as string | null,
      descriptionText: null as string | null,
    };
  }

  const firstPublished = toPublishedYear(
    normalizeOptionalString(detail.first_publish_date) ??
      normalizeOptionalString(detail.first_publish_year) ??
      normalizeOptionalString(detail.publishDate),
  );
  const pagesNumber = normalizeOptionalNumber(detail.number_of_pages);
  const pages = pagesNumber ? `${pagesNumber}` : null;
  const isbn = normalizeOptionalIsbn13(detail.isbn_13);
  const description =
    normalizeOptionalString(detail.description) ?? normalizeOptionalString(detail.first_sentence);

  return {
    firstPublished,
    pages,
    isbn,
    descriptionText: description,
  };
};
