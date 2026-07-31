/**
 * Helpers compartidos para el patrón de navegación "día a día" (flechas +
 * nombre de día + selector de fecha) usado en TrainerScheduleConfig,
 * TrainerAppointmentCalendar y GymBookingSystem.
 *
 * Todas las fechas se manejan como strings "YYYY-MM-DD" (el formato nativo
 * de <input type="date">).
 */

export const addDaysToDateString = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const formatDayName = (dateStr: string) => {
  const name = new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
  });
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export const formatShortDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });

export const todayDateString = () => new Date().toISOString().split("T")[0];
