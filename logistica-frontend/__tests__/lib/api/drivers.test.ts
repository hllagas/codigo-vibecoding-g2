import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  patchDriver,
  deleteDriver,
} from "@/services/driverService";
import type { Driver } from "@/types/driver";
import type { PaginatedResponse } from "@/types/pagination";

const BASE = "http://localhost:8000/api/v1";

const mockDriver: Driver = {
  id: 1,
  user: 10,
  user_detail: { id: 10, username: "jsmith", email: "j@example.com", first_name: "John", last_name: "Smith" },
  license_number: "LIC-001",
  license_expiry: "2026-12-31",
  phone: "+51 987 654 321",
  is_available: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Driver> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockDriver],
};

const minimalPayload = {
  user: 10,
  license_number: "LIC-001",
  license_expiry: "2026-12-31",
  phone: "+51 987 654 321",
  is_available: true,
};

describe("driverService", () => {
  describe("listDrivers", () => {
    it("GETs /drivers/ and returns PaginatedResponse", async () => {
      server.use(
        http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPage))
      );
      const result = await listDrivers();
      expect(result).toEqual(mockPage);
    });

    it("passes search param in query string", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/drivers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listDrivers({ search: "john" });
      expect(capturedUrl).toContain("search=john");
    });

    it("passes is_available filter", async () => {
      let capturedUrl: string | null = null;
      server.use(
        http.get(`${BASE}/drivers/`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockPage);
        })
      );
      await listDrivers({ is_available: true });
      expect(capturedUrl).toContain("is_available=true");
    });

    it("propagates 4xx errors", async () => {
      server.use(
        http.get(`${BASE}/drivers/`, () =>
          HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
        )
      );
      await expect(listDrivers()).rejects.toThrow();
    });
  });

  describe("getDriver", () => {
    it("GETs /drivers/:id/ and returns Driver", async () => {
      server.use(
        http.get(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDriver))
      );
      const result = await getDriver(1);
      expect(result).toEqual(mockDriver);
    });

    it("propagates 404", async () => {
      server.use(
        http.get(`${BASE}/drivers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(getDriver(999)).rejects.toThrow();
    });
  });

  describe("createDriver", () => {
    it("POSTs to /drivers/ and returns created Driver", async () => {
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE}/drivers/`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockDriver, { status: 201 });
        })
      );
      const result = await createDriver(minimalPayload);
      expect(result).toEqual(mockDriver);
      expect(capturedBody).toEqual(minimalPayload);
    });

    it("propagates 400 validation error", async () => {
      server.use(
        http.post(`${BASE}/drivers/`, () =>
          HttpResponse.json({ license_number: ["This field is required."] }, { status: 400 })
        )
      );
      await expect(createDriver(minimalPayload)).rejects.toThrow();
    });
  });

  describe("updateDriver", () => {
    it("PUTs to /drivers/:id/ and returns updated Driver", async () => {
      server.use(
        http.put(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDriver))
      );
      const result = await updateDriver(1, minimalPayload);
      expect(result).toEqual(mockDriver);
    });
  });

  describe("patchDriver", () => {
    it("PATCHes /drivers/:id/ and returns updated Driver", async () => {
      server.use(
        http.patch(`${BASE}/drivers/1/`, () =>
          HttpResponse.json({ ...mockDriver, is_available: false })
        )
      );
      const result = await patchDriver(1, { is_available: false });
      expect(result.is_available).toBe(false);
    });
  });

  describe("deleteDriver", () => {
    it("DELETEs /drivers/:id/ without throwing", async () => {
      server.use(
        http.delete(`${BASE}/drivers/1/`, () => new HttpResponse(null, { status: 204 }))
      );
      await deleteDriver(1);
    });

    it("propagates 404 on unknown id", async () => {
      server.use(
        http.delete(`${BASE}/drivers/999/`, () =>
          HttpResponse.json({ detail: "Not found" }, { status: 404 })
        )
      );
      await expect(deleteDriver(999)).rejects.toThrow();
    });
  });
});
