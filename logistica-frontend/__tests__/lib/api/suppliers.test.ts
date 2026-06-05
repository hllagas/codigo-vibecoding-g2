import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  patchSupplier,
  deleteSupplier,
} from "@/services/supplierService";
import type { Supplier } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockSupplier: Supplier = {
  id: 1,
  name: "Acme Corp",
  tax_id: "ACM123",
  email: "contact@acme.com",
  phone: "+52 55 1234 5678",
  address: "123 Main St",
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

describe("supplierService", () => {
  describe("listSuppliers", () => {
    it("GETs /suppliers/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPage))
      );
      const result = await listSuppliers();
      expect(result).toEqual(mockPage);
    });

    it("passes search param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/suppliers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listSuppliers({ search: "acme" });
      expect(capturedUrl).toContain("search=acme");
    });

    it("passes page param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/suppliers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listSuppliers({ page: 2 });
      expect(capturedUrl).toContain("page=2");
    });

    it("passes multiple filter params", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/suppliers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listSuppliers({ city: "CDMX", country: "Mexico", is_active: true });
      expect(capturedUrl).toContain("city=CDMX");
      expect(capturedUrl).toContain("country=Mexico");
      expect(capturedUrl).toContain("is_active=true");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/suppliers/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(listSuppliers()).rejects.toThrow();
    });
  });

  describe("getSupplier", () => {
    it("GETs /suppliers/:id/ and returns Supplier", async () => {
      server.use(
        http.get(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier))
      );
      const result = await getSupplier(1);
      expect(result).toEqual(mockSupplier);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/suppliers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getSupplier(999)).rejects.toThrow();
    });
  });

  describe("createSupplier", () => {
    it("POSTs to /suppliers/ and returns created Supplier", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/suppliers/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockSupplier, { status: 201 });
        })
      );
      const result = await createSupplier(minimalPayload);
      expect(result).toEqual(mockSupplier);
      expect(capturedBody).toEqual(minimalPayload);
    });

    it("propagates 400 validation error", async () => {
      server.use(
        http.post(`${BASE}/suppliers/`, () =>
          HttpResponse.json({ name: ["This field is required"] }, { status: 400 })
        )
      );
      await expect(createSupplier(minimalPayload)).rejects.toThrow();
    });
  });

  describe("updateSupplier", () => {
    it("PUTs to /suppliers/:id/ and returns updated Supplier", async () => {
      server.use(
        http.put(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier))
      );
      const result = await updateSupplier(1, minimalPayload);
      expect(result).toEqual(mockSupplier);
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.put(`${BASE}/suppliers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(updateSupplier(999, minimalPayload)).rejects.toThrow();
    });
  });

  describe("patchSupplier", () => {
    it("PATCHes /suppliers/:id/ and returns updated Supplier", async () => {
      server.use(
        http.patch(`${BASE}/suppliers/1/`, () =>
          HttpResponse.json({ ...mockSupplier, is_active: false })
        )
      );
      const result = await patchSupplier(1, { is_active: false });
      expect(result.is_active).toBe(false);
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.patch(`${BASE}/suppliers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(patchSupplier(999, { is_active: false })).rejects.toThrow();
    });
  });

  describe("deleteSupplier", () => {
    it("DELETEs /suppliers/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/suppliers/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteSupplier(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/suppliers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteSupplier(999)).rejects.toThrow();
    });
  });
});
