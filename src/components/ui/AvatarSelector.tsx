import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Modal from "./Modal";

/**
 * Catálogo de avatares "divertidos" predefinidos (estilo selector de perfiles
 * de Netflix: grid de personajes/monstruos coloridos). No hay assets de
 * imagen en el proyecto, así que cada avatar es un emoji sobre un fondo con
 * gradiente único — visualmente atractivo sin depender de archivos externos.
 */
export const AVATAR_OPTIONS = [
  {
    id: "fox",
    emoji: "🦊",
    gradient: "linear-gradient(135deg,#f97316,#ea580c)",
  },
  {
    id: "owl",
    emoji: "🦉",
    gradient: "linear-gradient(135deg,#7c3aed,#4c1d95)",
  },
  {
    id: "koala",
    emoji: "🐨",
    gradient: "linear-gradient(135deg,#64748b,#334155)",
  },
  {
    id: "dragon",
    emoji: "🐲",
    gradient: "linear-gradient(135deg,#16a34a,#166534)",
  },
  {
    id: "unicorn",
    emoji: "🦄",
    gradient: "linear-gradient(135deg,#ec4899,#a21caf)",
  },
  {
    id: "lion",
    emoji: "🦁",
    gradient: "linear-gradient(135deg,#f59e0b,#b45309)",
  },
  {
    id: "octopus",
    emoji: "🐙",
    gradient: "linear-gradient(135deg,#db2777,#7e22ce)",
  },
  {
    id: "panda",
    emoji: "🐼",
    gradient: "linear-gradient(135deg,#0ea5e9,#0369a1)",
  },
  {
    id: "tiger",
    emoji: "🐯",
    gradient: "linear-gradient(135deg,#eab308,#a16207)",
  },
  {
    id: "frog",
    emoji: "🐸",
    gradient: "linear-gradient(135deg,#22c55e,#15803d)",
  },
  {
    id: "monkey",
    emoji: "🐵",
    gradient: "linear-gradient(135deg,#a16207,#78350f)",
  },
  {
    id: "alien",
    emoji: "👽",
    gradient: "linear-gradient(135deg,#10b981,#065f46)",
  },
  {
    id: "robot",
    emoji: "🤖",
    gradient: "linear-gradient(135deg,#6366f1,#312e81)",
  },
  {
    id: "ghost",
    emoji: "👻",
    gradient: "linear-gradient(135deg,#94a3b8,#475569)",
  },
  {
    id: "shark",
    emoji: "🦈",
    gradient: "linear-gradient(135deg,#0284c7,#0c4a6e)",
  },
  {
    id: "wolf",
    emoji: "🐺",
    gradient: "linear-gradient(135deg,#57534e,#292524)",
  },
] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export function getAvatarById(id?: string | null) {
  return AVATAR_OPTIONS.find((a) => a.id === id) || null;
}

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  onClose,
  selectedId,
  onSelect,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Elige tu avatar" size="md">
      <div className="avatar-selector-grid">
        {AVATAR_OPTIONS.map((avatar) => {
          const active = avatar.id === selectedId;
          return (
            <motion.button
              key={avatar.id}
              type="button"
              className={`avatar-option tap-ripple ${active ? "active" : ""}`}
              style={{ background: avatar.gradient }}
              onClick={() => {
                onSelect(avatar.id);
                onClose();
              }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Elegir avatar ${avatar.id}`}
              aria-pressed={active}
            >
              <span className="avatar-option-emoji">{avatar.emoji}</span>
              {active && (
                <span className="avatar-option-check">
                  <Check size={16} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <style>{`
        .avatar-selector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }
        @media (max-width: 400px) {
          .avatar-selector-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .avatar-option {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid transparent;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        .avatar-option.active {
          border-color: #fff;
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        .avatar-option-emoji { font-size: 2rem; line-height: 1; }
        .avatar-option-check {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: var(--color-primary);
          color: #fff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </Modal>
  );
};

export default AvatarSelector;
