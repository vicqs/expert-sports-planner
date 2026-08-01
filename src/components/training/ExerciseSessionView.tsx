import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Dumbbell,
  Wind,
  Check,
  MessageSquarePlus,
  X,
  Info,
  ChevronDown,
} from "lucide-react";
import { useToast } from "../ui";
import { getExerciseMetadata } from "@/utils/exerciseMetadata";

/**
 * ExerciseSessionView — the "core" screen the athlete looks at mid-workout.
 *
 * Design decisions:
 * - Split into 3 small components (ExerciseCard / SetRow / NoteSheet) instead of
 *   one big block: each has a single responsibility and can be reused (e.g. SetRow
 *   could later power a "history" view).
 * - Phase (warmup/work/cooldown) is a first-class visual signal, not just text:
 *   a colored left-bar + icon lets the athlete scan the session at a glance
 *   without reading every label — critical when reading while moving/sweating.
 * - Set completion is per-row, not per-exercise: tapping a set gives immediate,
 *   granular feedback (checkmark + scale "pop") without navigating away or
 *   waiting for the whole exercise to be marked done.
 * - Weight/reps use `--font-display` (Sora) + tabular numbers: the same tokens
 *   used elsewhere in the app for "big number" metrics, for gym-readable contrast.
 */

export type ExercisePhase = "warmup" | "work" | "cooldown";

export interface SessionExercise {
  name: string;
  sets: number;
  reps: string | number;
  weight?: string | number;
  phase?: ExercisePhase;
  restSeconds?: number;
  /** Indices of sets already completed. Persisted via MockDatabase when available. */
  completedSets?: number[];
}

interface PhaseMeta {
  label: string;
  icon: React.ReactNode;
  className: string;
}

const PHASE_META: Record<ExercisePhase, PhaseMeta> = {
  warmup: {
    label: "Calentamiento",
    icon: <Flame size={14} />,
    className: "phase-warmup",
  },
  work: {
    label: "Trabajo efectivo",
    icon: <Dumbbell size={14} />,
    className: "phase-work",
  },
  cooldown: {
    label: "Enfriamiento",
    icon: <Wind size={14} />,
    className: "phase-cooldown",
  },
};

/** Infers a phase when the plan data doesn't specify one, so older plans still look right. */
const inferPhase = (
  ex: SessionExercise,
  index: number,
  total: number,
): ExercisePhase => {
  if (ex.phase) return ex.phase;
  if (index === 0 && total > 2) return "warmup";
  if (index === total - 1 && total > 2) return "cooldown";
  return "work";
};

/* ---------------------------------- SetRow --------------------------------- */

interface SetRowProps {
  setNumber: number;
  reps: string | number;
  weight?: string | number;
  done: boolean;
  onToggle: () => void;
}

const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  reps,
  weight,
  done,
  onToggle,
}) => (
  <motion.button
    type="button"
    className={`set-row ${done ? "done" : ""}`}
    onClick={onToggle}
    whileTap={{ scale: 0.96 }}
    aria-pressed={done}
  >
    <span className="set-index">{setNumber}</span>
    <span className="set-metric">
      <strong>{reps}</strong> reps
    </span>
    {weight !== undefined && weight !== "" && (
      <span className="set-metric">
        <strong>{weight}</strong> kg
      </span>
    )}
    <span className="set-check">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span
            key="check"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Check size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="empty"
            className="set-check-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </span>
  </motion.button>
);

/* ------------------------------- ExerciseCard ------------------------------- */

interface ExerciseCardProps {
  exercise: SessionExercise;
  phase: ExercisePhase;
  completedSets: Set<number>;
  onToggleSet: (setIndex: number) => void;
  onAddNote: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  phase,
  completedSets,
  onToggleSet,
  onAddNote,
}) => {
  const meta = PHASE_META[phase];
  const totalSets = Number(exercise.sets) || 0;
  const doneCount = completedSets.size;
  const allDone = totalSets > 0 && doneCount >= totalSets;
  const [infoOpen, setInfoOpen] = useState(false);
  const info = React.useMemo(
    () => getExerciseMetadata(exercise.name),
    [exercise.name],
  );
  const hasInfo = Boolean(
    info &&
    (info.gifUrl ||
      info.instructions?.length ||
      info.targetMuscles?.length ||
      info.equipments?.length),
  );

  return (
    <motion.div
      layout
      className={`exercise-card ${meta.className} ${allDone ? "all-done" : ""}`}
    >
      <div className="exercise-card-header">
        <span className={`phase-badge ${meta.className}`}>
          {meta.icon}
          {meta.label}
        </span>
        <button
          type="button"
          className="note-fab"
          onClick={onAddNote}
          aria-label={`Agregar nota para ${exercise.name}`}
        >
          <MessageSquarePlus size={16} />
        </button>
      </div>

      {hasInfo ? (
        <button
          type="button"
          className="exercise-name-btn"
          onClick={() => setInfoOpen((v) => !v)}
          aria-expanded={infoOpen}
        >
          <h3 className="exercise-name">{exercise.name}</h3>
          <span className="exercise-info-hint">
            <Info size={14} />
            <ChevronDown size={16} className={infoOpen ? "rotated" : ""} />
          </span>
        </button>
      ) : (
        <h3 className="exercise-name">{exercise.name}</h3>
      )}

      <AnimatePresence initial={false}>
        {hasInfo && infoOpen && (
          <motion.div
            className="exercise-info-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {info?.gifUrl && (
              <img
                src={info.gifUrl}
                alt={exercise.name}
                className="exercise-info-gif"
                loading="lazy"
              />
            )}
            {(info?.targetMuscles?.length || info?.equipments?.length) && (
              <div className="exercise-info-tags">
                {info?.targetMuscles?.map((m) => (
                  <span key={m} className="info-tag primary">
                    {m}
                  </span>
                ))}
                {info?.equipments?.map((eq) => (
                  <span key={eq} className="info-tag">
                    {eq}
                  </span>
                ))}
              </div>
            )}
            {info?.instructions?.length ? (
              <ol className="exercise-info-steps">
                {info.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sets-list">
        {Array.from({ length: totalSets }).map((_, i) => (
          <SetRow
            key={i}
            setNumber={i + 1}
            reps={exercise.reps}
            weight={exercise.weight}
            done={completedSets.has(i)}
            onToggle={() => onToggleSet(i)}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* -------------------------------- NoteSheet -------------------------------- */

interface NoteSheetProps {
  open: boolean;
  initialValue: string;
  title: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

const NoteSheet: React.FC<NoteSheetProps> = ({
  open,
  initialValue,
  title,
  onClose,
  onSave,
}) => {
  const [value, setValue] = useState(initialValue);
  const { addToast } = useToast();

  // Re-sync draft each time the sheet is (re)opened for a new target.
  React.useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const handleSave = () => {
    onSave(value.trim());
    addToast(
      value.trim() ? "Nota guardada — tu entrenador la verá" : "Nota eliminada",
      "success",
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="note-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="note-sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="note-sheet-handle" />
            <div className="note-sheet-header">
              <h4>{title}</h4>
              <button
                className="close-btn"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              className="note-sheet-textarea"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej: Molestia en la rodilla derecha, bajé el peso en sentadilla..."
              rows={4}
              autoFocus
            />
            <button className="note-sheet-save" onClick={handleSave}>
              Guardar nota
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ------------------------------- Main export -------------------------------- */

interface ExerciseSessionViewProps {
  exercises: SessionExercise[];
  dayNote: string;
  onSaveDayNote: (note: string) => void;
  /** When provided, set completion is persisted upstream (e.g. MockDatabase) instead of local-only state. */
  onToggleSet?: (exerciseIndex: number, setIndex: number) => void;
}

/** Core "day of training" list: stacked ExerciseCards + a single note sheet shared by all rows. */
const ExerciseSessionView: React.FC<ExerciseSessionViewProps> = ({
  exercises,
  dayNote,
  onSaveDayNote,
  onToggleSet,
}) => {
  // Fallback local completion state, only used when the caller doesn't persist
  // set completion (keeps the component usable standalone / in tests).
  const [localCompletion, setLocalCompletion] = useState<
    Record<number, Set<number>>
  >({});
  const [noteOpen, setNoteOpen] = useState(false);

  const toggleLocalSet = useCallback((exIndex: number, setIndex: number) => {
    setLocalCompletion((prev) => {
      const next = new Set(prev[exIndex] ?? []);
      if (next.has(setIndex)) next.delete(setIndex);
      else next.add(setIndex);
      return { ...prev, [exIndex]: next };
    });
  }, []);

  if (!exercises || exercises.length === 0) {
    return (
      <p className="no-data">No hay ejercicios detallados para esta sesión.</p>
    );
  }

  return (
    <div className="exercise-session-view">
      {exercises.map((ex, i) => {
        const completedSets = onToggleSet
          ? new Set(ex.completedSets ?? [])
          : (localCompletion[i] ?? new Set<number>());
        return (
          <ExerciseCard
            key={`${ex.name}-${i}`}
            exercise={ex}
            phase={inferPhase(ex, i, exercises.length)}
            completedSets={completedSets}
            onToggleSet={(setIndex) =>
              onToggleSet
                ? onToggleSet(i, setIndex)
                : toggleLocalSet(i, setIndex)
            }
            onAddNote={() => setNoteOpen(true)}
          />
        );
      })}

      <button
        type="button"
        className="day-note-btn"
        onClick={() => setNoteOpen(true)}
      >
        <MessageSquarePlus size={16} />
        {dayNote ? "Editar nota del día" : "Avisar a mi entrenador (nota)"}
      </button>

      {dayNote && (
        <div className="day-note-preview">
          <strong>Nota:</strong> {dayNote}
        </div>
      )}

      <NoteSheet
        open={noteOpen}
        initialValue={dayNote}
        title="Nota para tu entrenador"
        onClose={() => setNoteOpen(false)}
        onSave={onSaveDayNote}
      />

      <style>{`
        .exercise-session-view {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        /* ---- Exercise card ---- */
        .exercise-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-left: 4px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
        }
        .exercise-card.phase-warmup { border-left-color: var(--color-warning); }
        .exercise-card.phase-work { border-left-color: var(--color-primary); }
        .exercise-card.phase-cooldown { border-left-color: var(--color-accent-cyan); }
        .exercise-card.all-done {
          border-left-color: var(--color-success);
          box-shadow: 0 0 0 1px var(--color-success-bg);
        }

        .exercise-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .phase-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          padding: 2px var(--space-2);
          border-radius: var(--radius-full);
        }
        .phase-badge.phase-warmup { color: var(--color-warning); background: var(--color-warning-bg); }
        .phase-badge.phase-work { color: var(--color-primary); background: var(--color-primary-bg); }
        .phase-badge.phase-cooldown { color: var(--color-accent-cyan); background: rgba(34, 211, 238, 0.12); }

        .note-fab {
          width: var(--touch-target-min);
          height: var(--touch-target-min);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-border);
          background: var(--color-bg-subtle);
          color: var(--color-text-muted);
        }
        .note-fab:active { transform: scale(0.92); }

        .exercise-name {
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        /* ---- Expandable exercise info (gif / músculos / instrucciones) ---- */
        .exercise-name-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          width: 100%;
          min-height: var(--touch-target-comfortable);
          padding: var(--space-1) 0;
          background: none;
          border: none;
          text-align: left;
          margin-bottom: var(--space-2);
        }
        .exercise-name-btn:active { transform: scale(0.99); }
        .exercise-info-hint {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          flex-shrink: 0;
          width: var(--touch-target-min);
          height: var(--touch-target-min);
          justify-content: center;
          border-radius: var(--radius-full);
          background: var(--color-primary-bg);
          color: var(--color-primary);
        }
        .exercise-info-hint svg.rotated { transform: rotate(180deg); }
        .exercise-info-hint svg { transition: transform 0.2s ease; }

        .exercise-info-panel {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }
        .exercise-info-gif {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          border-radius: var(--radius-md);
          background: var(--color-bg-subtle);
        }
        .exercise-info-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .info-tag {
          font-size: var(--text-xs);
          font-weight: 600;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
          background: var(--color-bg-subtle);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-subtle);
        }
        .info-tag.primary {
          background: var(--color-primary-bg);
          color: var(--color-primary);
          border-color: transparent;
        }
        .exercise-info-steps {
          margin: 0;
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        /* ---- Set rows ---- */
        .sets-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .set-row {
          display: grid;
          grid-template-columns: auto 1fr 1fr auto;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          min-height: var(--touch-target-comfortable);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-subtle);
          background: var(--color-bg-subtle);
          text-align: left;
        }
        .set-row.done {
          background: var(--color-success-bg);
          border-color: var(--color-success);
        }

        .set-index {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--color-surface-elevated);
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-muted);
        }
        .set-row.done .set-index { background: var(--color-success); color: #fff; }

        .set-metric {
          font-family: var(--font-display);
          font-variant-numeric: tabular-nums;
          font-size: var(--text-base);
          color: var(--color-text-secondary);
        }
        .set-metric strong {
          font-size: var(--text-xl);
          color: var(--color-text-primary);
          margin-right: 4px;
        }

        .set-check {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--color-success);
          color: #fff;
        }
        .set-row:not(.done) .set-check { background: transparent; }
        .set-check-empty {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--color-border-hover);
        }

        /* ---- Day note ---- */
        .day-note-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-height: var(--touch-target-comfortable);
          border: 1px dashed var(--color-border-hover);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          font-weight: 600;
        }
        .day-note-btn:active { transform: scale(0.98); }

        /* ---- Note bottom sheet ---- */
        .note-sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: var(--z-modal-backdrop);
        }
        .note-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-modal);
          background: var(--color-surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          padding: var(--space-3) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom));
          box-shadow: var(--shadow-2xl);
        }
        .note-sheet-handle {
          width: 40px;
          height: 4px;
          border-radius: var(--radius-full);
          background: var(--color-border-hover);
          margin: 0 auto var(--space-3);
        }
        .note-sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }
        .note-sheet-header h4 { margin: 0; font-family: var(--font-display); }
        .note-sheet-textarea {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg-subtle);
          color: var(--color-text-primary);
          font-size: var(--text-base);
          padding: var(--space-3);
          resize: none;
        }
        .note-sheet-save {
          width: 100%;
          min-height: var(--touch-target-comfortable);
          margin-top: var(--space-3);
          border-radius: var(--radius-md);
          background: var(--color-primary-gradient);
          color: #fff;
          font-weight: 700;
        }
        .note-sheet-save:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
};

export default ExerciseSessionView;
