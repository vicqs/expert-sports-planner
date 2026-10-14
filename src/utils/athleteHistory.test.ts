import { describe, it, expect } from "vitest";
import {
  getAthletePlans,
  getPlanStats,
  getExerciseProgress,
  getSessionLog,
  getAthleticsSummary,
  getAthleticsParts,
} from "./athleteHistory";

describe("getAthleticsParts", () => {
  it("marca hechas y no hechas las partes de la sesión", () => {
    const parts = getAthleticsParts({
      warmup: "10 min trote",
      mainSegments: ["4x400", "2x800"],
      mainBlock: "4x400 + 2x800",
      cooldown: "5 min",
      completedParts: ["warmup", "main:1"],
    });
    expect(parts.map((p) => [p.key, p.done])).toEqual([
      ["warmup", true],
      ["main:0", false],
      ["main:1", true],
      ["cooldown", false],
    ]);
  });
});

const plan = (id: string, start: string, weight: string, done: boolean) => ({
  id,
  name: "Ana",
  trainerId: "t1",
  status: "COMPLETED",
  startDate: start,
  planObject: [
    {
      weekNum: 1,
      days: [
        {
          dayName: "Lunes",
          completed: done,
          session: {
            exercises: [
              {
                name: "Sentadilla",
                sets: 3,
                weight,
                unit: "kg",
                completedSets: done ? [0, 1, 2] : [],
              },
            ],
          },
        },
        { dayName: "Martes", session: null },
      ],
    },
  ],
});

describe("historial del atleta", () => {
  const athlete = { id: "a1", name: "Ana" };

  it("registra sesiones de atletismo y gimnasio con su detalle", () => {
    const p: any = {
      startDate: "2026-01-05T12:00:00.000Z",
      planObject: [
        {
          weekNum: 1,
          days: [
            {
              dayName: "Lunes",
              isGym: false,
              completed: true,
              note: "Buen ritmo",
              session: {
                type: { code: "R" },
                training: { name: "Series" },
                warmup: "8'",
                mainBlock: "6 [1k]",
                cooldown: "5'",
              },
            },
            { dayName: "Martes", session: null },
            plan("x", "2026-01-01", "40", true).planObject[0].days[0],
          ],
        },
      ],
    };
    const log = getSessionLog(p, 0);
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({
      isGym: false,
      title: "R · Series",
      mainBlock: "6 [1k]",
      note: "Buen ritmo",
      completed: true,
    });
    expect(log[1].exercises[0]).toMatchObject({
      name: "Sentadilla",
      setsDone: 3,
    });
    expect(getAthleticsSummary([p])).toEqual([
      { name: "R · Series", done: 1, total: 1 },
    ]);
  });

  it("ordena los planes y excluye los de otro atleta o entrenador", () => {
    const clients = [
      plan("p2", "2026-03-01", "50", true),
      plan("p1", "2026-01-01", "40", true),
      { ...plan("x", "2026-02-01", "10", true), name: "Otra" },
      { ...plan("y", "2026-02-01", "10", true), trainerId: "t2" },
    ];
    const plans = getAthletePlans(clients, "t1", athlete);
    expect(plans.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("calcula cumplimiento y series", () => {
    const s = getPlanStats(plan("p", "2026-01-01", "40", true));
    expect(s).toMatchObject({
      totalSessions: 1,
      doneSessions: 1,
      adherence: 100,
      setsPlanned: 3,
      setsDone: 3,
    });
  });

  it("mide la evolución de carga entre planes e ignora series no hechas", () => {
    const plans = [
      plan("p1", "2026-01-01", "40", true),
      plan("p2", "2026-03-01", "50", true),
    ];
    const [ex] = getExerciseProgress(plans);
    expect(ex.name).toBe("Sentadilla");
    expect(ex.delta).toBe(10);
    expect(getExerciseProgress([plan("p", "2026-01-01", "40", false)])).toEqual(
      [],
    );
  });
});
