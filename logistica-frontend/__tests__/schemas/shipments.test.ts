import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of itemSchema from components/shipments/ShipmentCreateForm.tsx (not exported)
const itemSchema = z.object({
  product: z.string().min(1, "Selecciona un producto"),
  quantity: z
    .string()
    .min(1, "La cantidad es requerida")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
      "Debe ser entero ≥ 1"
    ),
  unit_price_at_shipment: z.string().min(1, "El precio es requerido"),
});

// Mirror of shipmentSchema from components/shipments/ShipmentCreateForm.tsx (not exported)
const shipmentSchema = z.object({
  tracking_number: z.string().min(1, "El número de seguimiento es requerido"),
  customer: z.string().min(1, "El cliente es requerido"),
  origin_warehouse: z.string().min(1, "El almacén de origen es requerido"),
  route: z.string(),
  destination_address: z.string().min(1, "La dirección es requerida"),
  destination_city: z.string().min(1, "La ciudad es requerida"),
  destination_country: z.string().min(1, "El país es requerido"),
  status: z.enum(["pending", "processing", "in_transit", "delivered", "cancelled", "returned"]),
  scheduled_delivery_date: z.string().min(1, "La fecha es requerida"),
  actual_delivery_date: z.string(),
  total_weight_kg: z.string().min(1, "El peso es requerido"),
  notes: z.string(),
  items: z.array(itemSchema).min(1, "Agrega al menos un producto"),
});

// ── itemSchema tests ───────────────────────────────────────────────────────────

const validItem = {
  product: "1",
  quantity: "3",
  unit_price_at_shipment: "10.00",
};

describe("itemSchema (Zod)", () => {
  it("passes with valid item", () => {
    expect(itemSchema.safeParse(validItem).success).toBe(true);
  });

  it("rejects empty product with correct message", () => {
    const result = itemSchema.safeParse({ ...validItem, product: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.product?.[0]).toBe("Selecciona un producto");
    }
  });

  it("rejects empty quantity with correct message", () => {
    const result = itemSchema.safeParse({ ...validItem, quantity: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.quantity?.[0]).toBe("La cantidad es requerida");
    }
  });

  it("rejects non-integer quantity", () => {
    const result = itemSchema.safeParse({ ...validItem, quantity: "1.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.quantity?.[0]).toBe("Debe ser entero ≥ 1");
    }
  });

  it("rejects zero quantity", () => {
    const result = itemSchema.safeParse({ ...validItem, quantity: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects empty unit_price_at_shipment with correct message", () => {
    const result = itemSchema.safeParse({ ...validItem, unit_price_at_shipment: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.unit_price_at_shipment?.[0]).toBe("El precio es requerido");
    }
  });
});

// ── shipmentSchema tests ───────────────────────────────────────────────────────

const validShipment = {
  tracking_number: "TRK-001",
  customer: "1",
  origin_warehouse: "1",
  route: "none",
  destination_address: "Av. Lima 100",
  destination_city: "Lima",
  destination_country: "PE",
  status: "pending" as const,
  scheduled_delivery_date: "2024-07-01",
  actual_delivery_date: "",
  total_weight_kg: "5.00",
  notes: "",
  items: [validItem],
};

describe("shipmentSchema (Zod)", () => {
  it("passes with all required fields and one item", () => {
    expect(shipmentSchema.safeParse(validShipment).success).toBe(true);
  });

  it("passes for all status values", () => {
    for (const status of ["pending", "processing", "in_transit", "delivered", "cancelled", "returned"] as const) {
      expect(shipmentSchema.safeParse({ ...validShipment, status }).success).toBe(true);
    }
  });

  it("rejects empty tracking_number with correct message", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, tracking_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.tracking_number?.[0]).toBe(
        "El número de seguimiento es requerido"
      );
    }
  });

  it("rejects empty customer with correct message", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, customer: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.customer?.[0]).toBe("El cliente es requerido");
    }
  });

  it("rejects empty origin_warehouse with correct message", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, origin_warehouse: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.origin_warehouse?.[0]).toBe(
        "El almacén de origen es requerido"
      );
    }
  });

  it("rejects empty destination_city with correct message", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, destination_city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.destination_city?.[0]).toBe("La ciudad es requerida");
    }
  });

  it("rejects empty scheduled_delivery_date with correct message", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, scheduled_delivery_date: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.scheduled_delivery_date?.[0]).toBe("La fecha es requerida");
    }
  });

  it("rejects empty total_weight_kg with correct message", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, total_weight_kg: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.total_weight_kg?.[0]).toBe("El peso es requerido");
    }
  });

  it("rejects invalid status", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, status: "unknown" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toBeDefined();
    }
  });

  it("rejects empty items array", () => {
    const result = shipmentSchema.safeParse({ ...validShipment, items: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.items).toBeDefined();
    }
  });

  it("passes with multiple items", () => {
    const result = shipmentSchema.safeParse({
      ...validShipment,
      items: [validItem, { product: "2", quantity: "1", unit_price_at_shipment: "20.00" }],
    });
    expect(result.success).toBe(true);
  });
});
