import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductTable } from "@/components/products/ProductTable";
import type { Product } from "@/types/product";

const baseProduct: Product = {
  id: 1,
  name: "Widget A",
  description: "A widget",
  sku: "WGT-001",
  category: "Electronics",
  unit_price: "10.50",
  weight_kg: "1.500",
  supplier: 2,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const suppliersMap: Record<number, string> = { 2: "Acme Corp" };

describe("ProductTable columns", () => {
  // ── name / sku / category columns ────────────────────────────────────────────
  it("renders product name, SKU, and category", () => {
    render(<ProductTable data={[baseProduct]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("Widget A")).toBeInTheDocument();
    expect(screen.getByText("WGT-001")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  // ── unit_price column (parseFloat.toFixed(2)) ─────────────────────────────────
  it("renders unit_price formatted to 2 decimals", () => {
    render(<ProductTable data={[baseProduct]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("10.50")).toBeInTheDocument();
  });

  // ── weight_kg column (parseFloat.toFixed(3)) ─────────────────────────────────
  it("renders weight_kg formatted to 3 decimals", () => {
    render(<ProductTable data={[baseProduct]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("1.500")).toBeInTheDocument();
  });

  // ── supplier column ───────────────────────────────────────────────────────────
  it("renders supplier name from suppliersMap", () => {
    render(<ProductTable data={[baseProduct]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders 'ID {n}' when supplier not in map", () => {
    render(<ProductTable data={[{ ...baseProduct, supplier: 99 }]} suppliersMap={{}} />);
    expect(screen.getByText("ID 99")).toBeInTheDocument();
  });

  it("renders em dash when supplier is null", () => {
    render(<ProductTable data={[{ ...baseProduct, supplier: null }]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // ── is_active column (StatusBadge) ───────────────────────────────────────────
  it("renders 'Activo' badge for active product", () => {
    render(<ProductTable data={[{ ...baseProduct, is_active: true }]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders 'Inactivo' badge for inactive product", () => {
    render(<ProductTable data={[{ ...baseProduct, is_active: false }]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<ProductTable data={[]} suppliersMap={suppliersMap} />);
    expect(screen.getByText("No hay productos registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <ProductTable
        data={[baseProduct]}
        suppliersMap={suppliersMap}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar producto")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar producto")).toBeInTheDocument();
  });

  it("calls onEdit with the row product when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(
      <ProductTable data={[baseProduct]} suppliersMap={suppliersMap} onEdit={onEdit} />
    );
    await userEvent.click(screen.getByLabelText("Editar producto"));
    expect(onEdit).toHaveBeenCalledWith(baseProduct);
  });

  it("calls onDelete with the row product when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <ProductTable data={[baseProduct]} suppliersMap={suppliersMap} onDelete={onDelete} />
    );
    await userEvent.click(screen.getByLabelText("Eliminar producto"));
    expect(onDelete).toHaveBeenCalledWith(baseProduct);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<ProductTable data={[baseProduct]} suppliersMap={suppliersMap} />);
    expect(screen.queryByLabelText("Editar producto")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar producto")).not.toBeInTheDocument();
  });
});
