import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  patchWarehouse,
  deleteWarehouse,
  getWarehouseStock,
} from "@/services/warehouseService";
import type { Warehouse, WarehouseStock } from "@/types/warehouse";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Central Warehouse",
  address: "Av. Industrial 100",
  city: "Lima",
  country: "Peru",
  latitude: "-12.046374",
  longitude: "-77.042793",
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

describe("warehouseService", () => {
  describe("listWarehouses", () => {
    it("GETs /warehouses/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPage))
      );
      const result = await listWarehouses();
      expect(result).toEqual(mockPage);
    });

    it("passes search param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/warehouses/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listWarehouses({ search: "central" });
      expect(capturedUrl).toContain("search=central");
    });

    it("passes page and is_active params", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/warehouses/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listWarehouses({ page: 3, is_active: false });
      expect(capturedUrl).toContain("page=3");
      expect(capturedUrl).toContain("is_active=false");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/warehouses/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listWarehouses()).rejects.toThrow();
    });
  });

  describe("getWarehouse", () => {
    it("GETs /warehouses/:id/ and returns Warehouse", async () => {
      server.use(
        http.get(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse))
      );
      const result = await getWarehouse(1);
      expect(result).toEqual(mockWarehouse);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/warehouses/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getWarehouse(999)).rejects.toThrow();
    });
  });

  describe("createWarehouse", () => {
    it("POSTs to /warehouses/ and returns created Warehouse", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/warehouses/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockWarehouse, { status: 201 });
        })
      );
      const result = await createWarehouse(minimalPayload);
      expect(result).toEqual(mockWarehouse);
      expect(capturedBody).toEqual(minimalPayload);
    });

    it("propagates 400 validation error", async () => {
      server.use(
        http.post(`${BASE}/warehouses/`, () =>
          HttpResponse.json({ name: ["This field is required"] }, { status: 400 })
        )
      );
      await expect(createWarehouse(minimalPayload)).rejects.toThrow();
    });
  });

  describe("updateWarehouse", () => {
    it("PUTs to /warehouses/:id/ and returns updated Warehouse", async () => {
      server.use(
        http.put(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse))
      );
      const result = await updateWarehouse(1, minimalPayload);
      expect(result).toEqual(mockWarehouse);
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.put(`${BASE}/warehouses/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(updateWarehouse(999, minimalPayload)).rejects.toThrow();
    });
  });

  describe("patchWarehouse", () => {
    it("PATCHes /warehouses/:id/ and returns updated Warehouse", async () => {
      server.use(
        http.patch(`${BASE}/warehouses/1/`, () =>
          HttpResponse.json({ ...mockWarehouse, is_active: false })
        )
      );
      const result = await patchWarehouse(1, { is_active: false });
      expect(result.is_active).toBe(false);
    });
  });

  describe("deleteWarehouse", () => {
    it("DELETEs /warehouses/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/warehouses/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteWarehouse(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/warehouses/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteWarehouse(999)).rejects.toThrow();
    });
  });

  describe("getWarehouseStock", () => {
    it("GETs /warehouses/:id/stock/ and returns PaginatedResponse<WarehouseStock>", async () => {
      const mockStock: PaginatedResponse<WarehouseStock> = {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 10, warehouse: 1, product: 5, quantity: 200, updated_at: "2024-01-01T00:00:00Z" }],
      };
      server.use(
        http.get(`${BASE}/warehouses/1/stock/`, () => HttpResponse.json(mockStock))
      );
      const result = await getWarehouseStock(1);
      expect(result).toEqual(mockStock);
    });

    it("propagates 404 for unknown warehouse", async () => {
      server.use(
        http.get(`${BASE}/warehouses/999/stock/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getWarehouseStock(999)).rejects.toThrow();
    });
  });
});
