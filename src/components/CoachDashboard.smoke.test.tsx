import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { MockDatabaseProvider } from "@/context/MockDatabase";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import CoachDashboard from "./CoachDashboard";
import { mockTrainerUser } from "@/utils/mockProfiles";
import { useAuthStore } from "@/store/useAuthStore";

const TABS = [
  "planes",
  "solicitudes-atletas",
  "mis-atletas",
  "horarios",
  "citas",
  "configuracion",
  "explorar",
];

const renderTab = (tab: string) =>
  render(
    <ToastProvider>
      <AuthProvider>
        <MockDatabaseProvider>
          <CoachDashboard
            onExit={() => {}}
            activeTab={tab}
            onTabChange={() => {}}
            onImmersiveChange={() => {}}
          />
        </MockDatabaseProvider>
      </AuthProvider>
    </ToastProvider>,
  );

describe("CoachDashboard: recorrido de demo", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    localStorage.setItem("currentUser", JSON.stringify(mockTrainerUser));
    localStorage.setItem("users", JSON.stringify([mockTrainerUser]));
    useAuthStore.setState({ currentUser: mockTrainerUser as any });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each(TABS)("la pestaña %s renderiza sin errores", async (tab) => {
    renderTab(tab);
    await waitFor(() =>
      expect(document.body.textContent?.length).toBeGreaterThan(20),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sobrevive a localStorage corrupto en biblioteca y datos", async () => {
    localStorage.setItem(`trainer_exercises_${mockTrainerUser.id}`, "{no json");
    localStorage.setItem("crm_custom_exercises", "[[");
    localStorage.setItem("crm_equipment", "null");
    renderTab("configuracion");
    await waitFor(() =>
      expect(document.body.textContent?.length).toBeGreaterThan(20),
    );
  });

  it("abre el editor de un plan activo del demo", async () => {
    renderTab("planes");
    const edit = await screen.findAllByRole("button", {
      name: /editar plan/i,
    });
    fireEvent.click(edit[0]);
    expect(await screen.findByText(/editando plan para/i)).toBeTruthy();
  });
});
