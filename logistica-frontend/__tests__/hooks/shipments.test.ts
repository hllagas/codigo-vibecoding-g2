import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useShipments } from "@/hooks/useShipments";
import { useShipment } from "@/hooks/useShipment";
import {
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
  useUpdateShipmentStatus,
} from "@/hooks/useShipmentMutations";
import { queryClient } from "@/lib/queryClient";
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

describe("shipment hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useShipments ─────────────────────────────────────────────────────────────
  describe("useShipments", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useShipments());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes status filter to request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/shipments/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() => useShipments({ status: "in_transit" }));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("status=in_transit");
    });
  });

  // ── useShipment ───────────────────────────────────────────────────────────────
  describe("useShipment", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useShipment(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns shipment when id is provided", async () => {
      server.use(
        http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment))
      );
      const { result } = renderHookWithQuery(() => useShipment(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockShipment);
    });
  });

  // ── useCreateShipment ─────────────────────────────────────────────────────────
  describe("useCreateShipment", () => {
    it("mutates and invalidates ['shipments']", async () => {
      server.use(
        http.post(`${BASE}/shipments/`, async () =>
          HttpResponse.json(mockShipment, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateShipment());

      result.current.mutate(shipmentPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] });
    });
  });

  // ── useUpdateShipment ─────────────────────────────────────────────────────────
  describe("useUpdateShipment", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateShipment());

      result.current.mutate({ id: 1, data: { destination_city: "Callao" } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments", 1] });
    });
  });

  // ── useDeleteShipment ─────────────────────────────────────────────────────────
  describe("useDeleteShipment", () => {
    it("mutates and invalidates ['shipments']", async () => {
      server.use(
        http.delete(`${BASE}/shipments/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteShipment());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] });
    });
  });

  // ── useUpdateShipmentStatus ───────────────────────────────────────────────────
  describe("useUpdateShipmentStatus", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/shipments/1/status/`, () =>
          HttpResponse.json({ ...mockShipment, status: "processing" })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateShipmentStatus());

      result.current.mutate({ id: 1, status: "processing" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments", 1] });
    });
  });
});
