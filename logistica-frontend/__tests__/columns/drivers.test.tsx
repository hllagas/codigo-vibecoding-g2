import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DriverTable } from "@/components/drivers/DriverTable";
import type { Driver } from "@/types/driver";

const baseDriver: Driver = {
  id: 1,
  user: 10,
  user_detail: { id: 10, username: "jsmith", email: "j@example.com", first_name: "John", last_name: "Smith" },
  license_number: "LIC-001",
  license_expiry: "2030-12-31",
  phone: "+51 987 654 321",
  is_available: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("DriverTable columns", () => {
  // ── full_name column ─────────────────────────────────────────────────────────
  it("renders full name from first_name and last_name", () => {
    render(<DriverTable data={[baseDriver]} />);
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("falls back to username when names are empty", () => {
    const driver: Driver = {
      ...baseDriver,
      user_detail: { ...baseDriver.user_detail, first_name: "", last_name: "" },
    };
    render(<DriverTable data={[driver]} />);
    expect(screen.getByText("jsmith")).toBeInTheDocument();
  });

  // ── license_number column ────────────────────────────────────────────────────
  it("renders license number", () => {
    render(<DriverTable data={[baseDriver]} />);
    expect(screen.getByText("LIC-001")).toBeInTheDocument();
  });

  // ── license_expiry column (LicenseExpiryBadge) ────────────────────────────────
  it("renders license expiry date string", () => {
    render(<DriverTable data={[baseDriver]} />);
    expect(screen.getByText("2030-12-31")).toBeInTheDocument();
  });

  // ── phone column ─────────────────────────────────────────────────────────────
  it("renders phone number", () => {
    render(<DriverTable data={[baseDriver]} />);
    expect(screen.getByText("+51 987 654 321")).toBeInTheDocument();
  });

  // ── is_available column (DriverAvailabilityBadge) ─────────────────────────────
  it("renders 'Disponible' badge for available driver", () => {
    render(<DriverTable data={[{ ...baseDriver, is_available: true }]} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders 'No disponible' badge for unavailable driver", () => {
    render(<DriverTable data={[{ ...baseDriver, is_available: false }]} />);
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<DriverTable data={[]} />);
    expect(screen.getByText("No hay conductores registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <DriverTable
        data={[baseDriver]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar conductor")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar conductor")).toBeInTheDocument();
  });

  it("calls onEdit with the row driver when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<DriverTable data={[baseDriver]} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Editar conductor"));
    expect(onEdit).toHaveBeenCalledWith(baseDriver);
  });

  it("calls onDelete with the row driver when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<DriverTable data={[baseDriver]} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Eliminar conductor"));
    expect(onDelete).toHaveBeenCalledWith(baseDriver);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<DriverTable data={[baseDriver]} />);
    expect(screen.queryByLabelText("Editar conductor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar conductor")).not.toBeInTheDocument();
  });
});
