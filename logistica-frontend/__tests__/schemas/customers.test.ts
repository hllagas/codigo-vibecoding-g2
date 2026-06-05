import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of customerSchema from components/customers/CustomerForm.tsx (not exported)
const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  customer_type: z.enum(["company", "individual"]),
  tax_id: z.string(),
  email: z.string().email("Email inválido"),
  phone: z.string(),
  address: z.string(),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  is_active: z.boolean(),
});

const validCompany = {
  name: "Acme SA",
  customer_type: "company" as const,
  tax_id: "",
  email: "billing@acme.com",
  phone: "",
  address: "",
  city: "Lima",
  country: "Peru",
  is_active: true,
};

describe("customerSchema (Zod)", () => {
  it("passes for company type with required fields", () => {
    expect(customerSchema.safeParse(validCompany).success).toBe(true);
  });

  it("passes for individual type", () => {
    const result = customerSchema.safeParse({
      ...validCompany,
      customer_type: "individual",
    });
    expect(result.success).toBe(true);
  });

  it("passes with all optional fields filled", () => {
    const result = customerSchema.safeParse({
      ...validCompany,
      tax_id: "RUC123",
      phone: "+51 987 654 321",
      address: "Av. Lima 100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name with correct message", () => {
    const result = customerSchema.safeParse({ ...validCompany, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido");
    }
  });

  it("rejects invalid email with correct message", () => {
    const result = customerSchema.safeParse({ ...validCompany, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido");
    }
  });

  it("rejects empty city with correct message", () => {
    const result = customerSchema.safeParse({ ...validCompany, city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.city?.[0]).toBe("La ciudad es requerida");
    }
  });

  it("rejects empty country with correct message", () => {
    const result = customerSchema.safeParse({ ...validCompany, country: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.country?.[0]).toBe("El país es requerido");
    }
  });

  it("rejects invalid customer_type", () => {
    const result = customerSchema.safeParse({ ...validCompany, customer_type: "unknown" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.customer_type).toBeDefined();
    }
  });

  it("rejects missing required fields (empty object)", () => {
    const result = customerSchema.safeParse({});
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
