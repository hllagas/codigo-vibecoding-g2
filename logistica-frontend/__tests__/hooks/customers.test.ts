import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomer } from "@/hooks/useCustomer";
import {
  useCreateCustomer,
  useUpdateCustomer,
  usePatchCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomerMutations";
import { queryClient } from "@/lib/queryClient";
import type { Customer } from "@/types/customer";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockCustomer: Customer = {
  id: 1,
  name: "Acme SA",
  customer_type: "company",
  tax_id: null,
  email: "billing@acme.com",
  phone: null,
  address: null,
  city: "Lima",
  country: "Peru",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCustomer],
};

const minimalPayload = {
  name: "Acme SA",
  customer_type: "company" as const,
  tax_id: null,
  email: "a@b.com",
  phone: null,
  address: null,
  city: "Lima",
  country: "Peru",
  is_active: true,
};

describe("customer hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useCustomers ─────────────────────────────────────────────────────────────
  describe("useCustomers", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useCustomers());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes customer_type filter to request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/customers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() =>
        useCustomers({ customer_type: "individual" })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("customer_type=individual");
    });
  });

  // ── useCustomer ──────────────────────────────────────────────────────────────
  describe("useCustomer", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useCustomer(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns customer when id is provided", async () => {
      server.use(
        http.get(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer))
      );
      const { result } = renderHookWithQuery(() => useCustomer(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockCustomer);
    });
  });

  // ── useCreateCustomer ─────────────────────────────────────────────────────────
  describe("useCreateCustomer", () => {
    it("mutates and invalidates ['customers']", async () => {
      server.use(
        http.post(`${BASE}/customers/`, async () =>
          HttpResponse.json(mockCustomer, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateCustomer());

      result.current.mutate(minimalPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] });
    });
  });

  // ── useUpdateCustomer ─────────────────────────────────────────────────────────
  describe("useUpdateCustomer", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateCustomer());

      result.current.mutate({ id: 1, data: minimalPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["customers", 1] });
    });
  });

  // ── usePatchCustomer ──────────────────────────────────────────────────────────
  describe("usePatchCustomer", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/customers/1/`, () =>
          HttpResponse.json({ ...mockCustomer, is_active: false })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchCustomer());

      result.current.mutate({ id: 1, data: { is_active: false } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["customers", 1] });
    });
  });

  // ── useDeleteCustomer ─────────────────────────────────────────────────────────
  describe("useDeleteCustomer", () => {
    it("mutates and invalidates ['customers']", async () => {
      server.use(
        http.delete(`${BASE}/customers/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteCustomer());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] });
    });
  });
});
