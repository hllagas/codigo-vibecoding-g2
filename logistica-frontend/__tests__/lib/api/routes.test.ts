import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  patchRoute,
  deleteRoute,
  listRouteStops,
  createRouteStop,
  updateRouteStop,
  deleteRouteStop,
} from "@/services/routeService";
import type { Route, RouteStop } from "@/types/route";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockRoute: Route = {
  id: 1,
  name: "Lima - Callao",
  origin_warehouse: 1,
  transport: 1,
  status: "planned",
  estimated_duration_hours: "2.5",
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

const routePayload = {
  name: "Lima - Callao",
  origin_warehouse: 1,
  transport: 1,
  status: "planned" as const,
  estimated_duration_hours: null,
  started_at: null,
  completed_at: null,
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

const stopPayload = {
  stop_order: 1,
  address: "Av. Lima 100",
  city: "Lima",
  latitude: null,
  longitude: null,
  estimated_arrival: null,
  actual_arrival: null,
};

describe("routeService", () => {
  describe("listRoutes", () => {
    it("GETs /routes/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPage))
      );
      const result = await listRoutes();
      expect(result).toEqual(mockPage);
    });

    it("passes status filter in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/routes/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listRoutes({ status: "planned" });
      expect(capturedUrl).toContain("status=planned");
    });

    it("passes transport and origin_warehouse filters", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/routes/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listRoutes({ transport: 1, origin_warehouse: 2 });
      expect(capturedUrl).toContain("transport=1");
      expect(capturedUrl).toContain("origin_warehouse=2");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/routes/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listRoutes()).rejects.toThrow();
    });
  });

  describe("getRoute", () => {
    it("GETs /routes/:id/ and returns Route", async () => {
      server.use(
        http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute))
      );
      const result = await getRoute(1);
      expect(result).toEqual(mockRoute);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/routes/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getRoute(999)).rejects.toThrow();
    });
  });

  describe("createRoute", () => {
    it("POSTs to /routes/ and returns created Route", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/routes/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockRoute, { status: 201 });
        })
      );
      const result = await createRoute(routePayload);
      expect(result).toEqual(mockRoute);
      expect(capturedBody).toEqual(routePayload);
    });
  });

  describe("updateRoute", () => {
    it("PUTs to /routes/:id/ and returns updated Route", async () => {
      server.use(
        http.put(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute))
      );
      const result = await updateRoute(1, routePayload);
      expect(result).toEqual(mockRoute);
    });
  });

  describe("patchRoute", () => {
    it("PATCHes /routes/:id/ and returns updated Route", async () => {
      server.use(
        http.patch(`${BASE}/routes/1/`, () =>
          HttpResponse.json({ ...mockRoute, status: "in_progress" })
        )
      );
      const result = await patchRoute(1, { status: "in_progress" });
      expect(result.status).toBe("in_progress");
    });
  });

  describe("deleteRoute", () => {
    it("DELETEs /routes/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/routes/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteRoute(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/routes/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteRoute(999)).rejects.toThrow();
    });
  });

  describe("listRouteStops", () => {
    it("GETs /routes/:id/stops/ and returns RouteStop[]", async () => {
      server.use(
        http.get(`${BASE}/routes/1/stops/`, () => HttpResponse.json([mockStop]))
      );
      const result = await listRouteStops(1);
      expect(result).toEqual([mockStop]);
    });
  });

  describe("createRouteStop", () => {
    it("POSTs to /routes/:id/stops/ and returns created RouteStop", async () => {
      server.use(
        http.post(`${BASE}/routes/1/stops/`, async () =>
          HttpResponse.json(mockStop, { status: 201 })
        )
      );
      const result = await createRouteStop(1, stopPayload);
      expect(result).toEqual(mockStop);
    });
  });

  describe("updateRouteStop", () => {
    it("PUTs to /routes/:id/stops/:stopId/", async () => {
      server.use(
        http.put(`${BASE}/routes/1/stops/10/`, () => HttpResponse.json(mockStop))
      );
      const result = await updateRouteStop(1, 10, stopPayload);
      expect(result).toEqual(mockStop);
    });
  });

  describe("deleteRouteStop", () => {
    it("DELETEs /routes/:id/stops/:stopId/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/routes/1/stops/10/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteRouteStop(1, 10);
    });
  });
});
