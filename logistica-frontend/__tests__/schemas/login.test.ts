import { describe, it, expect } from "vitest";
import { z } from "zod";

// Same schema defined in app/login/page.tsx (not exported from prod code)
const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

describe("loginSchema (Zod)", () => {
  it("rejects empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "valid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.username?.[0];
      expect(msg).toBe("El usuario es requerido");
    }
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ username: "valid", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.password?.[0];
      expect(msg).toBe("La contraseña es requerida");
    }
  });

  it("rejects both fields empty", () => {
    const result = loginSchema.safeParse({ username: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.username?.[0]).toBe("El usuario es requerido");
      expect(errs.password?.[0]).toBe("La contraseña es requerida");
    }
  });

  it("passes with valid username and password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "secret123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ username: "admin", password: "secret123" });
    }
  });

  it("rejects missing fields (undefined)", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
