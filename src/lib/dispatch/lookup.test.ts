import { describe, expect, it } from "vitest";
import { identifierKind, isDispatchRole, phoneDigits } from "./lookup";

describe("fleet directory access rule", () => {
  it("opens only to dispatch-capable roles", () => {
    expect(isDispatchRole(["dispatcher"])).toBe(true);
    expect(isDispatchRole(["security_company"])).toBe(true);
    expect(isDispatchRole(["admin"])).toBe(true);
    expect(isDispatchRole(["official"])).toBe(true);
  });

  it("stays closed to everyone else", () => {
    expect(isDispatchRole([])).toBe(false);
    expect(isDispatchRole(["civilian"])).toBe(false);
    expect(isDispatchRole(["patroller", "employee"])).toBe(false);
    expect(isDispatchRole(["guardian", "family_member"])).toBe(false);
  });
});

describe("directory search field", () => {
  it("accepts a full email address", () => {
    expect(identifierKind("thabo@example.com")).toBe("email");
    expect(identifierKind("  THabo@Example.COM ")).toBe("email");
  });

  it("rejects a half-typed address", () => {
    expect(identifierKind("thabo@")).toBe("invalid");
    expect(identifierKind("thabo@example")).toBe("invalid");
    expect(identifierKind("")).toBe("invalid");
  });

  it("accepts a phone number with at least 7 digits, punctuation allowed", () => {
    expect(identifierKind("+27 82 555 0123")).toBe("phone");
    expect(identifierKind("0825550123")).toBe("phone");
    expect(phoneDigits("+27 82 555 0123")).toBe("27825550123");
  });

  it("rejects short numbers and plain words", () => {
    expect(identifierKind("2782")).toBe("invalid");
    expect(identifierKind("abc")).toBe("invalid");
    expect(identifierKind("thabo")).toBe("invalid");
  });
});
