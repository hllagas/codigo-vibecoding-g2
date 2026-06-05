import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  patchShipment,
  deleteShipment,
  updateShipmentStatus,
} from "@/services/shipmentService";
import type { Shipment, ShipmentItem } from "@/types/shipment";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockItem: ShipmentItem = {
  id: 1,
  shipment: 1,
  product: 2,
  quantity: 3,
  unit_price_at_shipment: "10.00",
};

const mockShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-001",
  customer: 1,
  origin_warehouse: 1,
  route: null,
  destination_address: "Av. Lima 100",
  destination_city: "Lima",
  destination_country: "PE",
  status: "pending",
  scheduled_delivery_date: "2024-07-01",
  actual_delivery_date: null,
  total_weight_kg: "5.00",
  notes: null,
  items: [mockItem],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Shipment> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockShipment],
};

const shipmentPayload = {
  tracking_number: "TRK-001",
  customer: 1,
  origin_warehouse: 1,
  route: null,
  destination_address: "Av. Lima 100",
  destination_city: "Lima",
  destination_country: "PE",
  status: "pending" as const,
  scheduled_delivery_date: "2024-07-01",
  actual_delivery_date: null,
  total_weight_kg: "5.00",
  notes: null,
  items: [{ product: 2, quantity: 3, unit_price_at_shipment: "10.00" }],
};

describe("shipmentService", () => {
  describe("listShipments", () => {
    it("GETs /shipments/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockPage))
      );
      const result = await listShipments();
      expect(result).toEqual(mockPage);
    });

    it("passes status filter in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/shipments/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listShipments({ status: "pending" });
      expect(capturedUrl).toContain("status=pending");
    });

    it("passes customer and origin_warehouse filters", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/shipments/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listShipments({ customer: 1, origin_warehouse: 2 });
      expect(capturedUrl).toContain("customer=1");
      expect(capturedUrl).toContain("origin_warehouse=2");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/shipments/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listShipments()).rejects.toThrow();
    });
  });

  describe("getShipment", () => {
    it("GETs /shipments/:id/ and returns Shipment", async () => {
      server.use(
        http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment))
      );
      const result = await getShipment(1);
      expect(result).toEqual(mockShipment);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/shipments/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getShipment(999)).rejects.toThrow();
    });
  });

  describe("createShipment", () => {
    it("POSTs to /shipments/ and returns created Shipment", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/shipments/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockShipment, { status: 201 });
        })
      );
      const result = await createShipment(shipmentPayload);
      expect(result).toEqual(mockShipment);
      expect(capturedBody).toEqual(shipmentPayload);
    });
  });

  describe("updateShipment", () => {
    it("PUTs to /shipments/:id/ and returns updated Shipment", async () => {
      server.use(
        http.put(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment))
      );
      const result = await updateShipment(1, { destination_city: "Callao" });
      expect(result).toEqual(mockShipment);
    });
  });

  describe("patchShipment", () => {
    it("PATCHes /shipments/:id/ and returns updated Shipment", async () => {
      server.use(
        http.patch(`${BASE}/shipments/1/`, () =>
          HttpResponse.json({ ...mockShipment, status: "processing" })
        )
      );
      const result = await patchShipment(1, { status: "processing" });
      expect(result.status).toBe("processing");
    });
  });

  describe("deleteShipment", () => {
    it("DELETEs /shipments/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/shipments/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteShipment(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/shipments/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteShipment(999)).rejects.toThrow();
    });
  });

  describe("updateShipmentStatus", () => {
    it("PATCHes /shipments/:id/status/ with status body", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.patch(`${BASE}/shipments/1/status/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ ...mockShipment, status: "processing" });
        })
      );
      const result = await updateShipmentStatus(1, "processing");
      expect(result.status).toBe("processing");
      expect(capturedBody).toEqual({ status: "processing" });
    });

    it("propagates error on invalid transition", async () => {
      server.use(
        http.patch(`${BASE}/shipments/1/status/`, () =>
          HttpResponse.json({ detail: "Invalid transition" }, { status: 400 })
        )
      );
      await expect(updateShipmentStatus(1, "delivered")).rejects.toThrow();
    });
  });
});
