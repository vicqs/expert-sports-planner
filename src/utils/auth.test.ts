import { describe, it, expect, beforeEach } from "vitest";
import { registerUser, loginUser, ROLES } from "./auth";

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
});
