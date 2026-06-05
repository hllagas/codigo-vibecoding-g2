import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransportTable } from "@/components/transports/TransportTable";
import type { Transport } from "@/types/transport";

const baseTransport: Transport = {
  id: 1,
  name: "Truck A",
  plate_number: "ABC-123",
  transport_type: "truck",
  capacity_kg: "5000.00",
  driver: 1,
  driver_detail: { id: 1, license_number: "LIC-001", phone: "+51 987", is_available: true },
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("TransportTable columns", () => {
  // ── name / plate_number columns ───────────────────────────────────────────────
  it("renders transport name and plate number", () => {
    render(<TransportTable data={[baseTransport]} />);
    expect(screen.getByText("Truck A")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
  });

  // ── transport_type column (TransportTypeBadge) ────────────────────────────────
  it("renders 'Camión' badge for truck", () => {
    render(<TransportTable data={[{ ...baseTransport, transport_type: "truck" }]} />);
    expect(screen.getByText("Camión")).toBeInTheDocument();
  });

  it("renders 'Furgoneta' badge for van", () => {
    render(<TransportTable data={[{ ...baseTransport, transport_type: "van" }]} />);
    expect(screen.getByText("Furgoneta")).toBeInTheDocument();
  });

  it("renders 'Moto' badge for motorcycle", () => {
    render(<TransportTable data={[{ ...baseTransport, transport_type: "motorcycle" }]} />);
    expect(screen.getByText("Moto")).toBeInTheDocument();
  });

  it("renders 'Bicicleta' badge for bicycle", () => {
    render(<TransportTable data={[{ ...baseTransport, transport_type: "bicycle" }]} />);
    expect(screen.getByText("Bicicleta")).toBeInTheDocument();
  });

  // ── capacity_kg column ────────────────────────────────────────────────────────
  it("renders capacity formatted with 'kg' suffix", () => {
    render(<TransportTable data={[baseTransport]} />);
    expect(screen.getByText("5000.00 kg")).toBeInTheDocument();
  });

  // ── driver column ─────────────────────────────────────────────────────────────
  it("renders driver license number when driver is assigned", () => {
    render(<TransportTable data={[baseTransport]} />);
    expect(screen.getByText("LIC-001")).toBeInTheDocument();
  });

  it("renders em dash when driver is null", () => {
    render(<TransportTable data={[{ ...baseTransport, driver: null, driver_detail: null }]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // ── is_active column (StatusBadge) ───────────────────────────────────────────
  it("renders 'Activo' badge for active transport", () => {
    render(<TransportTable data={[{ ...baseTransport, is_active: true }]} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders 'Inactivo' badge for inactive transport", () => {
    render(<TransportTable data={[{ ...baseTransport, is_active: false }]} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  // ── empty state ──────────────────────────────────────────────────────────────
  it("renders empty state message when data is empty", () => {
    render(<TransportTable data={[]} />);
    expect(screen.getByText("No hay transportes registrados")).toBeInTheDocument();
  });

  // ── actions column ───────────────────────────────────────────────────────────
  it("renders edit and delete buttons when handlers are provided", () => {
    render(
      <TransportTable
        data={[baseTransport]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Editar transporte")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar transporte")).toBeInTheDocument();
  });

  it("calls onEdit with the row transport when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<TransportTable data={[baseTransport]} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Editar transporte"));
    expect(onEdit).toHaveBeenCalledWith(baseTransport);
  });

  it("calls onDelete with the row transport when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<TransportTable data={[baseTransport]} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Eliminar transporte"));
    expect(onDelete).toHaveBeenCalledWith(baseTransport);
  });

  it("does not render action buttons when no handlers are provided", () => {
    render(<TransportTable data={[baseTransport]} />);
    expect(screen.queryByLabelText("Editar transporte")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Eliminar transporte")).not.toBeInTheDocument();
  });
});
