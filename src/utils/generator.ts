import {
  SESSION_TYPES,
  TRAINING_TYPES,
  SYMBOLS,
  GYM_EXERCISES,
  GYM_PROGRESSION,
  PLAN_CONFIG,
  DAY_NAMES,
  TRAINING_SCHEDULE,
} from "./constants";

/**
 * Generates an athletics training session based on day and athlete profile
 * @param {number} dayIndex - Day of week (0-6)
 * @param {string} level - Athlete level
 * @param {string} objective - Training objective
 * @returns {Object|null} Session object or null for rest days
 */
const generateAthleticsSession = (dayIndex, _level, _objective) => {
  const isQualityDay = TRAINING_SCHEDULE.QUALITY_DAYS.includes(dayIndex);
  const isLongDay = dayIndex === TRAINING_SCHEDULE.LONG_RUN_DAY;
  const isRestDay = TRAINING_SCHEDULE.REST_DAYS.includes(dayIndex);

  if (isRestDay) return null;

  let type = SESSION_TYPES.DRO;
  let training = TRAINING_TYPES.CCN;
  let mainBlock = "40' @ TRO S.";

  if (isQualityDay) {
    training = Math.random() > 0.5 ? TRAINING_TYPES.SER : TRAINING_TYPES.FTK;
    if (training === TRAINING_TYPES.SER) {
      mainBlock = "6 [1k @ 5:50/km :: 3']";
    } else {
      mainBlock = "5 [3' F. :: 2' S.]";
    }
  } else if (isLongDay) {
    training = TRAINING_TYPES.CRJ;
    mainBlock = "12k @ 6:00/km";
  } else {
    type = SESSION_TYPES.COM;
    training = TRAINING_TYPES.TRO;
    mainBlock = "30' @ TRO S.";
  }

  return {
    type,
    training,
    warmup: "8'@TRO",
    cooldown: "8'@TRO",
    mainBlock,
  };
};

/**
 * Generates a gym training session
 * @param {number} dayIndex - Day of week (0-6)
 * @param {number} weekNum - Week number in the plan
 * @returns {Object|null} Gym session object or null if not a gym day
 */
const generateGymSession = (dayIndex, _weekNum) => {
  const dayName = DAY_NAMES[dayIndex];

  if (dayIndex === TRAINING_SCHEDULE.GYM_DAYS[0]) {
    // Monday - Upper Body
    return {
      title: `Sesión del día ${dayName} - TREN SUPERIOR`,
      exercises: [
        ...GYM_EXERCISES.UPPER_PUSH.slice(0, 2).map((name) => ({
          name,
          weight: "",
          unit: "lb",
          rest: "1'",
        })),
        ...GYM_EXERCISES.UPPER_PULL.slice(0, 2).map((name) => ({
          name,
          weight: "",
          unit: "lb",
          rest: "1'",
        })),
        ...GYM_EXERCISES.CORE.slice(0, 2).map((name) => ({
          name,
          weight: "",
          unit: "lb",
          rest: "1'",
        })),
      ],
    };
  }

  if (dayIndex === TRAINING_SCHEDULE.GYM_DAYS[1]) {
    // Wednesday - Lower Body
    return {
      title: `Sesión del día ${dayName} - TREN INFERIOR`,
      exercises: [
        ...GYM_EXERCISES.LOWER.slice(0, 4).map((name) => ({
          name,
          weight: "",
          unit: "lb",
          rest: "1'",
        })),
        ...GYM_EXERCISES.CORE.slice(0, 2).map((name) => ({
          name,
          weight: "",
          unit: "lb",
          rest: "1'",
        })),
      ],
    };
  }

  return null;
};

/**
 * Generates a complete training plan for a user
 * @param {Object} userData - User data including level and objective
 * @returns {Array} Array of weeks, each containing days with sessions
 */
export const generatePlan = (userData) => {
  const weeks = PLAN_CONFIG.DEFAULT_WEEKS;
  const plan: any[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekDays: any[] = [];

    for (let d = 0; d < PLAN_CONFIG.DAYS_PER_WEEK; d++) {
      const dayIndex = d;
      let session: any = null;
      let isGym = false;

      // Determine if it's a gym day or athletics day
      if (TRAINING_SCHEDULE.GYM_DAYS.includes(dayIndex)) {
        session = generateGymSession(dayIndex, w + 1);
        isGym = true;
      } else {
        session = generateAthleticsSession(
          dayIndex,
          userData.level,
          userData.objective,
        );
      }

      weekDays.push({
        dayName: DAY_NAMES[d],
        isGym,
        session,
      });
    }

    plan.push({ weekNum: w + 1, days: weekDays });
  }

  return plan;
};

export const formatPlanToText = (
  planData,
  userData,
  planUnit = "km",
  weightUnit = "lb",
) => {
  // Helper para convertir distancias si es necesario
  const convertDistance = (text) => {
    if (planUnit === "mi") {
      // Convertir km a mi en el texto
      return text.replace(/(\d+(?:\.\d+)?)\s*k(?:m)?/gi, (match, num) => {
        const miles = (parseFloat(num) * 0.621371).toFixed(2);
        return `${miles}mi`;
      });
    }
    return text;
  };

  // Helper para convertir pesos si es necesario
  const convertWeight = (weight, unit) => {
    if (!weight) return "";
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return weight;

    // Si el peso guardado está en lb y queremos kg
    if (unit === "lb" && weightUnit === "kg") {
      return `${(numWeight * 0.453592).toFixed(1)} kg`;
    }
    // Si el peso guardado está en kg y queremos lb
    if (unit === "kg" && weightUnit === "lb") {
      return `${(numWeight * 2.20462).toFixed(1)} lb`;
    }
    // Sin conversión
    return `${weight} ${unit}`;
  };

  let output = `══════════════════════════════════════════════\n`;
  output += `   PLAN DE ENTRENAMIENTO MENSUAL\n`;
  output += `   Atleta: ${userData.name || "Atleta"}\n`;
  output += `   Objetivo: ${userData.objective || "General"}\n`;
  output += `   Período: ${new Date().toLocaleDateString()}\n`;
  output += `══════════════════════════════════════════════\n\n`;

  planData.forEach((week) => {
    output += `SEMANA ${week.weekNum} (Días ${(week.weekNum - 1) * 7 + 1}–${week.weekNum * 7})\n`;
    output += `───────────────────────────────────────────────\n\n`;

    week.days.forEach((day, idx) => {
      output += `Día ${(week.weekNum - 1) * 7 + idx + 1} (${day.dayName}):\n`;

      if (!day.session) {
        output += `• DES | DESCANSO\n\n`;
        return;
      }

      if (day.isGym) {
        output += `${day.session.title}\n\n`;

        // Format exercises
        if (day.session.exercises && Array.isArray(day.session.exercises)) {
          day.session.exercises.forEach((ex) => {
            const weightStr = ex.weight
              ? ` – ${convertWeight(ex.weight, ex.unit || "lb")}`
              : "";
            output += `${ex.name}${weightStr}\n`;
          });
        } else {
          // Fallback for old text format if any
          output += `${day.session.exercises}\n`;
        }

        // Progression logic
        const defaultProgression = { series: 4, reps: 12 };
        const progression = GYM_PROGRESSION[week.weekNum] || defaultProgression;
        if (progression.series && progression.reps) {
          output += `\n${progression.series} × ${progression.reps}  (1' descanso)\n\n`;
        }
      } else {
        // Athletics format - convertir distancias si es necesario
        const s = day.session;
        const warmupConverted = convertDistance(s.warmup);
        const mainBlockConverted = convertDistance(s.mainBlock);
        const cooldownConverted = convertDistance(s.cooldown);
        output += `${SYMBOLS.BULLET} ${s.type.code} | ${s.training.code}  ${SYMBOLS.WARMUP} ${warmupConverted}  ${SYMBOLS.SEPARATOR}  ${mainBlockConverted}  ${SYMBOLS.COOLDOWN} ${cooldownConverted}\n\n`;
      }
    });

    output += `────────────────────────────────────────────────\n\n`;
  });

  output += `══════════════════════════════════════════════\n`;
  output += `   NOTAS Y RECOMENDACIONES\n`;
  output += `══════════════════════════════════════════════\n\n`;
  output += `- Respetar los ritmos indicados.\n`;
  output += `- Hidratación antes, durante y después.\n`;

  return output;
};
