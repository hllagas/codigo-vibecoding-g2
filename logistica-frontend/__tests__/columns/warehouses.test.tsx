import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WarehouseTable } from "@/components/warehouses/WarehouseTable";
import type { Warehouse } from "@/types/warehouse";

const baseWarehouse: Warehouse = {
  id: 1,
  name: "Central Warehouse",
  address: "Av. Industrial 100",
  city: "Lima",
  country: "Peru",
  latitude: "-12.046374",
  longitude: "-77.042793",
  capacity: 500,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("WarehouseTable columns", () => {
  // ── name column ─────────────────────────────────────────────────────────────
  it("renders warehouse name", () => {
    render(<WarehouseTable data={[baseWarehouse]} />);
    expect(screen.getByText("Central Warehouse")).toBeInTheDocument();
  });

  // ── city / country columns ───────────────────────────────────────────────────
  it("renders city and country", () => {
    render(<WarehouseTable data={[baseWarehouse]} />);
    expect(screen.getByText("Lima")).toBeInTheDocument();
    expect(screen.getByText("Peru")).toBeInTheDocument();
  });

  // ── capacity column ──────────────────────────────────────────────────────────
  it("renders capacity value", () => {
    render(<WarehouseTable data={[baseWarehouse]} />);
    // capacity 500 formats without thousands separator — safe across locales
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  // ── is_active column (StatusBadge) ───────────────────────────────────────────
  it("renders 'Activo' badge for active warehouse", () => {
    render(<WarehouseTable data={[{ ...baseWarehouse, is_active: true }]} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders 'Inactivo' badge for inactive warehouse", () => {
    render(<WarehouseTable data={[{ ...baseWarehouse, is_active: false }]} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<WarehouseTable data={[]} />);
    expect(screen.getByText("No hay almacenes registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <WarehouseTable
        data={[baseWarehouse]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar almacén")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar almacén")).toBeInTheDocument();
  });

  it("calls onEdit with the row warehouse when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<WarehouseTable data={[baseWarehouse]} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Editar almacén"));
    expect(onEdit).toHaveBeenCalledWith(baseWarehouse);
  });

  it("calls onDelete with the row warehouse when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<WarehouseTable data={[baseWarehouse]} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Eliminar almacén"));
    expect(onDelete).toHaveBeenCalledWith(baseWarehouse);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<WarehouseTable data={[baseWarehouse]} />);
    expect(screen.queryByLabelText("Editar almacén")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar almacén")).not.toBeInTheDocument();
  });
});
