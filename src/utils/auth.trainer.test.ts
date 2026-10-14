import { describe, it, expect, beforeEach } from "vitest";
import {
  updateAthleteBasicInfo,
  setAthleteInjuries,
  getAllUsers,
  ROLES,
} from "./auth";

const user = (id: string, role: string) => ({
  id,
  name: id,
  email: `${id}@test.com`,
  role,
  passwordHash: null,
  createdAt: new Date().toISOString(),
  subscription: { plan: "FREE", status: "ACTIVE" },
  limits: {},
});

describe("datos de atletas editados por el entrenador", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "users",
      JSON.stringify([
        user("t1", ROLES.TRAINER),
        user("t2", ROLES.TRAINER),
        user("a1", ROLES.ATHLETE),
      ]),
    );
    localStorage.setItem(
      "athleteRequests",
      JSON.stringify([
        { trainerId: "t1", athleteId: "a1", status: "ACCEPTED" },
      ]),
    );
  });

  it("permite al entrenador asignado", () => {
    updateAthleteBasicInfo("t1", "a1", { sport: "Running" } as any);
    setAthleteInjuries("t1", "a1", [{ description: "Rodilla" }] as any);
    const a1 = getAllUsers().find((u) => u.id === "a1") as any;
    expect(a1.basicInfo.sport).toBe("Running");
    expect(a1.injuries).toHaveLength(1);
  });

  it("rechaza a otro entrenador, a un atleta y a ids inexistentes", () => {
    expect(() => updateAthleteBasicInfo("t2", "a1", {} as any)).toThrow();
    expect(() => setAthleteInjuries("t2", "a1", [])).toThrow();
    expect(() => updateAthleteBasicInfo("a1", "a1", {} as any)).toThrow();
    expect(() => updateAthleteBasicInfo("t1", "nadie", {} as any)).toThrow();
  });

  it("rechaza si la solicitud ya no est\u00e1 aceptada", () => {
    localStorage.setItem(
      "athleteRequests",
      JSON.stringify([{ trainerId: "t1", athleteId: "a1", status: "REMOVED" }]),
    );
    expect(() => updateAthleteBasicInfo("t1", "a1", {} as any)).toThrow();
  });
});
