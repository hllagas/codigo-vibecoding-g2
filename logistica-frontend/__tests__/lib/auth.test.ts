import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth";

describe("lib/auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── getAccessToken ─────────────────────────────────────────────────────────
  describe("getAccessToken", () => {
    it("returns null when key is absent", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("returns the stored value", () => {
      localStorage.setItem("access_token", "acc-token");
      expect(getAccessToken()).toBe("acc-token");
    });

    it("returns null when window is undefined (SSR guard)", () => {
      vi.stubGlobal("window", undefined);
      expect(getAccessToken()).toBeNull();
    });
  });

  // ── getRefreshToken ────────────────────────────────────────────────────────
  describe("getRefreshToken", () => {
    it("returns null when key is absent", () => {
      expect(getRefreshToken()).toBeNull();
    });

    it("returns the stored value", () => {
      localStorage.setItem("refresh_token", "ref-token");
      expect(getRefreshToken()).toBe("ref-token");
    });

    it("returns null when window is undefined (SSR guard)", () => {
      vi.stubGlobal("window", undefined);
      expect(getRefreshToken()).toBeNull();
    });
  });

  // ── setTokens ──────────────────────────────────────────────────────────────
  describe("setTokens", () => {
    it("writes both access and refresh to localStorage", () => {
      setTokens({ access: "a", refresh: "r" });
      expect(localStorage.getItem("access_token")).toBe("a");
      expect(localStorage.getItem("refresh_token")).toBe("r");
    });

    it("overwrites previously stored tokens", () => {
      localStorage.setItem("access_token", "old-a");
      localStorage.setItem("refresh_token", "old-r");
      setTokens({ access: "new-a", refresh: "new-r" });
      expect(localStorage.getItem("access_token")).toBe("new-a");
      expect(localStorage.getItem("refresh_token")).toBe("new-r");
    });

    it("is a no-op when window is undefined (SSR guard)", () => {
      vi.stubGlobal("window", undefined);
      expect(() => setTokens({ access: "a", refresh: "r" })).not.toThrow();
    });
  });

  // ── clearTokens ────────────────────────────────────────────────────────────
  describe("clearTokens", () => {
    it("removes both keys from localStorage", () => {
      localStorage.setItem("access_token", "a");
      localStorage.setItem("refresh_token", "r");
      clearTokens();
      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
    });

    it("does not throw when keys are absent", () => {
      expect(() => clearTokens()).not.toThrow();
    });

    it("is a no-op when window is undefined (SSR guard)", () => {
      vi.stubGlobal("window", undefined);
      expect(() => clearTokens()).not.toThrow();
    });
  });

  // ── isAuthenticated (derived via getAccessToken) ───────────────────────────
  describe("isAuthenticated (derived)", () => {
    it("truthy when access token is present", () => {
      localStorage.setItem("access_token", "valid-token");
      expect(!!getAccessToken()).toBe(true);
    });

    it("false when no access token is stored", () => {
      expect(!!getAccessToken()).toBe(false);
    });

    it("false when access token is empty string", () => {
      localStorage.setItem("access_token", "");
      expect(!!getAccessToken()).toBe(false);
    });

    it("false after clearTokens removes the token", () => {
      localStorage.setItem("access_token", "was-valid");
      clearTokens();
      expect(!!getAccessToken()).toBe(false);
    });
  });
});
