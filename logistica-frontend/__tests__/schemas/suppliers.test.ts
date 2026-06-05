import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of supplierSchema from components/suppliers/SupplierForm.tsx (not exported)
const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  tax_id: z.string(),
  email: z.string().email("Email inválido"),
  phone: z.string(),
  address: z.string(),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  is_active: z.boolean(),
});

const validInput = {
  name: "Acme Corp",
  tax_id: "",
  email: "contact@acme.com",
  phone: "",
  address: "",
  city: "CDMX",
  country: "Mexico",
  is_active: true,
};

describe("supplierSchema (Zod)", () => {
  it("passes with all required fields and empty optional strings", () => {
    const result = supplierSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("passes with is_active false", () => {
    const result = supplierSchema.safeParse({ ...validInput, is_active: false });
    expect(result.success).toBe(true);
  });

  it("passes with optional fields filled", () => {
    const result = supplierSchema.safeParse({
      ...validInput,
      tax_id: "RFC123",
      phone: "+52 55 1234 5678",
      address: "123 Main St",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name with correct message", () => {
    const result = supplierSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido");
    }
  });

  it("rejects invalid email with correct message", () => {
    const result = supplierSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido");
    }
  });

  it("rejects empty city with correct message", () => {
    const result = supplierSchema.safeParse({ ...validInput, city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.city?.[0]).toBe("La ciudad es requerida");
    }
  });

  it("rejects empty country with correct message", () => {
    const result = supplierSchema.safeParse({ ...validInput, country: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.country?.[0]).toBe("El país es requerido");
    }
  });

  it("rejects missing required fields (empty object)", () => {
    const result = supplierSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.name).toBeDefined();
      expect(errs.email).toBeDefined();
      expect(errs.city).toBeDefined();
      expect(errs.country).toBeDefined();
    }
  });
});
