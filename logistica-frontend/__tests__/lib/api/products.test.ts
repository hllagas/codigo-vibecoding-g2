import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
} from "@/services/productService";
import type { Product } from "@/types/product";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockProduct: Product = {
  id: 1,
  name: "Widget A",
  description: "A widget",
  sku: "WGT-001",
  category: "Electronics",
  unit_price: "10.50",
  weight_kg: "1.500",
  supplier: 2,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Product> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockProduct],
};

const minimalPayload = {
  name: "Widget A",
  description: null,
  sku: "WGT-001",
  category: "Electronics",
  unit_price: "10.50",
  weight_kg: "1.500",
  supplier: null,
  is_active: true,
};

describe("productService", () => {
  describe("listProducts", () => {
    it("GETs /products/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/products/`, () => HttpResponse.json(mockPage))
      );
      const result = await listProducts();
      expect(result).toEqual(mockPage);
    });

    it("passes search param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/products/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listProducts({ search: "widget" });
      expect(capturedUrl).toContain("search=widget");
    });

    it("passes category and supplier filters", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/products/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listProducts({ category: "Electronics", supplier: 2 });
      expect(capturedUrl).toContain("category=Electronics");
      expect(capturedUrl).toContain("supplier=2");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/products/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listProducts()).rejects.toThrow();
    });
  });

  describe("getProduct", () => {
    it("GETs /products/:id/ and returns Product", async () => {
      server.use(
        http.get(`${BASE}/products/1/`, () => HttpResponse.json(mockProduct))
      );
      const result = await getProduct(1);
      expect(result).toEqual(mockProduct);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/products/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getProduct(999)).rejects.toThrow();
    });
  });

  describe("createProduct", () => {
    it("POSTs to /products/ and returns created Product", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/products/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockProduct, { status: 201 });
        })
      );
      const result = await createProduct(minimalPayload);
      expect(result).toEqual(mockProduct);
      expect(capturedBody).toEqual(minimalPayload);
    });

    it("propagates 400 validation error", async () => {
      server.use(
        http.post(`${BASE}/products/`, () =>
          HttpResponse.json({ sku: ["This field is required."] }, { status: 400 })
        )
      );
      await expect(createProduct(minimalPayload)).rejects.toThrow();
    });
  });

  describe("updateProduct", () => {
    it("PUTs to /products/:id/ and returns updated Product", async () => {
      server.use(
        http.put(`${BASE}/products/1/`, () => HttpResponse.json(mockProduct))
      );
      const result = await updateProduct(1, minimalPayload);
      expect(result).toEqual(mockProduct);
    });
  });

  describe("patchProduct", () => {
    it("PATCHes /products/:id/ and returns updated Product", async () => {
      server.use(
        http.patch(`${BASE}/products/1/`, () =>
          HttpResponse.json({ ...mockProduct, is_active: false })
        )
      );
      const result = await patchProduct(1, { is_active: false });
      expect(result.is_active).toBe(false);
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.patch(`${BASE}/products/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(patchProduct(999, {})).rejects.toThrow();
    });
  });

  describe("deleteProduct", () => {
    it("DELETEs /products/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/products/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteProduct(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/products/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteProduct(999)).rejects.toThrow();
    });
  });
});
