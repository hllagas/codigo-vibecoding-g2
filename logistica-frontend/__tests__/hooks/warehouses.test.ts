import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useWarehouseStock } from "@/hooks/useWarehouseStock";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  usePatchWarehouse,
  useDeleteWarehouse,
} from "@/hooks/useWarehouseMutations";
import { queryClient } from "@/lib/queryClient";
import type { Warehouse, WarehouseStock } from "@/types/warehouse";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Central Warehouse",
  address: "Av. Industrial 100",
  city: "Lima",
  country: "Peru",
  latitude: null,
  longitude: null,
  capacity: 5000,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Warehouse> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockWarehouse],
};

const minimalPayload = {
  name: "Test WH",
  address: "123 St",
  city: "Lima",
  country: "Peru",
  capacity: 100,
  latitude: null,
  longitude: null,
  is_active: true,
};

describe("warehouse hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useWarehouses ────────────────────────────────────────────────────────────
  describe("useWarehouses", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useWarehouses());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes params to the request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/warehouses/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() =>
        useWarehouses({ city: "Lima", is_active: true })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("city=Lima");
      expect(capturedUrl).toContain("is_active=true");
    });
  });

  // ── useWarehouse ─────────────────────────────────────────────────────────────
  describe("useWarehouse", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useWarehouse(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns warehouse when id is provided", async () => {
      server.use(
        http.get(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse))
      );
      const { result } = renderHookWithQuery(() => useWarehouse(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockWarehouse);
    });
  });

  // ── useWarehouseStock ────────────────────────────────────────────────────────
  describe("useWarehouseStock", () => {
    it("stays idle when warehouseId is null", () => {
      const { result } = renderHookWithQuery(() => useWarehouseStock(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches stock when warehouseId is provided", async () => {
      const mockStock: PaginatedResponse<WarehouseStock> = {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 10, warehouse: 1, product: 5, quantity: 200, updated_at: "2024-01-01T00:00:00Z" }],
      };
      server.use(
        http.get(`${BASE}/warehouses/1/stock/`, () => HttpResponse.json(mockStock))
      );
      const { result } = renderHookWithQuery(() => useWarehouseStock(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockStock);
    });
  });

  // ── useCreateWarehouse ───────────────────────────────────────────────────────
  describe("useCreateWarehouse", () => {
    it("mutates and invalidates ['warehouses']", async () => {
      server.use(
        http.post(`${BASE}/warehouses/`, async () =>
          HttpResponse.json(mockWarehouse, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateWarehouse());

      result.current.mutate(minimalPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] });
    });
  });

  // ── useUpdateWarehouse ───────────────────────────────────────────────────────
  describe("useUpdateWarehouse", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateWarehouse());

      result.current.mutate({ id: 1, data: minimalPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses", 1] });
    });
  });

  // ── usePatchWarehouse ────────────────────────────────────────────────────────
  describe("usePatchWarehouse", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/warehouses/1/`, () =>
          HttpResponse.json({ ...mockWarehouse, is_active: false })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchWarehouse());

      result.current.mutate({ id: 1, data: { is_active: false } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses", 1] });
    });
  });

  // ── useDeleteWarehouse ───────────────────────────────────────────────────────
  describe("useDeleteWarehouse", () => {
    it("mutates and invalidates ['warehouses']", async () => {
      server.use(
        http.delete(`${BASE}/warehouses/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteWarehouse());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] });
    });
  });
});
