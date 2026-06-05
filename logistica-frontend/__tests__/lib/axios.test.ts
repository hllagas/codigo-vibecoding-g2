/**
 * Tests for the Axios instance (lib/api.ts) interceptors.
 *
 * Strategy:
 * - vi.resetModules() in beforeEach gives each test a fresh api module so
 *   the module-level `isRefreshing` / `pendingRequests` state never leaks.
 * - Auth state is controlled via the real localStorage (no vi.mock).
 * - window.location is mocked with a COMPLETE location-like object so jsdom's
 *   XHR security checks keep working (a plain {href:""} stub breaks XHR).
 * - Redirect assertions check the mock's .href property.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setTokens, getAccessToken, getRefreshToken } from "@/lib/auth";

const BASE = "http://localhost:8000/api/v1";
const ORIGIN = "http://localhost:3000";

type ApiInstance = Awaited<typeof import("@/lib/api")>["default"];

// Build a full location mock that satisfies jsdom's XHR same-origin checks.
function makeFakeLocation(href = ORIGIN + "/") {
  const url = new URL(href);
  const loc = {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    assign: (_u: string) => { loc.href = _u; },
    replace: (_u: string) => { loc.href = _u; },
    reload: () => {},
    toString: () => loc.href,
  };
  return loc;
}

let locationMock: ReturnType<typeof makeFakeLocation>;
const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location");

function installLocationMock() {
  locationMock = makeFakeLocation();
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: locationMock,
  });
}

function restoreLocation() {
  if (originalLocationDescriptor) {
    Object.defineProperty(window, "location", originalLocationDescriptor);
  }
}

describe("lib/api interceptors", () => {
  let api: ApiInstance;

  beforeEach(async () => {
    // Fresh module → isRefreshing = false, pendingRequests = []
    vi.resetModules();
    localStorage.clear();
    installLocationMock();
    const mod = await import("@/lib/api");
    api = mod.default;
  });

  afterEach(() => {
    restoreLocation();
  });

  // ── Request interceptor ────────────────────────────────────────────────────
  describe("request interceptor", () => {
    it("attaches Authorization header when access token is present", async () => {
      setTokens({ access: "my-token", refresh: "ref" });

      let capturedHeader: string | null = null;
      server.use(
        http.get(`${BASE}/items/`, ({ request }) => {
          capturedHeader = request.headers.get("authorization");
          return HttpResponse.json({ ok: true });
        })
      );

      await api.get("/items/");
      expect(capturedHeader).toBe("Bearer my-token");
    });

    it("omits Authorization header when no access token", async () => {
      let capturedHeader: string | null = "initially-present";
      server.use(
        http.get(`${BASE}/items/`, ({ request }) => {
          capturedHeader = request.headers.get("authorization");
          return HttpResponse.json({ ok: true });
        })
      );

      await api.get("/items/");
      expect(capturedHeader).toBeNull();
    });
  });

  // ── Response interceptor — 401 handling ───────────────────────────────────
  describe("response interceptor — 401 handling", () => {
    it("refreshes token, saves new tokens, and retries original request on 401", async () => {
      setTokens({ access: "old-access", refresh: "valid-refresh" });

      let requestCount = 0;
      let lastAuthHeader: string | null = null;

      server.use(
        http.get(`${BASE}/protected/`, ({ request }) => {
          requestCount++;
          lastAuthHeader = request.headers.get("authorization");
          if (requestCount === 1) {
            return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
          }
          return HttpResponse.json({ data: "secret" });
        }),
        http.post(`${BASE}/auth/token/refresh/`, () => {
          return HttpResponse.json({ access: "new-access-token" });
        })
      );

      const response = await api.get("/protected/");

      expect(response.data).toEqual({ data: "secret" });
      expect(requestCount).toBe(2);
      expect(lastAuthHeader).toBe("Bearer new-access-token");
      expect(getAccessToken()).toBe("new-access-token");
      expect(getRefreshToken()).toBe("valid-refresh");
    });

    it("clears tokens and redirects to /login when no refresh token on 401", async () => {
      localStorage.setItem("access_token", "access"); // no refresh token

      server.use(
        http.get(`${BASE}/protected/`, () => {
          return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
        })
      );

      await expect(api.get("/protected/")).rejects.toThrow();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(locationMock.href).toBe("/login");
    });

    it("clears tokens and redirects when the refresh request itself fails (401)", async () => {
      setTokens({ access: "access", refresh: "expired-refresh" });

      server.use(
        http.get(`${BASE}/protected/`, () => {
          return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
        }),
        http.post(`${BASE}/auth/token/refresh/`, () => {
          return HttpResponse.json(
            { detail: "Token is invalid or expired" },
            { status: 401 }
          );
        })
      );

      await expect(api.get("/protected/")).rejects.toThrow();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(locationMock.href).toBe("/login");
    });

    it("does not retry more than once — _retry flag prevents infinite loops", async () => {
      setTokens({ access: "access", refresh: "valid-refresh" });

      let requestCount = 0;
      server.use(
        http.get(`${BASE}/always-401/`, () => {
          requestCount++;
          return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
        }),
        http.post(`${BASE}/auth/token/refresh/`, () => {
          return HttpResponse.json({ access: "new-access-token" });
        })
      );

      await expect(api.get("/always-401/")).rejects.toThrow();

      // First attempt + one retry = 2 total; _retry flag stops further loops
      expect(requestCount).toBe(2);
    });
  });
});
