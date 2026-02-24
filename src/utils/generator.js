import { SESSION_TYPES, TRAINING_TYPES, SYMBOLS, GYM_EXERCISES, GYM_PROGRESSION } from './constants';

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateAthleticsSession = (dayIndex, level, objective) => {
    // Simple deterministic logic based on day index for now
    // Mon: Easy/Rec, Tue: Quality, Wed: Easy, Thu: Quality, Fri: Rest/Easy, Sat: Long, Sun: Rest

    const isQualityDay = dayIndex === 1 || dayIndex === 3; // Tue, Thu
    const isLongDay = dayIndex === 5; // Sat
    const isRestDay = dayIndex === 4 || dayIndex === 6; // Fri, Sun

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
        mainBlock
    };
};

const generateGymSession = (dayIndex, weekNum) => {
    // Mon: Upper, Wed: Lower
    const dayName = dayIndex === 0 ? "Lunes" : "Miércoles";

    if (dayIndex === 0) { // Mon
        return {
            title: `Sesión del día ${dayName} - TREN SUPERIOR`,
            exercises: [
                ...GYM_EXERCISES.UPPER_PUSH.slice(0, 2).map(name => ({ name, weight: '', unit: 'lb', rest: "1'" })),
                ...GYM_EXERCISES.UPPER_PULL.slice(0, 2).map(name => ({ name, weight: '', unit: 'lb', rest: "1'" })),
                ...GYM_EXERCISES.CORE.slice(0, 2).map(name => ({ name, weight: '', unit: 'lb', rest: "1'" }))
            ]
        };
    }
    if (dayIndex === 2) { // Wed
        return {
            title: `Sesión del día ${dayName} - TREN INFERIOR`,
            exercises: [
                ...GYM_EXERCISES.LOWER.slice(0, 4).map(name => ({ name, weight: '', unit: 'lb', rest: "1'" })),
                ...GYM_EXERCISES.CORE.slice(0, 2).map(name => ({ name, weight: '', unit: 'lb', rest: "1'" }))
            ]
        };
    }
    return null;
};

export const generatePlan = (userData) => {
    const weeks = 4; // Expanded to 4 weeks
    const plan = [];

    for (let w = 0; w < weeks; w++) {
        const weekDays = [];
        for (let d = 0; d < 7; d++) {
            const dayIndex = d; // 0=Mon, 6=Sun

            // Mixed logic: Gym on Mon/Wed, Run on Tue/Thu/Sat
            let session = null;
            let isGym = false;

            if (dayIndex === 0 || dayIndex === 2) {
                session = generateGymSession(dayIndex, w + 1);
                isGym = true;
            } else {
                session = generateAthleticsSession(dayIndex, userData.level, userData.objective);
            }

            weekDays.push({
                dayName: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][d],
                isGym,
                session
            });
        }
        plan.push({ weekNum: w + 1, days: weekDays });
    }

    return plan;
};

export const formatPlanToText = (planData, userData) => {
    let output = `══════════════════════════════════════════════\n`;
    output += `   PLAN DE ENTRENAMIENTO MENSUAL\n`;
    output += `   Atleta: ${userData.name || 'Atleta'}\n`;
    output += `   Objetivo: ${userData.objective || 'General'}\n`;
    output += `   Período: ${new Date().toLocaleDateString()}\n`;
    output += `══════════════════════════════════════════════\n\n`;

    planData.forEach(week => {
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
                    day.session.exercises.forEach(ex => {
                        const weightStr = ex.weight ? ` – ${ex.weight} ${ex.unit}` : '';
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
                // Athletics format
                // • TIPO_SESIÓN | TIPO_ENTRENAMIENTO [C] 8'@TRO || BLOQUE_PRINCIPAL [A] 8'@TRO
                const s = day.session;
                output += `${SYMBOLS.BULLET} ${s.type.code} | ${s.training.code}  ${SYMBOLS.WARMUP} ${s.warmup}  ${SYMBOLS.SEPARATOR}  ${s.mainBlock}  ${SYMBOLS.COOLDOWN} ${s.cooldown}\n\n`;
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
