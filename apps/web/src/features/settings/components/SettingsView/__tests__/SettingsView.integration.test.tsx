import { SettingsView } from "@/features/settings/components/SettingsView/SettingsView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ButtonHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { updateProfileMutate, changePasswordMutate } = vi.hoisted(() => ({
  updateProfileMutate: vi.fn(),
  changePasswordMutate: vi.fn(),
}));

vi.mock("@/api/trpc", () => ({
  trpc: {
    library: {
      updateProfile: { mutate: updateProfileMutate },
    },
    auth: {
      changePassword: { mutate: changePasswordMutate },
    },
  },
}));

vi.mock("@/ui/Button", () => ({
  Button: (props: ButtonHTMLAttributes<HTMLButtonElement> & { isDisabled?: boolean }) => (
    <button
      type={props.type ?? "button"}
      disabled={props.isDisabled}
      className={props.className}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
}));

vi.mock("@/ui/InputBase", () => ({
  InputBase: ({
    onChange,
    value,
    id,
    type = "text",
    isDisabled,
  }: {
    onChange?: (value: unknown) => void;
    value?: string;
    id?: string;
    type?: string;
    isDisabled?: boolean;
  }) => (
    <input
      id={id}
      type={type}
      value={value ?? ""}
      disabled={isDisabled}
      onChange={(event) => onChange?.(event)}
    />
  ),
}));

const me = {
  id: "user-id",
  email: "reader@example.com",
  displayName: "Reader",
  collectionVisibility: "private" as const,
};

const renderSettingsView = () => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsView me={me} />
    </QueryClientProvider>,
  );
};

describe("SettingsView integration", () => {
  afterEach(() => {
    cleanup();
    updateProfileMutate.mockReset();
    changePasswordMutate.mockReset();
  });

  it("submits profile updates", async () => {
    updateProfileMutate.mockResolvedValue({ id: me.id });

    renderSettingsView();

    fireEvent.change(screen.getByLabelText("Display Name"), { target: { value: "New Name" } });
    fireEvent.change(screen.getByLabelText("Collection Visibility"), {
      target: { value: "public" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(updateProfileMutate).toHaveBeenCalledWith({
        displayName: "New Name",
        collectionVisibility: "public",
      });
    });
  });

  it("shows validation for mismatched password confirmation", async () => {
    changePasswordMutate.mockResolvedValue({ ok: true });

    renderSettingsView();
    const passwordCard = screen.getByRole("heading", { name: "Password" }).closest("article");
    if (!passwordCard) {
      throw new Error("Password section not found");
    }

    fireEvent.change(within(passwordCard).getByLabelText("Current Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(within(passwordCard).getByLabelText("New Password"), {
      target: { value: "newpassword123" },
    });
    fireEvent.change(within(passwordCard).getByLabelText("Confirm Password"), {
      target: { value: "different123" },
    });

    fireEvent.click(within(passwordCard).getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText("New password and confirmation must match."),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations on initial render", async () => {
    const { container } = renderSettingsView();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
