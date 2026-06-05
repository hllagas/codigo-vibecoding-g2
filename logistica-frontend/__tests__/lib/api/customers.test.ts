import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  patchCustomer,
  deleteCustomer,
} from "@/services/customerService";
import type { Customer } from "@/types/customer";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockCustomer: Customer = {
  id: 1,
  name: "Acme SA",
  customer_type: "company",
  tax_id: "RUC123",
  email: "billing@acme.com",
  phone: "+51 987 654 321",
  address: "Av. Lima 100",
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

describe("customerService", () => {
  describe("listCustomers", () => {
    it("GETs /customers/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPage))
      );
      const result = await listCustomers();
      expect(result).toEqual(mockPage);
    });

    it("passes search param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/customers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listCustomers({ search: "acme" });
      expect(capturedUrl).toContain("search=acme");
    });

    it("passes customer_type filter", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/customers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listCustomers({ customer_type: "company" });
      expect(capturedUrl).toContain("customer_type=company");
    });

    it("passes page and is_active params", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/customers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listCustomers({ page: 2, is_active: true });
      expect(capturedUrl).toContain("page=2");
      expect(capturedUrl).toContain("is_active=true");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/customers/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listCustomers()).rejects.toThrow();
    });
  });

  describe("getCustomer", () => {
    it("GETs /customers/:id/ and returns Customer", async () => {
      server.use(
        http.get(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer))
      );
      const result = await getCustomer(1);
      expect(result).toEqual(mockCustomer);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/customers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getCustomer(999)).rejects.toThrow();
    });
  });

  describe("createCustomer", () => {
    it("POSTs to /customers/ and returns created Customer", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/customers/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockCustomer, { status: 201 });
        })
      );
      const result = await createCustomer(minimalPayload);
      expect(result).toEqual(mockCustomer);
      expect(capturedBody).toEqual(minimalPayload);
    });

    it("propagates 400 validation error", async () => {
      server.use(
        http.post(`${BASE}/customers/`, () =>
          HttpResponse.json({ email: ["Enter a valid email address."] }, { status: 400 })
        )
      );
      await expect(createCustomer(minimalPayload)).rejects.toThrow();
    });
  });

  describe("updateCustomer", () => {
    it("PUTs to /customers/:id/ and returns updated Customer", async () => {
      server.use(
        http.put(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer))
      );
      const result = await updateCustomer(1, minimalPayload);
      expect(result).toEqual(mockCustomer);
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.put(`${BASE}/customers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(updateCustomer(999, minimalPayload)).rejects.toThrow();
    });
  });

  describe("patchCustomer", () => {
    it("PATCHes /customers/:id/ and returns updated Customer", async () => {
      server.use(
        http.patch(`${BASE}/customers/1/`, () =>
          HttpResponse.json({ ...mockCustomer, is_active: false })
        )
      );
      const result = await patchCustomer(1, { is_active: false });
      expect(result.is_active).toBe(false);
    });
  });

  describe("deleteCustomer", () => {
    it("DELETEs /customers/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/customers/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteCustomer(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/customers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteCustomer(999)).rejects.toThrow();
    });
  });
});
