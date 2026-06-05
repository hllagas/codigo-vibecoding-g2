import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";
import type { Shipment } from "@/types/shipment";

const baseShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-001",
  customer: 1,
  origin_warehouse: 1,
  route: null,
  destination_address: "Av. Lima 100",
  destination_city: "Lima",
  destination_country: "PE",
  status: "pending",
  scheduled_delivery_date: "2024-07-01",
  actual_delivery_date: null,
  total_weight_kg: "5.00",
  notes: null,
  items: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const customersMap: Record<number, string> = { 1: "Acme Corp" };

describe("ShipmentTable columns", () => {
  // ── tracking_number column ───────────────────────────────────────────────────
  it("renders tracking number", () => {
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} />);
    expect(screen.getByText("TRK-001")).toBeInTheDocument();
  });

  // ── customer column ───────────────────────────────────────────────────────────
  it("renders customer name from customersMap", () => {
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders 'ID {n}' when customer not in map", () => {
    render(<ShipmentTable data={[{ ...baseShipment, customer: 99 }]} customersMap={{}} />);
    expect(screen.getByText("ID 99")).toBeInTheDocument();
  });

  // ── destination_city column ──────────────────────────────────────────────────
  it("renders destination city", () => {
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} />);
    expect(screen.getByText("Lima")).toBeInTheDocument();
  });

  // ── status column (ShipmentStatusBadge) ──────────────────────────────────────
  it("renders 'Pendiente' for pending status", () => {
    render(<ShipmentTable data={[{ ...baseShipment, status: "pending" }]} customersMap={customersMap} />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("renders 'Procesando' for processing status", () => {
    render(<ShipmentTable data={[{ ...baseShipment, status: "processing" }]} customersMap={customersMap} />);
    expect(screen.getByText("Procesando")).toBeInTheDocument();
  });

  it("renders 'En tránsito' for in_transit status", () => {
    render(<ShipmentTable data={[{ ...baseShipment, status: "in_transit" }]} customersMap={customersMap} />);
    expect(screen.getByText("En tránsito")).toBeInTheDocument();
  });

  it("renders 'Entregado' for delivered status", () => {
    render(<ShipmentTable data={[{ ...baseShipment, status: "delivered" }]} customersMap={customersMap} />);
    expect(screen.getByText("Entregado")).toBeInTheDocument();
  });

  it("renders 'Cancelado' for cancelled status", () => {
    render(<ShipmentTable data={[{ ...baseShipment, status: "cancelled" }]} customersMap={customersMap} />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("renders 'Devuelto' for returned status", () => {
    render(<ShipmentTable data={[{ ...baseShipment, status: "returned" }]} customersMap={customersMap} />);
    expect(screen.getByText("Devuelto")).toBeInTheDocument();
  });

  // ── scheduled_delivery_date column ──────────────────────────────────────────
  it("renders scheduled delivery date as plain string", () => {
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} />);
    expect(screen.getByText("2024-07-01")).toBeInTheDocument();
  });

  // ── total_weight_kg column ────────────────────────────────────────────────────
  it("renders weight formatted with 'kg' suffix", () => {
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} />);
    expect(screen.getByText("5.00 kg")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<ShipmentTable data={[]} customersMap={customersMap} />);
    expect(screen.getByText("No hay envíos registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <ShipmentTable
        data={[baseShipment]}
        customersMap={customersMap}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar envío")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar envío")).toBeInTheDocument();
  });

  it("calls onEdit with the row shipment when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Editar envío"));
    expect(onEdit).toHaveBeenCalledWith(baseShipment);
  });

  it("calls onDelete with the row shipment when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Eliminar envío"));
    expect(onDelete).toHaveBeenCalledWith(baseShipment);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<ShipmentTable data={[baseShipment]} customersMap={customersMap} />);
    expect(screen.queryByLabelText("Editar envío")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar envío")).not.toBeInTheDocument();
  });
});
