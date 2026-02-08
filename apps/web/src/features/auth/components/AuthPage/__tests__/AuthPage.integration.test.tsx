import { AuthPage } from "@/features/auth/components/AuthPage/AuthPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const { registerMutate, loginMutate } = vi.hoisted(() => ({
  registerMutate: vi.fn(),
  loginMutate: vi.fn(),
}));

vi.mock("@/api/trpc", () => ({
  trpc: {
    auth: {
      registerWithPassword: { mutate: registerMutate },
      loginWithPassword: { mutate: loginMutate },
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
  }: {
    onChange?: (value: unknown) => void;
    value?: string;
    id?: string;
    type?: string;
  }) => <input id={id} type={type} value={value ?? ""} onChange={(event) => onChange?.(event)} />,
}));

const renderAuthPage = () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe("AuthPage integration", () => {
  afterEach(() => {
    cleanup();
    registerMutate.mockReset();
    loginMutate.mockReset();
  });

  it("shows validation errors for empty register submission", async () => {
    registerMutate.mockResolvedValue({ userId: "u1" });

    renderAuthPage();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findAllByText("Required")).toHaveLength(2);
  });

  it("submits register form with displayName fallback", async () => {
    registerMutate.mockResolvedValue({ userId: "u1" });

    renderAuthPage();

    const registerCard = screen.getByRole("heading", { name: "Create account" }).closest("article");
    if (!registerCard) {
      throw new Error("Register card not found");
    }

    fireEvent.change(within(registerCard).getByLabelText("Email"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.change(within(registerCard).getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(within(registerCard).getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(registerMutate).toHaveBeenCalledWith({
        email: "reader@example.com",
        password: "password123",
        displayName: "reader@example.com",
      });
    });
  });
});
