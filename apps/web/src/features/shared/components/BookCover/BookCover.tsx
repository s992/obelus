import { coverFallback, coverLarge, coverThumb } from "./BookCover.css";

const coverDimensionsBySize = {
  S: { width: 48, height: 72 },
  M: { width: 48, height: 72 },
  L: { width: 112, height: 164 },
} as const;

export const BookCover = ({
  coverUrl,
  title,
  size = "S",
  pixelWidth,
  pixelHeight,
  sizes,
  srcSet,
}: {
  coverUrl?: string | null;
  title: string;
  size?: "S" | "M" | "L";
  pixelWidth?: number;
  pixelHeight?: number;
  sizes?: string;
  srcSet?: string;
}) => {
  const src = coverUrl ?? null;
  const sizeDimensions = coverDimensionsBySize[size];
  const width = pixelWidth ?? sizeDimensions.width;
  const height = pixelHeight ?? sizeDimensions.height;
  const resolvedSizes = sizes ?? (size === "L" ? "112px" : "48px");

  if (!src) {
    return <div className={coverFallback}>No cover</div>;
  }

  return (
    <img
      className={size === "L" ? coverLarge : coverThumb}
      src={src}
      alt={`Cover for ${title}`}
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      sizes={resolvedSizes}
      srcSet={srcSet}
    />
  );
};
