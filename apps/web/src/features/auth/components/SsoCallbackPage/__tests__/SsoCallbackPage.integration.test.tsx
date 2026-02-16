import { SsoCallbackPage } from "@/features/auth/components/SsoCallbackPage/SsoCallbackPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { ssoCallbackMutate, confirmSsoLinkMutate } = vi.hoisted(() => ({
  ssoCallbackMutate: vi.fn(),
  confirmSsoLinkMutate: vi.fn(),
}));

vi.mock("@/api/trpc", () => ({
  trpc: {
    auth: {
      ssoCallback: { mutate: ssoCallbackMutate },
      confirmSsoLink: { mutate: confirmSsoLinkMutate },
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
    autoComplete,
    readOnly,
  }: {
    onChange?: (value: unknown) => void;
    value?: string;
    id?: string;
    type?: string;
    autoComplete?: string;
    readOnly?: boolean;
  }) => (
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      readOnly={readOnly}
      value={value ?? ""}
      onChange={(event) => onChange?.(event)}
    />
  ),
}));

const renderCallbackPage = (entry: string) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/auth/sso/callback" element={<SsoCallbackPage />} />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("SsoCallbackPage integration", () => {
  beforeEach(() => {
    ssoCallbackMutate.mockResolvedValue({ userId: "u1" });
    confirmSsoLinkMutate.mockResolvedValue({ userId: "u1" });
  });

  afterEach(() => {
    cleanup();
    ssoCallbackMutate.mockReset();
    confirmSsoLinkMutate.mockReset();
  });

  it("shows an error when callback params are missing", async () => {
    renderCallbackPage("/auth/sso/callback");

    expect(await screen.findByText("Invalid single sign-on response.")).toBeInTheDocument();
  });

  it("submits callback code/state and navigates on success", async () => {
    renderCallbackPage("/auth/sso/callback?code=abc&state=state123");

    await waitFor(() => {
      expect(ssoCallbackMutate).toHaveBeenCalledWith({ code: "abc", state: "state123" });
    });
    expect(await screen.findByText("home-page")).toBeInTheDocument();
  });

  it("prompts for password when linking confirmation is required", async () => {
    ssoCallbackMutate.mockResolvedValue({
      requiresLinkConfirmation: true,
      linkToken: "token-123",
      email: "reader@example.com",
      provider: "oidc",
    });

    renderCallbackPage("/auth/sso/callback?code=abc&state=state123");

    expect(
      await screen.findByText(
        "Confirm your existing account password to link single sign-on for reader@example.com.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

    await waitFor(() => {
      expect(confirmSsoLinkMutate).toHaveBeenCalledWith({
        linkToken: "token-123",
        password: "password123",
      });
    });
    expect(await screen.findByText("home-page")).toBeInTheDocument();
  });

  it("renders provider error message from callback params", async () => {
    renderCallbackPage("/auth/sso/callback?error=access_denied&error_description=Access%20denied");

    expect(await screen.findByText("Access denied")).toBeInTheDocument();
  });
});
