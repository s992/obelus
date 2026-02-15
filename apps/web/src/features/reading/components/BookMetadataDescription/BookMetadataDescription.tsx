import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import * as styles from "./BookMetadataDescription.css";

export type BookMetadataDescriptionProps = {
  description: string;
  isExpanded: boolean;
  isLong: boolean;
  onToggleExpanded: () => void;
};

export const BookMetadataDescription = ({
  description,
  isExpanded,
  isLong,
  onToggleExpanded,
}: BookMetadataDescriptionProps) => {
  const normalizedDescription = normalizeMarkdownReferences(description);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isExpandable, setIsExpandable] = useState(isLong);

  useEffect(() => {
    if (!isLong || !description.trim() || !contentRef.current) {
      setIsExpandable(false);
      return;
    }
    const element = contentRef.current;
    setIsExpandable(element.scrollHeight > element.clientHeight + 1);
  }, [description, isLong]);

  return (
    <>
      <div
        ref={contentRef}
        className={isExpanded ? styles.markdownRoot : styles.markdownRootCollapsed}
        data-testid="book-metadata-description"
      >
        <ReactMarkdown
          components={{
            a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" />,
          }}
        >
          {normalizedDescription}
        </ReactMarkdown>
      </div>
      {isExpandable ? (
        <button
          aria-expanded={isExpanded}
          className={styles.expandButton}
          type="button"
          onClick={onToggleExpanded}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </>
  );
};

const normalizeMarkdownReferences = (markdown: string): string => {
  const referenceTailMatch = markdown.match(/(\s+\[[^\]]+\]:\s*https?:\/\/\S+)+\s*$/);
  if (!referenceTailMatch || referenceTailMatch.index === undefined) {
    return markdown;
  }

  const referenceBlock = referenceTailMatch[0]
    .trim()
    .replace(/\s+(?=\[[^\]]+\]:\s*https?:\/\/\S+)/g, "\n");
  const content = markdown.slice(0, referenceTailMatch.index).trimEnd();
  if (!content) {
    return markdown;
  }
  return `${content}\n\n${referenceBlock}`;
};
