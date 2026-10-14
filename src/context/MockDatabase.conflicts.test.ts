import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { MockDatabaseProvider, useMockDatabase } from "./MockDatabase";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MockDatabaseProvider, null, children);

const DATE = "2099-02-01";

describe("gimnasio vs citas", () => {
  beforeEach(() => localStorage.clear());

  it("rechaza reservar gimnasio sobre una cita del atleta", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    act(() => {
      result.current.updateGymSchedule(DATE, [
        { id: "s1", start: "10:00", end: "11:00", capacity: 5, reserved: 0 },
      ]);
      result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a1",
        date: DATE,
        time: "10:30",
        duration: 30,
      });
    });
    let res: any;
    act(() => {
      res = result.current.bookGymSlot("a1", DATE, "s1");
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/cita/);
  });

  it("rechaza una cita sobre una reserva de gimnasio del atleta", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    act(() => {
      result.current.updateGymSchedule(DATE, [
        { id: "s1", start: "10:00", end: "11:00", capacity: 5, reserved: 0 },
      ]);
    });
    act(() => {
      result.current.bookGymSlot("a1", DATE, "s1");
    });
    let res: any;
    act(() => {
      res = result.current.addAppointment({
        trainerId: "t1",
        athleteId: "a1",
        date: DATE,
        time: "10:15",
        duration: 30,
      });
    });
    expect(res.success).toBe(false);
  });
});

describe("updateClientPlan sobre un plan activo", () => {
  beforeEach(() => localStorage.clear());

  it("conserva startDate y sincroniza planDuration/endDate", () => {
    const { result } = renderHook(() => useMockDatabase(), { wrapper });
    let id = "";
    const week = (n: number) => ({
      weekNum: n,
      days: [{ dayName: "Lunes", isGym: false, session: null }],
    });
    act(() => {
      id = result.current.addClientRequest(
        { name: "Test", planDuration: 2 },
        "t1",
      );
    });
    act(() => {
      result.current.updateClientPlan(id, "p", [week(1), week(2)]);
    });
    const first = result.current.clients.find((c: any) => c.id === id);
    act(() => {
      result.current.updateClientPlan(id, "p", [week(1), week(2), week(3)]);
    });
    const second = result.current.clients.find((c: any) => c.id === id);
    expect(second.startDate).toBe(first.startDate);
    expect(second.planDuration).toBe(3);
    const days =
      (new Date(second.endDate).getTime() -
        new Date(second.startDate).getTime()) /
      86400000;
    expect(Math.round(days)).toBe(21);
  });
});
