import { create } from "zustand";
import type { User } from "../types";

interface PreviewState {
  previewUser: User | null;
  startPreview: (mockUser: User) => void;
  stopPreview: () => void;
  isPreviewMode: () => boolean;
}

/**
 * Store de vista previa (impersonation) usado por el super admin para
 * previsualizar la app como Entrenador o Atleta sin cerrar su sesión real.
 * Extraído de AuthContext para separar responsabilidades (SRP) y evitar
 * que consumidores de auth se re-rendericen por cambios de preview.
 */
export const usePreviewStore = create<PreviewState>((set, get) => ({
  previewUser: null,
  startPreview: (mockUser) => set({ previewUser: mockUser }),
  stopPreview: () => set({ previewUser: null }),
  isPreviewMode: () => get().previewUser !== null,
}));
