import { describe, it, expect, beforeEach } from "vitest";
import {
  registerUser,
  loginUser,
  deleteUser,
  getAllUsers,
  adminDeleteUser,
  adminChangePlan,
  adminExtendTrial,
  ROLES,
} from "./auth";

const seedAdmin = (extra = {}) => {
  const users = getAllUsers();
  users.push({
    id: "admin-super-user",
    name: "Root",
    email: "root@test.com",
    role: ROLES.ADMIN,
    isSuper: true,
    createdAt: new Date().toISOString(),
    subscription: { plan: "GYM", status: "ACTIVE", trialEndsAt: null },
    ...extra,
  } as any);
  localStorage.setItem("users", JSON.stringify(users));
};

describe("auth utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("registra un nuevo usuario y permite iniciar sesión con la misma contraseña", async () => {
    const user = await registerUser({
      email: "coach@test.com",
      password: "SuperSecreta123",
      name: "Coach Test",
      role: ROLES.TRAINER,
    });

    expect(user.email).toBe("coach@test.com");
    expect(user.passwordHash).toBeTruthy();

    const loggedIn = await loginUser("coach@test.com", "SuperSecreta123");
    expect(loggedIn.id).toBe(user.id);
  });

  it("rechaza login con contraseña incorrecta", async () => {
    await registerUser({
      email: "coach2@test.com",
      password: "ContraseñaCorrecta",
      name: "Coach Dos",
      role: ROLES.TRAINER,
    });

    await expect(
      loginUser("coach2@test.com", "ContraseñaIncorrecta"),
    ).rejects.toThrow();
  });

  it("rechaza registrar un email duplicado", async () => {
    await registerUser({
      email: "duplicado@test.com",
      password: "Password123",
      name: "Uno",
      role: ROLES.TRAINER,
    });

    await expect(
      registerUser({
        email: "duplicado@test.com",
        password: "OtraPassword123",
        name: "Dos",
        role: ROLES.TRAINER,
      }),
    ).rejects.toThrow();
  });

  it("el email no distingue mayúsculas", async () => {
    await registerUser({ email: "Mix@Test.com", password: "Password123", name: "Mix", role: ROLES.TRAINER });
    const u = await loginUser("mix@test.com", "Password123");
    expect(u.email).toBe("mix@test.com");
    await expect(
      registerUser({ email: "MIX@test.com", password: "Password123", name: "Otro", role: ROLES.TRAINER }),
    ).rejects.toThrow();
  });

  it("bloquea el login tras 5 intentos fallidos", async () => {
    await registerUser({ email: "lock@test.com", password: "Password123", name: "Lock", role: ROLES.TRAINER });
    for (let i = 0; i < 5; i++) {
      await expect(loginUser("lock@test.com", "mala")).rejects.toThrow();
    }
    await expect(loginUser("lock@test.com", "Password123")).rejects.toThrow(/intentos/i);
  });

  it("los límites Infinity sobreviven a la persistencia", async () => {
    await registerUser({ email: "inf@test.com", password: "Password123", name: "Inf", role: ROLES.TRAINER });
    const [u] = getAllUsers().filter((x) => x.email === "inf@test.com");
    expect(u.limits).toBeDefined();
    const values = Object.values(u.limits as Record<string, number>);
    expect(values.every((v) => v !== null)).toBe(true);
  });

  it("no lanza con JSON corrupto en users", () => {
    localStorage.setItem("users", "{no-json");
    expect(() => getAllUsers()).not.toThrow();
    expect(getAllUsers()).toEqual([]);
  });

  it("deleteUser protege al super admin", () => {
    seedAdmin();
    expect(() => deleteUser("admin-super-user")).toThrow();
  });

  it("las acciones admin rechazan a actores no administradores", async () => {
    const coach = await registerUser({ email: "c@test.com", password: "Password123", name: "C", role: ROLES.TRAINER });
    const victim = await registerUser({ email: "v@test.com", password: "Password123", name: "V", role: ROLES.ATHLETE });
    expect(() => adminDeleteUser(coach.id, victim.id)).toThrow();
    expect(() => adminChangePlan(coach.id, victim.id, "PRO")).toThrow();
    expect(() => adminExtendTrial(coach.id, victim.id, 7)).toThrow();
  });

  it("el admin puede cambiar plan, extender trial y eliminar, pero no al super admin", async () => {
    seedAdmin();
    const victim = await registerUser({ email: "v2@test.com", password: "Password123", name: "V2", role: ROLES.TRAINER });

    const changed = adminChangePlan("admin-super-user", victim.id, "PRO");
    expect(changed.subscription.plan).toBe("PRO");

    const extended = adminExtendTrial("admin-super-user", victim.id, 14);
    expect(new Date(extended.subscription.trialEndsAt as string).getTime()).toBeGreaterThan(Date.now() + 13 * 86400000);
    expect(() => adminExtendTrial("admin-super-user", victim.id, 0)).toThrow();

    expect(() => adminDeleteUser("admin-super-user", "admin-super-user")).toThrow();
    adminDeleteUser("admin-super-user", victim.id);
    expect(getAllUsers().some((u) => u.id === victim.id)).toBe(false);
  });
});