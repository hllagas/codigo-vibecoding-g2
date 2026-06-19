import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useProducts } from "@/hooks/useProducts";
import { useProduct } from "@/hooks/useProduct";
import {
  useCreateProduct,
  useUpdateProduct,
  usePatchProduct,
  useDeleteProduct,
} from "@/hooks/useProductMutations";
import { queryClient } from "@/lib/queryClient";
import type { Product } from "@/types/product";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockProduct: Product = {
  id: 1,
  name: "Widget A",
  description: null,
  sku: "WGT-001",
  category: "Electronics",
  unit_price: "10.50",
  weight_kg: "1.500",
  supplier: null,
  is_active: true,
  image_url: null,
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

describe("product hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useProducts ──────────────────────────────────────────────────────────────
  describe("useProducts", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/products/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useProducts());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes category filter to request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/products/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() =>
        useProducts({ category: "Electronics" })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("category=Electronics");
    });
  });

  // ── useProduct ───────────────────────────────────────────────────────────────
  describe("useProduct", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useProduct(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns product when id is provided", async () => {
      server.use(
        http.get(`${BASE}/products/1/`, () => HttpResponse.json(mockProduct))
      );
      const { result } = renderHookWithQuery(() => useProduct(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockProduct);
    });
  });

  // ── useCreateProduct ─────────────────────────────────────────────────────────
  describe("useCreateProduct", () => {
    it("mutates and invalidates ['products']", async () => {
      server.use(
        http.post(`${BASE}/products/`, async () =>
          HttpResponse.json(mockProduct, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateProduct());

      result.current.mutate(minimalPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] });
    });
  });

  // ── useUpdateProduct ─────────────────────────────────────────────────────────
  describe("useUpdateProduct", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/products/1/`, () => HttpResponse.json(mockProduct))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateProduct());

      result.current.mutate({ id: 1, data: minimalPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["products", 1] });
    });
  });

  // ── usePatchProduct ──────────────────────────────────────────────────────────
  describe("usePatchProduct", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/products/1/`, () =>
          HttpResponse.json({ ...mockProduct, is_active: false })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchProduct());

      result.current.mutate({ id: 1, data: { is_active: false } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["products", 1] });
    });
  });

  // ── useDeleteProduct ─────────────────────────────────────────────────────────
  describe("useDeleteProduct", () => {
    it("mutates and invalidates ['products']", async () => {
      server.use(
        http.delete(`${BASE}/products/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteProduct());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] });
    });
  });
});
