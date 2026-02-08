import * as styles from "./status.css";

export const statusClassName = (status: "Accepted" | "Rejected" | "Reading" | "Unjudged") => {
  if (status === "Accepted") return styles.acceptedBadge;
  if (status === "Rejected") return styles.rejectedBadge;
  if (status === "Unjudged") return styles.unjudgedBadge;
  return styles.readingBadge;
};
