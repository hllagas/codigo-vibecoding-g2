import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listTransports,
  getTransport,
  createTransport,
  updateTransport,
  patchTransport,
  deleteTransport,
} from "@/services/transportService";
import type { Transport } from "@/types/transport";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockTransport: Transport = {
  id: 1,
  name: "Truck A",
  plate_number: "ABC-123",
  transport_type: "truck",
  capacity_kg: "5000.00",
  driver: 1,
  driver_detail: { id: 1, license_number: "LIC-001", phone: "+51 987", is_available: true },
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Transport> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockTransport],
};

const minimalPayload = {
  name: "Truck A",
  plate_number: "ABC-123",
  transport_type: "truck" as const,
  capacity_kg: "5000.00",
  driver: null,
  is_active: true,
};

describe("transportService", () => {
  describe("listTransports", () => {
    it("GETs /transports/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/transports/`, () => HttpResponse.json(mockPage))
      );
      const result = await listTransports();
      expect(result).toEqual(mockPage);
    });

    it("passes search param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/transports/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listTransports({ search: "truck" });
      expect(capturedUrl).toContain("search=truck");
    });

    it("passes transport_type filter", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/transports/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listTransports({ transport_type: "van" });
      expect(capturedUrl).toContain("transport_type=van");
    });

    it("passes is_active filter", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/transports/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listTransports({ is_active: true });
      expect(capturedUrl).toContain("is_active=true");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/transports/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listTransports()).rejects.toThrow();
    });
  });

  describe("getTransport", () => {
    it("GETs /transports/:id/ and returns Transport", async () => {
      server.use(
        http.get(`${BASE}/transports/1/`, () => HttpResponse.json(mockTransport))
      );
      const result = await getTransport(1);
      expect(result).toEqual(mockTransport);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/transports/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getTransport(999)).rejects.toThrow();
    });
  });

  describe("createTransport", () => {
    it("POSTs to /transports/ and returns created Transport", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/transports/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockTransport, { status: 201 });
        })
      );
      const result = await createTransport(minimalPayload);
      expect(result).toEqual(mockTransport);
      expect(capturedBody).toEqual(minimalPayload);
    });

    it("propagates 400 validation error", async () => {
      server.use(
        http.post(`${BASE}/transports/`, () =>
          HttpResponse.json({ plate_number: ["This field is required."] }, { status: 400 })
        )
      );
      await expect(createTransport(minimalPayload)).rejects.toThrow();
    });
  });

  describe("updateTransport", () => {
    it("PUTs to /transports/:id/ and returns updated Transport", async () => {
      server.use(
        http.put(`${BASE}/transports/1/`, () => HttpResponse.json(mockTransport))
      );
      const result = await updateTransport(1, minimalPayload);
      expect(result).toEqual(mockTransport);
    });
  });

  describe("patchTransport", () => {
    it("PATCHes /transports/:id/ and returns updated Transport", async () => {
      server.use(
        http.patch(`${BASE}/transports/1/`, () =>
          HttpResponse.json({ ...mockTransport, is_active: false })
        )
      );
      const result = await patchTransport(1, { is_active: false });
      expect(result.is_active).toBe(false);
    });
  });

  describe("deleteTransport", () => {
    it("DELETEs /transports/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/transports/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteTransport(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/transports/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteTransport(999)).rejects.toThrow();
    });
  });
});
