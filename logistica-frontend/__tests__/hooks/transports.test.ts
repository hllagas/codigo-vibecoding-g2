import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useTransports } from "@/hooks/useTransports";
import { useTransport } from "@/hooks/useTransport";
import {
  useCreateTransport,
  useUpdateTransport,
  usePatchTransport,
  useDeleteTransport,
} from "@/hooks/useTransportMutations";
import { queryClient } from "@/lib/queryClient";
import type { Transport } from "@/types/transport";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockTransport: Transport = {
  id: 1,
  name: "Truck A",
  plate_number: "ABC-123",
  transport_type: "truck",
  capacity_kg: "5000.00",
  driver: null,
  driver_detail: null,
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

describe("transport hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useTransports ─────────────────────────────────────────────────────────────
  describe("useTransports", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/transports/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useTransports());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes transport_type filter to request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/transports/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() =>
        useTransports({ transport_type: "van" })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("transport_type=van");
    });
  });

  // ── useTransport ──────────────────────────────────────────────────────────────
  describe("useTransport", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useTransport(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns transport when id is provided", async () => {
      server.use(
        http.get(`${BASE}/transports/1/`, () => HttpResponse.json(mockTransport))
      );
      const { result } = renderHookWithQuery(() => useTransport(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockTransport);
    });
  });

  // ── useCreateTransport ────────────────────────────────────────────────────────
  describe("useCreateTransport", () => {
    it("mutates and invalidates ['transports']", async () => {
      server.use(
        http.post(`${BASE}/transports/`, async () =>
          HttpResponse.json(mockTransport, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateTransport());

      result.current.mutate(minimalPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] });
    });
  });

  // ── useUpdateTransport ────────────────────────────────────────────────────────
  describe("useUpdateTransport", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/transports/1/`, () => HttpResponse.json(mockTransport))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateTransport());

      result.current.mutate({ id: 1, data: minimalPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["transports", 1] });
    });
  });

  // ── usePatchTransport ─────────────────────────────────────────────────────────
  describe("usePatchTransport", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/transports/1/`, () =>
          HttpResponse.json({ ...mockTransport, is_active: false })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchTransport());

      result.current.mutate({ id: 1, data: { is_active: false } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["transports", 1] });
    });
  });

  // ── useDeleteTransport ────────────────────────────────────────────────────────
  describe("useDeleteTransport", () => {
    it("mutates and invalidates ['transports']", async () => {
      server.use(
        http.delete(`${BASE}/transports/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteTransport());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] });
    });
  });
});
