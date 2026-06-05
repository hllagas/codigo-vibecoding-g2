import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerTable } from "@/components/customers/CustomerTable";
import type { Customer } from "@/types/customer";

const baseCustomer: Customer = {
  id: 1,
  name: "Acme SA",
  customer_type: "company",
  tax_id: "RUC123",
  email: "billing@acme.com",
  phone: "+51 987 654 321",
  address: "Av. Lima 100",
  city: "Lima",
  country: "Peru",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("CustomerTable columns", () => {
  // ── name column ─────────────────────────────────────────────────────────────
  it("renders customer name", () => {
    render(<CustomerTable data={[baseCustomer]} />);
    expect(screen.getByText("Acme SA")).toBeInTheDocument();
  });

  // ── customer_type column (CustomerTypeBadge) ─────────────────────────────────
  it("renders 'Empresa' badge for company type", () => {
    render(<CustomerTable data={[{ ...baseCustomer, customer_type: "company" }]} />);
    expect(screen.getByText("Empresa")).toBeInTheDocument();
  });

  it("renders 'Individual' badge for individual type", () => {
    render(<CustomerTable data={[{ ...baseCustomer, customer_type: "individual" }]} />);
    expect(screen.getByText("Individual")).toBeInTheDocument();
  });

  // ── email / city / country columns ────────────────────────────────────────────
  it("renders email, city, and country", () => {
    render(<CustomerTable data={[baseCustomer]} />);
    expect(screen.getByText("billing@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Lima")).toBeInTheDocument();
    expect(screen.getByText("Peru")).toBeInTheDocument();
  });

  // ── is_active column (StatusBadge) ───────────────────────────────────────────
  it("renders 'Activo' badge for active customer", () => {
    render(<CustomerTable data={[{ ...baseCustomer, is_active: true }]} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders 'Inactivo' badge for inactive customer", () => {
    render(<CustomerTable data={[{ ...baseCustomer, is_active: false }]} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<CustomerTable data={[]} />);
    expect(screen.getByText("No hay clientes registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <CustomerTable
        data={[baseCustomer]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar cliente")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar cliente")).toBeInTheDocument();
  });

  it("calls onEdit with the row customer when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<CustomerTable data={[baseCustomer]} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Editar cliente"));
    expect(onEdit).toHaveBeenCalledWith(baseCustomer);
  });

  it("calls onDelete with the row customer when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<CustomerTable data={[baseCustomer]} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Eliminar cliente"));
    expect(onDelete).toHaveBeenCalledWith(baseCustomer);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<CustomerTable data={[baseCustomer]} />);
    expect(screen.queryByLabelText("Editar cliente")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar cliente")).not.toBeInTheDocument();
  });
});
