import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerUser,
  loginUser,
  getAllUsers,
  getCurrentUser,
  setCurrentUser,
  adminChangePlan,
  adminDeleteUser,
  adminRestoreUser,
  adminExtendTrial,
  adminChangeOwnPassword,
  adminCreateUser,
  isValidEmail,
  ROLES,
} from "./auth";
import {
  getAuditLog,
  logAdminAction,
  clearAuditLog,
  AUDIT_ERROR_EVENT,
} from "@/admin/utils/auditLog";

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const seedUsers = (users: any[]) =>
  localStorage.setItem("users", JSON.stringify(users));

const baseUser = (extra: any = {}) => ({
  id: "u1",
  name: "Usuario",
  email: "u1@test.com",
  role: ROLES.TRAINER,
  passwordHash: null,
  createdAt: new Date().toISOString(),
  subscription: { plan: "FREE", status: "TRIAL", trialEndsAt: null },
  limits: {},
  ...extra,
});

describe("hash de contraseñas", () => {
  beforeEach(() => localStorage.clear());

  it("usa PBKDF2 con sal distinta por usuario", async () => {
    const a = await registerUser({
      email: "a@test.com",
      password: "MismaClave123",
      name: "A",
    });
    const b = await registerUser({
      email: "b@test.com",
      password: "MismaClave123",
      name: "B",
    });
    expect(a.passwordHash).toMatch(/^pbkdf2\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(a.passwordHash).not.toBe(b.passwordHash);
  });

  it("acepta un hash SHA-256 antiguo y lo migra a PBKDF2", async () => {
    seedUsers([baseUser({ passwordHash: await sha256("ClaveAntigua1") })]);
    const user = await loginUser("u1@test.com", "ClaveAntigua1");
    expect(user.passwordHash).toMatch(/^pbkdf2\$/);
    expect(getAllUsers()[0].passwordHash).toMatch(/^pbkdf2\$/);
    // Sigue funcionando tras la migración
    await expect(
      loginUser("u1@test.com", "ClaveAntigua1"),
    ).resolves.toBeTruthy();
    await expect(loginUser("u1@test.com", "otra")).rejects.toThrow();
  });
});

describe("validación de email", () => {
  beforeEach(() => localStorage.clear());

  it("isValidEmail distingue formatos", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("sin-arroba")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });

  it("registerUser rechaza un email inválido", async () => {
    await expect(
      registerUser({ email: "no-es-email", password: "Clave1234", name: "X" }),
    ).rejects.toThrow(/email/i);
  });
});

describe("acciones de administrador", () => {
  const admin = () =>
    baseUser({
      id: "admin-1",
      name: "Admin",
      email: "admin@test.com",
      role: ROLES.ADMIN,
    });

  beforeEach(() => localStorage.clear());

  it("crea un entrenador con clave temporal que permite iniciar sesión", async () => {
    seedUsers([admin()]);
    setCurrentUser(admin() as any);
    const { user, tempPassword } = await adminCreateUser("admin-1", {
      name: "Nuevo Coach",
      email: "coach@test.com",
      role: ROLES.TRAINER,
    });
    expect(tempPassword).toHaveLength(12);
    expect(user.role).toBe(ROLES.TRAINER);
    await expect(
      loginUser("coach@test.com", tempPassword),
    ).resolves.toBeTruthy();
  });

  it("no permite crear administradores ni cuentas sin email", async () => {
    seedUsers([admin()]);
    setCurrentUser(admin() as any);
    await expect(
      adminCreateUser("admin-1", {
        name: "X",
        email: "x@test.com",
        role: ROLES.ADMIN,
      }),
    ).rejects.toThrow(/entrenadores o atletas/);
    await expect(
      adminCreateUser("admin-1", {
        name: "Y",
        email: "",
        role: ROLES.ATHLETE,
      }),
    ).rejects.toThrow(/email/i);
  });

  it("rechaza a un actor que no es admin", () => {
    seedUsers([
      baseUser(),
      baseUser({ id: "u2", name: "Otro", email: "o@t.com" }),
    ]);
    expect(() => adminChangePlan("u1", "u2", "PRO")).toThrow(/administradores/);
  });

  it("rechaza si la sesión activa es otra persona", () => {
    seedUsers([admin(), baseUser()]);
    setCurrentUser(baseUser() as any);
    expect(() => adminChangePlan("admin-1", "u1", "PRO")).toThrow(
      /administradores/,
    );
  });

  it("no permite al admin cambiar su propio plan", () => {
    seedUsers([admin(), baseUser()]);
    setCurrentUser(admin() as any);
    expect(() => adminChangePlan("admin-1", "admin-1", "PRO")).toThrow(
      /propio plan/,
    );
  });

  it("cambia el plan y extiende el trial de un usuario", () => {
    seedUsers([admin(), baseUser()]);
    setCurrentUser(admin() as any);
    adminChangePlan("admin-1", "u1", "PRO");
    expect(getAllUsers().find((u) => u.id === "u1")?.subscription.plan).toBe(
      "PRO",
    );
    const updated = adminExtendTrial("admin-1", "u1", 7);
    expect(updated.subscription.status).toBe("TRIAL");
    expect(() => adminExtendTrial("admin-1", "u1", 0)).toThrow();
  });

  it("no permite eliminarse a sí mismo ni al super admin", () => {
    seedUsers([
      admin(),
      baseUser({ id: "root", isSuper: true, role: ROLES.ADMIN }),
    ]);
    expect(() => adminDeleteUser("admin-1", "admin-1")).toThrow();
    expect(() => adminDeleteUser("admin-1", "root")).toThrow();
  });

  it("elimina y restaura una cuenta (rollback)", () => {
    seedUsers([admin(), baseUser()]);
    setCurrentUser(admin() as any);
    const removed = adminDeleteUser("admin-1", "u1");
    expect(getAllUsers().some((u) => u.id === "u1")).toBe(false);
    adminRestoreUser("admin-1", removed);
    adminRestoreUser("admin-1", removed);
    expect(getAllUsers().filter((u) => u.id === "u1")).toHaveLength(1);
  });

  it("cambia la contraseña propia validando la actual y la política", async () => {
    const current = await registerUser({
      email: "boss@test.com",
      password: "ClaveActual123",
      name: "Boss",
      role: ROLES.ADMIN,
    });
    setCurrentUser(current);
    await expect(
      adminChangeOwnPassword(current.id, "incorrecta", "NuevaClave12345"),
    ).rejects.toThrow(/actual/);
    await expect(
      adminChangeOwnPassword(current.id, "ClaveActual123", "corta"),
    ).rejects.toThrow(/al menos/);
    await expect(
      adminChangeOwnPassword(current.id, "ClaveActual123", "ClaveActual123"),
    ).rejects.toThrow(/distinta/);
    await adminChangeOwnPassword(
      current.id,
      "ClaveActual123",
      "NuevaClave12345",
    );
    expect(getCurrentUser()?.passwordHash).toBe(
      getAllUsers().find((u) => u.id === current.id)?.passwordHash,
    );
    await expect(
      loginUser("boss@test.com", "NuevaClave12345"),
    ).resolves.toBeTruthy();
    await expect(
      loginUser("boss@test.com", "ClaveActual123"),
    ).rejects.toThrow();
  });
});

describe("bitácora de auditoría", () => {
  beforeEach(() => localStorage.clear());

  it("registra, ordena (más reciente primero) y limpia", () => {
    logAdminAction("a", "Primera");
    logAdminAction("a", "Segunda", "detalle");
    const log = getAuditLog();
    expect(log.map((e) => e.action)).toEqual(["Segunda", "Primera"]);
    expect(log[0].detail).toBe("detalle");
    clearAuditLog();
    expect(getAuditLog()).toEqual([]);
  });

  it("conserva como máximo 1000 entradas", () => {
    for (let i = 0; i < 1005; i++) logAdminAction("a", `acción ${i}`);
    expect(getAuditLog()).toHaveLength(1000);
  });

  it("tolera datos corruptos", () => {
    localStorage.setItem("admin_audit_log", "{no-json");
    expect(getAuditLog()).toEqual([]);
  });

  it("emite un evento de error si no puede guardar", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let fired = 0;
    const onErr = () => fired++;
    window.addEventListener(AUDIT_ERROR_EVENT, onErr);
    logAdminAction("a", "X");
    window.removeEventListener(AUDIT_ERROR_EVENT, onErr);
    spy.mockRestore();
    errSpy.mockRestore();
    expect(fired).toBe(1);
  });
});
