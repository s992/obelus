import { coverFallback, coverLarge, coverThumb } from "./BookCover.css";

export const BookCover = ({
  coverUrl,
  title,
  size = "S",
}: {
  coverUrl?: string | null;
  title: string;
  size?: "S" | "M" | "L";
}) => {
  const src = coverUrl ?? null;
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
