import { BookMetadataDescription } from "@/features/reading/components/BookMetadataDescription/BookMetadataDescription";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const markdownDescription =
  "[The Dark Tower][1] II Part II of an epic saga. Roland, the last gunslinger, encounters three mysterious doorways on the beach. Each one enters into a different person living in New York. Through these doorways, Roland draws the companions who will assist him on his quest to save the Dark Tower. ([source][2]) [1]: https://hardcover.app/books/the-dark-tower-the-drawing-of-the-three [2]: https://stephenking.com/library/novel/dark_tower_the_drawing_of_the_three_the.html";

describe("BookMetadataDescription", () => {
  it("renders markdown links with safe external link attributes", () => {
    render(
      <BookMetadataDescription
        description={markdownDescription}
        isExpanded
        isLong={false}
        onToggleExpanded={() => {}}
      />,
    );

    const primaryLink = screen.getByRole("link", { name: "The Dark Tower" });
    expect(primaryLink).toHaveAttribute(
      "href",
      "https://hardcover.app/books/the-dark-tower-the-drawing-of-the-three",
    );
    expect(primaryLink).toHaveAttribute("target", "_blank");
    expect(primaryLink).toHaveAttribute("rel", "noreferrer noopener");

    const sourceLink = screen.getByRole("link", { name: "source" });
    expect(sourceLink).toHaveAttribute(
      "href",
      "https://stephenking.com/library/novel/dark_tower_the_drawing_of_the_three_the.html",
    );
  });

  it("shows the toggle button for long descriptions and triggers callback", async () => {
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    render(
      <BookMetadataDescription
        description="Long description"
        isExpanded={false}
        isLong
        onToggleExpanded={onToggleExpanded}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Show more" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it("updates toggle label and aria state when expanded", () => {
    render(
      <BookMetadataDescription
        description="Long description"
        isExpanded
        isLong
        onToggleExpanded={() => {}}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Show less" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
