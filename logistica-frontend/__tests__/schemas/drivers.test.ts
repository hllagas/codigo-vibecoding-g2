import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of driverSchema from components/drivers/DriverForm.tsx (not exported)
const driverSchema = z.object({
  user: z.string().min(1, "El ID de usuario es requerido").refine(
    (v) => Number.isInteger(Number(v)) && Number(v) > 0,
    "Debe ser un número entero positivo"
  ),
  license_number: z.string().min(1, "El número de licencia es requerido"),
  license_expiry: z.string().min(1, "La fecha de vencimiento es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  is_available: z.boolean(),
});

const validInput = {
  user: "10",
  license_number: "LIC-001",
  license_expiry: "2026-12-31",
  phone: "+51 987 654 321",
  is_available: true,
};

describe("driverSchema (Zod)", () => {
  it("passes with all required fields", () => {
    expect(driverSchema.safeParse(validInput).success).toBe(true);
  });

  it("passes with is_available false", () => {
    const result = driverSchema.safeParse({ ...validInput, is_available: false });
    expect(result.success).toBe(true);
  });

  it("rejects empty user with correct message", () => {
    const result = driverSchema.safeParse({ ...validInput, user: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.user?.[0]).toBe("El ID de usuario es requerido");
    }
  });

  it("rejects non-integer user with correct message", () => {
    const result = driverSchema.safeParse({ ...validInput, user: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.user?.[0]).toBe("Debe ser un número entero positivo");
    }
  });

  it("rejects zero user id", () => {
    const result = driverSchema.safeParse({ ...validInput, user: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects empty license_number with correct message", () => {
    const result = driverSchema.safeParse({ ...validInput, license_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.license_number?.[0]).toBe("El número de licencia es requerido");
    }
  });

  it("rejects empty license_expiry with correct message", () => {
    const result = driverSchema.safeParse({ ...validInput, license_expiry: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.license_expiry?.[0]).toBe("La fecha de vencimiento es requerida");
    }
  });

  it("rejects empty phone with correct message", () => {
    const result = driverSchema.safeParse({ ...validInput, phone: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe("El teléfono es requerido");
    }
  });

  it("rejects missing required fields (empty object)", () => {
    const result = driverSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.license_number).toBeDefined();
      expect(errs.license_expiry).toBeDefined();
      expect(errs.phone).toBeDefined();
    }
  });
});
