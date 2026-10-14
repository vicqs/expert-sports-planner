// Historial de un atleta para el entrenador: planes anteriores, cumplimiento y
// evolución de la carga por ejercicio. Son funciones puras sobre los datos que
// ya guarda MockDatabase (`planObject`, `completed`, `completedSets`).

export interface AthleteRef {
  id: string;
  name?: string;
  email?: string;
}

export interface PlanStats {
  totalSessions: number;
  doneSessions: number;
  adherence: number; // 0-100
  setsPlanned: number;
  setsDone: number;
}

export interface ExercisePoint {
  planIndex: number;
  maxWeight: number;
  setsDone: number;
  setsPlanned: number;
}

export interface ExerciseProgress {
  name: string;
  unit: string;
  points: ExercisePoint[];
  delta: number | null; // último - primero (solo con 2+ planes con carga)
}

const norm = (s?: string) => (s || "").toLowerCase().trim();

/** Un registro de `clients` pertenece al atleta si coincide id, email o nombre. */
export const belongsToAthlete = (client: any, athlete: AthleteRef) => {
  if (!client || !athlete) return false;
  if (athlete.id) {
    if (client.id === athlete.id) return true;
    if (String(client.id || "").startsWith(`${athlete.id}-`)) return true;
  }
  const email = norm(athlete.email);
  if (email && norm(client.email) === email) return true;
  if (!norm(client.email) && athlete.name) {
    return norm(client.name) === norm(athlete.name);
  }
  return false;
};

const startOf = (c: any) =>
  new Date(c.startDate || c.planCreatedAt || c.submittedAt || 0).getTime();

/** Planes (activos y completados) del atleta con este entrenador, del más antiguo al más reciente. */
export const getAthletePlans = (
  clients: any[],
  trainerId: string | null,
  athlete: AthleteRef,
) =>
  (clients || [])
    .filter(
      (c) =>
        c?.planObject &&
        Array.isArray(c.planObject) &&
        (c.status === "ACTIVE" || c.status === "COMPLETED") &&
        (!trainerId || c.trainerId === trainerId) &&
        belongsToAthlete(c, athlete),
    )
    .sort((a, b) => startOf(a) - startOf(b));

const daysOf = (plan: any): any[] =>
  (Array.isArray(plan?.planObject) ? plan.planObject : []).flatMap(
    (w: any) => w?.days || [],
  );

const exercisesOf = (day: any): any[] =>
  day?.session?.exercises || day?.exercises || [];

export const getPlanStats = (plan: any): PlanStats => {
  const days = daysOf(plan);
  const trainingDays = days.filter((d) => d?.session);
  const totalSessions = trainingDays.length;
  const doneSessions = trainingDays.filter((d) => d.completed).length;
  let setsPlanned = 0;
  let setsDone = 0;
  trainingDays.forEach((d) => {
    exercisesOf(d).forEach((ex) => {
      const planned = Number(ex?.sets) || 0;
      setsPlanned += planned;
      setsDone += Math.min(
        planned || Infinity,
        Array.isArray(ex?.completedSets) ? ex.completedSets.length : 0,
      );
    });
  });
  return {
    totalSessions,
    doneSessions,
    adherence: totalSessions
      ? Math.round((doneSessions / totalSessions) * 100)
      : 0,
    setsPlanned,
    setsDone,
  };
};

export const parseWeight = (w: unknown) => {
  const n = parseFloat(String(w ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export interface SessionExercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  unit: string;
  rest: string;
  setsDone: number;
}

export interface SessionPart {
  key: string; // "warmup" | "main" | "main:<i>" | "cooldown"
  label: string;
  text: string;
  done: boolean;
}

/**
 * Partes de una sesión de atletismo que el atleta puede marcar: calentamiento,
 * bloque principal (una por ficha si existen `mainSegments`) y enfriamiento.
 * Lo realizado se guarda en `session.completedParts`.
 */
export const getAthleticsParts = (session: any): SessionPart[] => {
  if (!session) return [];
  const doneKeys: string[] = Array.isArray(session.completedParts)
    ? session.completedParts
    : [];
  const part = (key: string, label: string, text: string): SessionPart => ({
    key,
    label,
    text,
    done: doneKeys.includes(key),
  });
  const parts: SessionPart[] = [];
  if (typeof session.warmup === "string" && session.warmup) {
    parts.push(part("warmup", "Calentamiento", session.warmup));
  }
  const segments: string[] = Array.isArray(session.mainSegments)
    ? session.mainSegments.filter(Boolean)
    : [];
  if (segments.length > 0) {
    segments.forEach((seg, i) =>
      parts.push(part(`main:${i}`, `Bloque principal ${i + 1}`, seg)),
    );
  } else if (typeof session.mainBlock === "string" && session.mainBlock) {
    parts.push(part("main", "Bloque principal", session.mainBlock));
  }
  if (typeof session.cooldown === "string" && session.cooldown) {
    parts.push(part("cooldown", "Enfriamiento", session.cooldown));
  }
  return parts;
};

export interface SessionEntry {
  planIndex: number;
  weekNum: number;
  dayName: string;
  date: Date | null;
  isGym: boolean;
  title: string;
  completed: boolean;
  note: string;
  exercises: SessionExercise[]; // gimnasio
  parts: SessionPart[]; // atletismo
  warmup: string; // atletismo
  mainBlock: string;
  cooldown: string;
}

const label = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v.name || v.code || "");
};

/**
 * Texto de la próxima sesión pendiente del plan ("Hoy", "Mañana" o
 * "Lunes 12 oct"), o null si no queda ninguna sesión sin completar desde hoy.
 */
export const getNextSessionLabel = (
  plan: any,
  today: Date = new Date(),
): string | null => {
  const weeks: any[] = Array.isArray(plan?.planObject) ? plan.planObject : [];
  const start = plan?.startDate ? new Date(plan.startDate) : null;
  if (!start || isNaN(start.getTime())) return null;
  const base = new Date(start);
  base.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  let counter = 0;
  for (const week of weeks) {
    for (const day of week?.days || []) {
      const date = new Date(base);
      date.setDate(date.getDate() + counter++);
      if (!day?.session || day.completed || date < now) continue;
      const diff = Math.round((date.getTime() - now.getTime()) / 86400000);
      if (diff === 0) return "Hoy";
      if (diff === 1) return "Mañana";
      const text = date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
  }
  return null;
};

/** Una entrada por cada sesión de entrenamiento del plan (gimnasio y atletismo). */
export const getSessionLog = (plan: any, planIndex: number): SessionEntry[] => {
  const weeks: any[] = Array.isArray(plan?.planObject) ? plan.planObject : [];
  const start = plan?.startDate ? new Date(plan.startDate) : null;
  const entries: SessionEntry[] = [];
  let counter = 0;
  weeks.forEach((week, w) => {
    (week?.days || []).forEach((day: any) => {
      const offset = counter++;
      const s = day?.session;
      if (!s) return;
      let date: Date | null = null;
      if (start && !isNaN(start.getTime())) {
        date = new Date(start);
        date.setDate(date.getDate() + offset);
      }
      const isGym = Array.isArray(s.exercises) || Boolean(day.isGym);
      entries.push({
        planIndex,
        weekNum: week.weekNum || w + 1,
        dayName: day.dayName || "",
        date,
        isGym,
        title: isGym
          ? s.title || "Gimnasio"
          : [label(s.type), label(s.training)].filter(Boolean).join(" · ") ||
            "Atletismo",
        completed: Boolean(day.completed),
        note: day.note || "",
        exercises: (Array.isArray(s.exercises) ? s.exercises : []).map(
          (ex: any) => ({
            name: ex?.name || "",
            sets: Number(ex?.sets) || 0,
            reps: String(ex?.reps ?? ""),
            weight: String(ex?.weight ?? ""),
            unit: ex?.unit || "",
            rest: String(ex?.rest ?? ""),
            setsDone: Array.isArray(ex?.completedSets)
              ? ex.completedSets.length
              : 0,
          }),
        ),
        parts: isGym ? [] : getAthleticsParts(s),
        warmup: typeof s.warmup === "string" ? s.warmup : "",
        mainBlock: typeof s.mainBlock === "string" ? s.mainBlock : "",
        cooldown: typeof s.cooldown === "string" ? s.cooldown : "",
      });
    });
  });
  return entries;
};

/** Sesiones de atletismo por tipo de entrenamiento: hechas / planificadas. */
export const getAthleticsSummary = (plans: any[]) => {
  const map = new Map<string, { name: string; done: number; total: number }>();
  plans.forEach((p, i) =>
    getSessionLog(p, i)
      .filter((e) => !e.isGym)
      .forEach((e) => {
        const entry = map.get(e.title) || { name: e.title, done: 0, total: 0 };
        entry.total += 1;
        if (e.completed) entry.done += 1;
        map.set(e.title, entry);
      }),
  );
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
};

/** Carga máxima trabajada por ejercicio en cada plan (solo series realizadas). */
export const getExerciseProgress = (plans: any[]): ExerciseProgress[] => {
  const map = new Map<string, ExerciseProgress>();
  plans.forEach((plan, planIndex) => {
    const perPlan = new Map<string, ExercisePoint & { unit: string }>();
    daysOf(plan).forEach((d) => {
      exercisesOf(d).forEach((ex) => {
        if (!ex?.name) return;
        const done = Array.isArray(ex.completedSets)
          ? ex.completedSets.length
          : 0;
        const point = perPlan.get(ex.name) || {
          planIndex,
          maxWeight: 0,
          setsDone: 0,
          setsPlanned: 0,
          unit: ex.unit || "lb",
        };
        point.setsPlanned += Number(ex.sets) || 0;
        point.setsDone += done;
        if (done > 0) {
          point.maxWeight = Math.max(point.maxWeight, parseWeight(ex.weight));
        }
        point.unit = ex.unit || point.unit;
        perPlan.set(ex.name, point);
      });
    });
    perPlan.forEach((p, name) => {
      const entry = map.get(name) || {
        name,
        unit: p.unit,
        points: [],
        delta: null,
      };
      entry.unit = p.unit;
      entry.points.push({
        planIndex: p.planIndex,
        maxWeight: p.maxWeight,
        setsDone: p.setsDone,
        setsPlanned: p.setsPlanned,
      });
      map.set(name, entry);
    });
  });
  const list = Array.from(map.values()).filter((e) =>
    e.points.some((p) => p.setsDone > 0),
  );
  list.forEach((e) => {
    const loaded = e.points.filter((p) => p.maxWeight > 0);
    e.delta =
      loaded.length >= 2
        ? loaded[loaded.length - 1].maxWeight - loaded[0].maxWeight
        : null;
  });
  return list.sort(
    (a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name),
  );
};
