import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of transportSchema from components/transports/TransportForm.tsx (not exported)
const transportSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  plate_number: z.string().min(1, "La matrícula es requerida"),
  transport_type: z.enum(["truck", "van", "motorcycle", "bicycle"], {
    error: "Selecciona un tipo de transporte",
  }),
  capacity_kg: z.string().min(1, "La capacidad es requerida"),
  driver: z.string(),
  is_active: z.boolean(),
});

const validInput = {
  name: "Truck A",
  plate_number: "ABC-123",
  transport_type: "truck" as const,
  capacity_kg: "5000.00",
  driver: "none",
  is_active: true,
};

describe("transportSchema (Zod)", () => {
  it("passes for all transport types", () => {
    for (const t of ["truck", "van", "motorcycle", "bicycle"] as const) {
      const result = transportSchema.safeParse({ ...validInput, transport_type: t });
      expect(result.success).toBe(true);
    }
  });

  it("passes with is_active false", () => {
    expect(transportSchema.safeParse({ ...validInput, is_active: false }).success).toBe(true);
  });

  it("passes with driver set to a numeric string", () => {
    expect(transportSchema.safeParse({ ...validInput, driver: "5" }).success).toBe(true);
  });

  it("rejects empty name with correct message", () => {
    const result = transportSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido");
    }
  });

  it("rejects empty plate_number with correct message", () => {
    const result = transportSchema.safeParse({ ...validInput, plate_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.plate_number?.[0]).toBe("La matrícula es requerida");
    }
  });

  it("rejects invalid transport_type", () => {
    const result = transportSchema.safeParse({ ...validInput, transport_type: "boat" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.transport_type).toBeDefined();
    }
  });

  it("rejects empty capacity_kg with correct message", () => {
    const result = transportSchema.safeParse({ ...validInput, capacity_kg: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe("La capacidad es requerida");
    }
  });

  it("rejects missing required fields (empty object)", () => {
    const result = transportSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.name).toBeDefined();
      expect(errs.plate_number).toBeDefined();
    }
  });
});
