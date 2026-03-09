import { describe, it, expect } from "vitest";
import { friendlyAuthError } from "./auth-errors";

describe("friendlyAuthError", () => {
  it("maps error.code to friendly message", () => {
    expect(friendlyAuthError({ code: "invalid_credentials" })).toBe(
      "Incorrect email or password."
    );
    expect(friendlyAuthError({ code: "user_already_exists" })).toBe(
      "An account with that email already exists."
    );
    expect(friendlyAuthError({ code: "weak_password" })).toBe(
      "Password must be at least 6 characters."
    );
    expect(friendlyAuthError({ code: "email_not_confirmed" })).toBe(
      "Please verify your email before signing in."
    );
    expect(friendlyAuthError({ code: "over_request_rate_limit" })).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("maps error.message to friendly message when code is missing", () => {
    expect(friendlyAuthError({ message: "Invalid login credentials" })).toBe(
      "Incorrect email or password."
    );
    expect(friendlyAuthError({ message: "User already registered" })).toBe(
      "An account with that email already exists."
    );
  });

  it("prefers code over message", () => {
    expect(
      friendlyAuthError({
        code: "invalid_credentials",
        message: "some other message",
      })
    ).toBe("Incorrect email or password.");
  });

  it("returns generic message for unknown errors", () => {
    expect(friendlyAuthError({ code: "unknown_code" })).toBe(
      "Something went wrong. Please try again."
    );
    expect(friendlyAuthError({ message: "Something unexpected" })).toBe(
      "Something went wrong. Please try again."
    );
    expect(friendlyAuthError({})).toBe(
      "Something went wrong. Please try again."
    );
  });
});
