import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupplier } from "@/hooks/useSupplier";
import {
  useCreateSupplier,
  useUpdateSupplier,
  usePatchSupplier,
  useDeleteSupplier,
} from "@/hooks/useSupplierMutations";
import { queryClient } from "@/lib/queryClient";
import type { Supplier } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockSupplier: Supplier = {
  id: 1,
  name: "Acme Corp",
  tax_id: null,
  email: "contact@acme.com",
  phone: null,
  address: null,
  city: "CDMX",
  country: "Mexico",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Supplier> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSupplier],
};

const minimalPayload = {
  name: "Acme",
  email: "a@b.com",
  city: "X",
  country: "Y",
  is_active: true,
  tax_id: null,
  phone: null,
  address: null,
};

describe("supplier hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useSuppliers ────────────────────────────────────────────────────────────
  describe("useSuppliers", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useSuppliers());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes params and returns paginated results", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/suppliers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() =>
        useSuppliers({ page: 2, search: "acme" })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("page=2");
      expect(capturedUrl).toContain("search=acme");
    });

    it("transitions to error state on 4xx", async () => {
      server.use(
        http.get(`${BASE}/suppliers/`, () =>
          HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
        )
      );
      const { result } = renderHookWithQuery(() => useSuppliers());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ── useSupplier ─────────────────────────────────────────────────────────────
  describe("useSupplier", () => {
    it("stays idle (not fetching) when id is null", () => {
      const { result } = renderHookWithQuery(() => useSupplier(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns supplier when id is provided", async () => {
      server.use(
        http.get(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier))
      );
      const { result } = renderHookWithQuery(() => useSupplier(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockSupplier);
    });
  });

  // ── useCreateSupplier ───────────────────────────────────────────────────────
  describe("useCreateSupplier", () => {
    it("mutates and invalidates ['suppliers']", async () => {
      server.use(
        http.post(`${BASE}/suppliers/`, async () =>
          HttpResponse.json(mockSupplier, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateSupplier());

      result.current.mutate(minimalPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] });
    });
  });

  // ── useUpdateSupplier ───────────────────────────────────────────────────────
  describe("useUpdateSupplier", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateSupplier());

      result.current.mutate({ id: 1, data: minimalPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers", 1] });
    });
  });

  // ── usePatchSupplier ────────────────────────────────────────────────────────
  describe("usePatchSupplier", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/suppliers/1/`, () =>
          HttpResponse.json({ ...mockSupplier, is_active: false })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchSupplier());

      result.current.mutate({ id: 1, data: { is_active: false } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers", 1] });
    });
  });

  // ── useDeleteSupplier ───────────────────────────────────────────────────────
  describe("useDeleteSupplier", () => {
    it("mutates and invalidates ['suppliers']", async () => {
      server.use(
        http.delete(`${BASE}/suppliers/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteSupplier());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] });
    });
  });
});
