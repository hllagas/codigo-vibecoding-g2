import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import type { Supplier } from "@/types/supplier";

const baseSupplier: Supplier = {
  id: 1,
  name: "Acme Corp",
  tax_id: "ACM123",
  email: "contact@acme.com",
  phone: "+52 55 1234 5678",
  address: "123 Main St",
  city: "CDMX",
  country: "Mexico",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("SupplierTable columns", () => {
  // ── name column ─────────────────────────────────────────────────────────────
  it("renders supplier name", () => {
    render(<SupplierTable data={[baseSupplier]} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  // ── tax_id column ────────────────────────────────────────────────────────────
  it("renders tax_id value when present", () => {
    render(<SupplierTable data={[baseSupplier]} />);
    expect(screen.getByText("ACM123")).toBeInTheDocument();
  });

  it("renders em dash when tax_id is null", () => {
    render(<SupplierTable data={[{ ...baseSupplier, tax_id: null }]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // ── is_active column (StatusBadge) ───────────────────────────────────────────
  it("renders 'Activo' badge for active supplier", () => {
    render(<SupplierTable data={[{ ...baseSupplier, is_active: true }]} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders 'Inactivo' badge for inactive supplier", () => {
    render(<SupplierTable data={[{ ...baseSupplier, is_active: false }]} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  // ── other data columns ───────────────────────────────────────────────────────
  it("renders email, city, and country", () => {
    render(<SupplierTable data={[baseSupplier]} />);
    expect(screen.getByText("contact@acme.com")).toBeInTheDocument();
    expect(screen.getByText("CDMX")).toBeInTheDocument();
    expect(screen.getByText("Mexico")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<SupplierTable data={[]} />);
    expect(screen.getByText("No hay proveedores registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <SupplierTable
        data={[baseSupplier]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar proveedor")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar proveedor")).toBeInTheDocument();
  });

  it("calls onEdit with the row supplier when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<SupplierTable data={[baseSupplier]} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Editar proveedor"));
    expect(onEdit).toHaveBeenCalledWith(baseSupplier);
  });

  it("calls onDelete with the row supplier when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<SupplierTable data={[baseSupplier]} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Eliminar proveedor"));
    expect(onDelete).toHaveBeenCalledWith(baseSupplier);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<SupplierTable data={[baseSupplier]} />);
    expect(screen.queryByLabelText("Editar proveedor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar proveedor")).not.toBeInTheDocument();
  });
});
