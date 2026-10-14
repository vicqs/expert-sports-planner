import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { MockDatabaseProvider, useMockDatabase } from "./MockDatabase";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MockDatabaseProvider, null, children);

const DATE = "2099-01-01";

describe("citas: choques y pertenencia", () => {
  beforeEach(() => localStorage.clear());

  it("rechaza una cita que se cruza para el mismo entrenador", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    let first: any, overlap: any, free: any;
    act(() => {
      first = result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a1",
        date: DATE,
        time: "10:00",
        duration: 60,
      });
    });
    act(() => {
      overlap = result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a2",
        date: DATE,
        time: "10:30",
        duration: 30,
      });
    });
    act(() => {
      free = result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a2",
        date: DATE,
        time: "11:00",
        duration: 30,
      });
    });
    expect(first.success).toBe(true);
    expect(overlap.success).toBe(false);
    expect(overlap.error).toMatch(/cruza/);
    expect(free.success).toBe(true);
  });

  it("permite el mismo horario con otro entrenador y otro atleta", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    let other: any;
    act(() => {
      result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a1",
        date: DATE,
        time: "10:00",
        duration: 60,
      });
    });
    act(() => {
      other = result.current.addAppointment({
        trainerId: "t2",
        athleteId: "a9",
        date: DATE,
        time: "10:00",
        duration: 60,
      });
    });
    expect(other.success).toBe(true);
  });

  it("cada entrenador solo ve sus citas", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    act(() => {
      result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a1",
        date: DATE,
        time: "08:00",
      });
      result.current.addAppointment({
        trainerId: "t2",
        athleteId: "a2",
        date: DATE,
        time: "09:00",
      });
    });
    const t1 = result.current.getTrainerAppointments(DATE, "t1");
    expect(t1).toHaveLength(1);
    expect(t1[0].athleteId).toBe("a1");
  });

  it("reprogramar valida choques", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    let id = "";
    act(() => {
      result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a1",
        date: DATE,
        time: "08:00",
        duration: 60,
      });
      id = result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a2",
        date: DATE,
        time: "12:00",
        duration: 30,
        id: "movable",
      }).appointment.id;
    });
    let res: any;
    act(() => {
      res = result.current.rescheduleAppointment(id, DATE, "08:30");
    });
    expect(res.success).toBe(false);
    act(() => {
      res = result.current.rescheduleAppointment(id, DATE, "13:00");
    });
    expect(res.success).toBe(true);
  });

  it("un atleta sin entrenador aceptado no puede agendar", () => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({ id: "a1", role: "ATHLETE", email: "a@x.com" }),
    );
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    let res: any;
    act(() => {
      res = result.current.addAppointment({
        athleteId: "a1",
        date: DATE,
        time: "10:00",
        duration: 30,
      });
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/entrenador/);
  });

  it("un entrenador con sesi\u00f3n no puede leer citas de otro con un id falso", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    act(() => {
      result.current.addAppointment({
        trainerId: "t2",
        athleteId: "a2",
        date: DATE,
        time: "09:00",
      });
    });
    localStorage.setItem(
      "currentUser",
      JSON.stringify({ id: "t1", role: "TRAINER", email: "t@x.com" }),
    );
    expect(result.current.getTrainerAppointments(DATE, "t2")).toHaveLength(0);
  });
});
