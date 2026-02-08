import { coverFallback, coverLarge, coverThumb } from "./BookCover.css";

const coverUrl = (coverId: number | null | undefined, size: "S" | "M" | "L" = "M") => {
  if (!coverId) {
    return null;
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};

export const BookCover = ({
  coverId,
  title,
  size = "S",
}: {
  coverId: number | null | undefined;
  title: string;
  size?: "S" | "M" | "L";
}) => {
  const src = coverUrl(coverId, size);
  if (!src) {
    return <div className={coverFallback}>No cover</div>;
  }

  return (
    <img
      className={size === "L" ? coverLarge : coverThumb}
      src={src}
      alt={`Cover for ${title}`}
      loading="lazy"
    />
  );
};
