import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/utils/renderWithQuery";
import { useRoutes } from "@/hooks/useRoutes";
import { useRoute } from "@/hooks/useRoute";
import { useRouteStops } from "@/hooks/useRouteStops";
import {
  useCreateRoute,
  useUpdateRoute,
  usePatchRoute,
  useDeleteRoute,
} from "@/hooks/useRouteMutations";
import {
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
} from "@/hooks/useRouteStopMutations";
import { queryClient } from "@/lib/queryClient";
import type { Route, RouteStop } from "@/types/route";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockRoute: Route = {
  id: 1,
  name: "Lima - Callao",
  origin_warehouse: 1,
  transport: 1,
  status: "planned",
  estimated_duration_hours: null,
  started_at: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Route> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockRoute],
};

const mockStop: RouteStop = {
  id: 10,
  route: 1,
  stop_order: 1,
  address: "Av. Lima 100",
  city: "Lima",
  latitude: null,
  longitude: null,
  estimated_arrival: null,
  actual_arrival: null,
};

const routePayload = {
  name: "Lima - Callao",
  origin_warehouse: 1,
  transport: 1,
  status: "planned" as const,
  estimated_duration_hours: null,
  started_at: null,
  completed_at: null,
};

const stopPayload = {
  stop_order: 1,
  address: "Av. Lima 100",
  city: "Lima",
  latitude: null,
  longitude: null,
  estimated_arrival: null,
  actual_arrival: null,
};

describe("route hooks", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── useRoutes ────────────────────────────────────────────────────────────────
  describe("useRoutes", () => {
    it("starts pending then resolves with data", async () => {
      server.use(
        http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPage))
      );
      const { result } = renderHookWithQuery(() => useRoutes());
      expect(result.current.isPending).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPage);
    });

    it("passes status filter to request", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/routes/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      const { result } = renderHookWithQuery(() => useRoutes({ status: "in_progress" }));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain("status=in_progress");
    });
  });

  // ── useRoute ─────────────────────────────────────────────────────────────────
  describe("useRoute", () => {
    it("stays idle when id is null", () => {
      const { result } = renderHookWithQuery(() => useRoute(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches and returns route when id is provided", async () => {
      server.use(
        http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute))
      );
      const { result } = renderHookWithQuery(() => useRoute(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockRoute);
    });
  });

  // ── useRouteStops ─────────────────────────────────────────────────────────────
  describe("useRouteStops", () => {
    it("stays idle when routeId is null", () => {
      const { result } = renderHookWithQuery(() => useRouteStops(null));
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("fetches stops when routeId is provided", async () => {
      server.use(
        http.get(`${BASE}/routes/1/stops/`, () => HttpResponse.json([mockStop]))
      );
      const { result } = renderHookWithQuery(() => useRouteStops(1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([mockStop]);
    });
  });

  // ── useCreateRoute ────────────────────────────────────────────────────────────
  describe("useCreateRoute", () => {
    it("mutates and invalidates ['routes']", async () => {
      server.use(
        http.post(`${BASE}/routes/`, async () =>
          HttpResponse.json(mockRoute, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateRoute());

      result.current.mutate(routePayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] });
    });
  });

  // ── useUpdateRoute ────────────────────────────────────────────────────────────
  describe("useUpdateRoute", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.put(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateRoute());

      result.current.mutate({ id: 1, data: routePayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["routes", 1] });
    });
  });

  // ── usePatchRoute ─────────────────────────────────────────────────────────────
  describe("usePatchRoute", () => {
    it("mutates and invalidates list and detail", async () => {
      server.use(
        http.patch(`${BASE}/routes/1/`, () =>
          HttpResponse.json({ ...mockRoute, status: "in_progress" })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => usePatchRoute());

      result.current.mutate({ id: 1, data: { status: "in_progress" } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["routes", 1] });
    });
  });

  // ── useDeleteRoute ────────────────────────────────────────────────────────────
  describe("useDeleteRoute", () => {
    it("mutates and invalidates ['routes']", async () => {
      server.use(
        http.delete(`${BASE}/routes/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteRoute());

      result.current.mutate(1);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] });
    });
  });

  // ── useCreateRouteStop ────────────────────────────────────────────────────────
  describe("useCreateRouteStop", () => {
    it("mutates and invalidates route-stops for the given routeId", async () => {
      server.use(
        http.post(`${BASE}/routes/1/stops/`, async () =>
          HttpResponse.json(mockStop, { status: 201 })
        )
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useCreateRouteStop(1));

      result.current.mutate(stopPayload);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["route-stops", 1] });
    });
  });

  // ── useUpdateRouteStop ────────────────────────────────────────────────────────
  describe("useUpdateRouteStop", () => {
    it("mutates and invalidates route-stops for the given routeId", async () => {
      server.use(
        http.put(`${BASE}/routes/1/stops/10/`, () => HttpResponse.json(mockStop))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useUpdateRouteStop(1));

      result.current.mutate({ stopId: 10, data: stopPayload });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["route-stops", 1] });
    });
  });

  // ── useDeleteRouteStop ────────────────────────────────────────────────────────
  describe("useDeleteRouteStop", () => {
    it("mutates and invalidates route-stops for the given routeId", async () => {
      server.use(
        http.delete(`${BASE}/routes/1/stops/10/`, () => new HttpResponse(null, { status: 204 }))
      );
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHookWithQuery(() => useDeleteRouteStop(1));

      result.current.mutate(10);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith({ queryKey: ["route-stops", 1] });
    });
  });
});
