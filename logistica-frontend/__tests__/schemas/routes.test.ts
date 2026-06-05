import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of routeSchema from components/routes/RouteForm.tsx (not exported)
const routeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  origin_warehouse: z.string().min(1, "El almacén es requerido"),
  transport: z.string().min(1, "El transporte es requerido"),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"], {
    error: "Selecciona un estado",
  }),
  estimated_duration_hours: z.string(),
  started_at: z.string(),
  completed_at: z.string(),
});

// Mirror of stopSchema from components/routes/RouteStopForm.tsx (not exported)
const stopSchema = z.object({
  stop_order: z
    .string()
    .min(1, "El orden es requerido")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
      "Debe ser un entero positivo"
    ),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  latitude: z.string(),
  longitude: z.string(),
  estimated_arrival: z.string(),
  actual_arrival: z.string(),
});

// ── routeSchema tests ──────────────────────────────────────────────────────────

const validRoute = {
  name: "Lima - Callao",
  origin_warehouse: "1",
  transport: "1",
  status: "planned" as const,
  estimated_duration_hours: "",
  started_at: "",
  completed_at: "",
};

describe("routeSchema (Zod)", () => {
  it("passes with all required fields", () => {
    expect(routeSchema.safeParse(validRoute).success).toBe(true);
  });

  it("passes for all status values", () => {
    for (const status of ["planned", "in_progress", "completed", "cancelled"] as const) {
      expect(routeSchema.safeParse({ ...validRoute, status }).success).toBe(true);
    }
  });

  it("rejects empty name with correct message", () => {
    const result = routeSchema.safeParse({ ...validRoute, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido");
    }
  });

  it("rejects empty origin_warehouse with correct message", () => {
    const result = routeSchema.safeParse({ ...validRoute, origin_warehouse: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.origin_warehouse?.[0]).toBe("El almacén es requerido");
    }
  });

  it("rejects empty transport with correct message", () => {
    const result = routeSchema.safeParse({ ...validRoute, transport: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.transport?.[0]).toBe("El transporte es requerido");
    }
  });

  it("rejects invalid status", () => {
    const result = routeSchema.safeParse({ ...validRoute, status: "unknown" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toBeDefined();
    }
  });
});

// ── stopSchema tests ───────────────────────────────────────────────────────────

const validStop = {
  stop_order: "1",
  address: "Av. Lima 100",
  city: "Lima",
  latitude: "",
  longitude: "",
  estimated_arrival: "",
  actual_arrival: "",
};

describe("stopSchema (Zod)", () => {
  it("passes with all required fields", () => {
    expect(stopSchema.safeParse(validStop).success).toBe(true);
  });

  it("rejects empty stop_order with correct message", () => {
    const result = stopSchema.safeParse({ ...validStop, stop_order: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.stop_order?.[0]).toBe("El orden es requerido");
    }
  });

  it("rejects non-integer stop_order", () => {
    const result = stopSchema.safeParse({ ...validStop, stop_order: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.stop_order?.[0]).toBe("Debe ser un entero positivo");
    }
  });

  it("rejects zero stop_order", () => {
    const result = stopSchema.safeParse({ ...validStop, stop_order: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects empty address with correct message", () => {
    const result = stopSchema.safeParse({ ...validStop, address: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address?.[0]).toBe("La dirección es requerida");
    }
  });

  it("rejects empty city with correct message", () => {
    const result = stopSchema.safeParse({ ...validStop, city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.city?.[0]).toBe("La ciudad es requerida");
    }
  });
});
