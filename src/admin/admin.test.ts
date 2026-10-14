import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  registerUser,
  loginUser,
  getAllUsers,
  setCurrentUser,
  adminSetSuspended,
  adminResetUserPassword,
  adminUpdateUser,
  ROLES,
} from "@/utils/auth";
import { getAuditLog } from "@/admin/utils/auditLog";
import { csvCell, buildCsv } from "@/admin/utils/csv";
import { useEquipment } from "@/admin/hooks/useEquipment";
import { useIdleTimeout, IDLE_MINUTES_KEY } from "@/admin/hooks/useIdleTimeout";

const addAdmin = () => {
  const users = getAllUsers();
  users.push({
    id: "admin-1",
    name: "Admin",
    email: "admin@test.com",
    role: ROLES.ADMIN,
    passwordHash: null,
    createdAt: new Date().toISOString(),
    subscription: { plan: "FREE", status: "ACTIVE" },
    limits: {},
  } as any);
  localStorage.setItem("users", JSON.stringify(users));
  setCurrentUser(users[users.length - 1]);
};

describe("gestión de cuentas por el admin", () => {
  beforeEach(() => localStorage.clear());

  it("suspender bloquea el login y reactivar lo restaura", async () => {
    const u = await registerUser({
      email: "s@test.com",
      password: "Clave12345",
      name: "S",
    });
    addAdmin();
    adminSetSuspended("admin-1", u.id, true);
    await expect(loginUser("s@test.com", "Clave12345")).rejects.toThrow(
      /suspendida/,
    );
    adminSetSuspended("admin-1", u.id, false);
    await expect(loginUser("s@test.com", "Clave12345")).resolves.toBeTruthy();
  });

  it("audita los accesos fallidos solo de cuentas admin", async () => {
    const admin = await registerUser({
      email: "boss@test.com",
      password: "Clave12345",
      name: "Boss",
    });
    const users = getAllUsers().map((u) =>
      u.id === admin.id ? { ...u, role: ROLES.ADMIN } : u,
    );
    localStorage.setItem("users", JSON.stringify(users));
    await expect(loginUser("boss@test.com", "mala")).rejects.toThrow();
    await expect(loginUser("nadie@test.com", "mala")).rejects.toThrow();
    const log = getAuditLog().filter(
      (e) => e.action === "Intento de acceso fallido",
    );
    expect(log).toHaveLength(1);
  });

  it("no permite suspender administradores ni la propia cuenta", async () => {
    addAdmin();
    expect(() => adminSetSuspended("admin-1", "admin-1", true)).toThrow();
  });

  it("la clave temporal permite iniciar sesión y reemplaza la anterior", async () => {
    const u = await registerUser({
      email: "t@test.com",
      password: "Clave12345",
      name: "T",
    });
    addAdmin();
    const temp = await adminResetUserPassword("admin-1", u.id);
    expect(temp).toHaveLength(12);
    await expect(loginUser("t@test.com", temp)).resolves.toBeTruthy();
    await expect(loginUser("t@test.com", "Clave12345")).rejects.toThrow();
  });

  it("adminUpdateUser valida formato y duplicados", async () => {
    const a = await registerUser({
      email: "a@test.com",
      password: "Clave12345",
      name: "A",
    });
    await registerUser({
      email: "b@test.com",
      password: "Clave12345",
      name: "B",
    });
    addAdmin();
    expect(() => adminUpdateUser("admin-1", a.id, { email: "malo" })).toThrow(
      /email/i,
    );
    expect(() =>
      adminUpdateUser("admin-1", a.id, { email: "B@test.com" }),
    ).toThrow(/registrado/);
    const updated = adminUpdateUser("admin-1", a.id, {
      name: "  Nuevo ",
      email: "nuevo@test.com",
    });
    expect(updated.name).toBe("Nuevo");
    expect(updated.email).toBe("nuevo@test.com");
  });
});

describe("importEquipment", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("crm_equipment", "[]");
  });

  it("agrega válidos y omite inválidos y duplicados", () => {
    const { result } = renderHook(() => useEquipment());
    let res: any;
    act(() => {
      res = result.current.importEquipment([
        { name: "Remo", category: "Cardio", quantity: 2 },
        { name: "Remo", category: "Cardio", quantity: 1 },
        { name: "", category: "Cardio", quantity: 1 },
        { name: "Malo", category: "Cardio", quantity: 0 },
      ]);
    });
    expect(res).toMatchObject({ ok: true, added: 1, skipped: 3 });
    expect(result.current.equipment).toHaveLength(1);
  });

  it("updateMany cambia estado y valida fecha futura", () => {
    const { result } = renderHook(() => useEquipment());
    act(() => {
      result.current.importEquipment([
        {
          name: "H",
          category: "Cardio",
          quantity: 1,
          lastMaintenance: "2024-01-01",
        },
      ]);
    });
    const hid = result.current.equipment.find((e) => e.name === "H")!.id;
    act(() => {
      result.current.updateMany([hid], { lastMaintenance: "2024-02-01" });
    });
    expect(
      result.current.equipment.find((e) => e.id === hid)!.maintenanceHistory,
    ).toEqual(["2024-01-01", "2024-02-01"]);

    act(() => {
      result.current.importEquipment([
        { name: "A", category: "Cardio", quantity: 1 },
        { name: "B", category: "Cardio", quantity: 1 },
      ]);
    });
    const ids = result.current.equipment.map((e) => e.id);
    let res: any;
    act(() => {
      res = result.current.updateMany(ids, { status: "Mantenimiento" });
    });
    expect(res).toMatchObject({ ok: true, updated: 3 });
    expect(
      result.current.equipment.every((e) => e.status === "Mantenimiento"),
    ).toBe(true);
    expect(result.current.updateMany(ids, { status: "Roto" }).ok).toBe(false);
    expect(
      result.current.updateMany(ids, { lastMaintenance: "2999-01-01" }).ok,
    ).toBe(false);
  });

  it("rechaza un formato que no es lista", () => {
    const { result } = renderHook(() => useEquipment());
    expect(result.current.importEquipment({ foo: 1 }).ok).toBe(false);
  });

  it("dryRun cuenta sin guardar", () => {
    const { result } = renderHook(() => useEquipment());
    let res: any;
    act(() => {
      res = result.current.importEquipment(
        [{ name: "Remo", category: "Cardio", quantity: 2 }],
        true,
      );
    });
    expect(res).toMatchObject({ ok: true, added: 1, skipped: 0 });
    expect(result.current.equipment).toHaveLength(0);
  });

  it("deshace una eliminación con restoreEquipment", () => {
    const { result } = renderHook(() => useEquipment());
    act(() => {
      result.current.importEquipment([
        { name: "Remo", category: "Cardio", quantity: 2 },
      ]);
    });
    const item = result.current.equipment[0]!;
    act(() => result.current.deleteEquipment(item.id));
    expect(result.current.equipment).toHaveLength(0);
    act(() => {
      result.current.restoreEquipment(item);
    });
    expect(result.current.equipment).toHaveLength(1);
  });
});

describe("csv", () => {
  it("escapa comillas, neutraliza fórmulas y usa BOM + CRLF", () => {
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell("=SUMA(A1)")).toBe(`"'=SUMA(A1)"`);
    expect(csvCell(null)).toBe('""');
    const csv = buildCsv(["A", "B"], [[1, "x"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"A","B"\r\n"1","x"');
  });
});

describe("useIdleTimeout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("avisa y cierra tras el tiempo configurado", () => {
    localStorage.setItem(IDLE_MINUTES_KEY, "2");
    const warn = vi.fn();
    const end = vi.fn();
    renderHook(() => useIdleTimeout(warn, end));
    vi.advanceTimersByTime(60_000);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("no hace nada si está desactivado (0)", () => {
    localStorage.setItem(IDLE_MINUTES_KEY, "0");
    const end = vi.fn();
    renderHook(() => useIdleTimeout(vi.fn(), end));
    vi.advanceTimersByTime(10 * 60 * 60_000);
    expect(end).not.toHaveBeenCalled();
  });
});
