import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of warehouseSchema from components/warehouses/WarehouseForm.tsx (not exported)
const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  capacity: z
    .string()
    .min(1, "La capacidad es requerida")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
      message: "Debe ser un entero positivo",
    }),
  latitude: z.string(),
  longitude: z.string(),
  is_active: z.boolean(),
});

const validInput = {
  name: "Central Warehouse",
  address: "Av. Industrial 100",
  city: "Lima",
  country: "Peru",
  capacity: "1000",
  latitude: "",
  longitude: "",
  is_active: true,
};

describe("warehouseSchema (Zod)", () => {
  it("passes with all required fields and empty optional strings", () => {
    const result = warehouseSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("passes with latitude and longitude filled", () => {
    const result = warehouseSchema.safeParse({
      ...validInput,
      latitude: "-12.046374",
      longitude: "-77.042793",
    });
    expect(result.success).toBe(true);
  });

  it("passes with is_active false", () => {
    const result = warehouseSchema.safeParse({ ...validInput, is_active: false });
    expect(result.success).toBe(true);
  });

  it("rejects empty name with correct message", () => {
    const result = warehouseSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido");
    }
  });

  it("rejects empty address with correct message", () => {
    const result = warehouseSchema.safeParse({ ...validInput, address: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address?.[0]).toBe("La dirección es requerida");
    }
  });

  it("rejects empty city with correct message", () => {
    const result = warehouseSchema.safeParse({ ...validInput, city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.city?.[0]).toBe("La ciudad es requerida");
    }
  });

  it("rejects empty country with correct message", () => {
    const result = warehouseSchema.safeParse({ ...validInput, country: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.country?.[0]).toBe("El país es requerido");
    }
  });

  it("rejects empty capacity with correct message", () => {
    const result = warehouseSchema.safeParse({ ...validInput, capacity: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity?.[0]).toBe("La capacidad es requerida");
    }
  });

  it("rejects non-integer capacity", () => {
    const result = warehouseSchema.safeParse({ ...validInput, capacity: "12.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity?.[0]).toBe("Debe ser un entero positivo");
    }
  });

  it("rejects zero capacity", () => {
    const result = warehouseSchema.safeParse({ ...validInput, capacity: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity?.[0]).toBe("Debe ser un entero positivo");
    }
  });

  it("rejects negative capacity", () => {
    const result = warehouseSchema.safeParse({ ...validInput, capacity: "-10" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity?.[0]).toBe("Debe ser un entero positivo");
    }
  });

  it("rejects missing required fields (empty object)", () => {
    const result = warehouseSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.name).toBeDefined();
      expect(errs.address).toBeDefined();
      expect(errs.city).toBeDefined();
      expect(errs.country).toBeDefined();
    }
  });
});
