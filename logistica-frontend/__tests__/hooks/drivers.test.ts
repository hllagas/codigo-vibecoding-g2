import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useDrivers } from "@/hooks/useDrivers";
import { useDriver } from "@/hooks/useDriver";
import {
  useCreateDriver,
  useUpdateDriver,
  usePatchDriver,
  useDeleteDriver,
} from "@/hooks/useDriverMutations";
import { queryClient } from "@/lib/queryClient";
import type { Driver } from "@/types/driver";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockDriver: Driver = {
  id: 1,
  user: 10,
  user_detail: { id: 10, username: "jsmith", email: "j@example.com", first_name: "John", last_name: "Smith" },
  license_number: "LIC-001",
  license_expiry: "2026-12-31",
  phone: "+51 987 654 321",
  is_available: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Driver> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockDriver],
};

const minimalPayload = {
  user: 10,
  license_number: "LIC-001",
  license_expiry: "2026-12-31",
  phone: "+51 987 654 321",
  is_available: true,
};

describe("driver hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useDrivers ───────────────────────────────────────────────────────────────
  describe("useDrivers", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useDrivers());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes is_available filter to request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/drivers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() =>
        useDrivers({ is_available: false })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("is_available=false");
    });
  });

  // ── useDriver ────────────────────────────────────────────────────────────────
  describe("useDriver", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useDriver(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns driver when id is provided", async () => {
      server.use(
        http.get(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDriver))
      );
      const { result } = renderHookWithQuery(() => useDriver(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockDriver);
    });
  });

  // ── useCreateDriver ──────────────────────────────────────────────────────────
  describe("useCreateDriver", () => {
    it("mutates and invalidates ['drivers']", async () => {
      server.use(
        http.post(`${BASE}/drivers/`, async () =>
          HttpResponse.json(mockDriver, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateDriver());

      result.current.mutate(minimalPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] });
    });
  });

  // ── useUpdateDriver ──────────────────────────────────────────────────────────
  describe("useUpdateDriver", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDriver))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateDriver());

      result.current.mutate({ id: 1, data: minimalPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers", 1] });
    });
  });

  // ── usePatchDriver ───────────────────────────────────────────────────────────
  describe("usePatchDriver", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/drivers/1/`, () =>
          HttpResponse.json({ ...mockDriver, is_available: false })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchDriver());

      result.current.mutate({ id: 1, data: { is_available: false } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers", 1] });
    });
  });

  // ── useDeleteDriver ──────────────────────────────────────────────────────────
  describe("useDeleteDriver", () => {
    it("mutates and invalidates ['drivers']", async () => {
      server.use(
        http.delete(`${BASE}/drivers/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteDriver());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] });
    });
  });
});
