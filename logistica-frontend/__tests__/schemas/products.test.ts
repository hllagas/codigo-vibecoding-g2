import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of productSchema from components/products/ProductForm.tsx (not exported)
const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string(),
  sku: z.string().min(1, "El SKU es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  unit_price: z.string().min(1, "El precio es requerido"),
  weight_kg: z.string().min(1, "El peso es requerido"),
  supplier: z.string(),
  is_active: z.boolean(),
});

const validInput = {
  name: "Widget A",
  description: "",
  sku: "WGT-001",
  category: "Electronics",
  unit_price: "10.50",
  weight_kg: "1.500",
  supplier: "none",
  is_active: true,
};

describe("productSchema (Zod)", () => {
  it("passes with all required fields", () => {
    expect(productSchema.safeParse(validInput).success).toBe(true);
  });

  it("passes with supplier set to a numeric string", () => {
    const result = productSchema.safeParse({ ...validInput, supplier: "5" });
    expect(result.success).toBe(true);
  });

  it("passes with description filled", () => {
    const result = productSchema.safeParse({ ...validInput, description: "A fine widget" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name with correct message", () => {
    const result = productSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido");
    }
  });

  it("rejects empty SKU with correct message", () => {
    const result = productSchema.safeParse({ ...validInput, sku: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.sku?.[0]).toBe("El SKU es requerido");
    }
  });

  it("rejects empty category with correct message", () => {
    const result = productSchema.safeParse({ ...validInput, category: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.category?.[0]).toBe("La categoría es requerida");
    }
  });

  it("rejects empty unit_price with correct message", () => {
    const result = productSchema.safeParse({ ...validInput, unit_price: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.unit_price?.[0]).toBe("El precio es requerido");
    }
  });

  it("rejects empty weight_kg with correct message", () => {
    const result = productSchema.safeParse({ ...validInput, weight_kg: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.weight_kg?.[0]).toBe("El peso es requerido");
    }
  });

  it("rejects missing required fields (empty object)", () => {
    const result = productSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.name).toBeDefined();
      expect(errs.sku).toBeDefined();
      expect(errs.category).toBeDefined();
    }
  });
});
