import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Edit2,
  Save,
  Columns2,
  Trash2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SESSION_TYPES,
  TRAINING_TYPES,
  TRAINING_COMPATIBILITY,
} from "../utils/constants";
import { formatPlanToText } from "../utils/generator";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { useLocalStorage } from "../hooks/useLocalStorage";
import GymSessionEditor from "./GymSessionEditor";
import AthleticsBuilder from "./AthleticsBuilder";
import { Button } from "./ui";

import { useToast } from "./ui/Toast";

const PlanEditor = ({
  initialPlan,
  clientData,
  onSave,
  onCancel,
  onAutoSave,
}) => {
  const { getTrainerId } = useAuth();
  const trainerId = getTrainerId();

  const [plan, setPlan] = useState(initialPlan);
  const [activeTab, setActiveTab] = useState("edit"); // 'edit' | 'preview'
  const [splitView, setSplitView] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(0);
  const [expandedDay, setExpandedDay] = useState<any>(null);
  // Unidades de medida: preferencia global del entrenador (se configuran en
  // Configuración > Unidades y se comparten entre todos los planes).
  const [planUnit] = useLocalStorage("trainer_plan_distance_unit", "km"); // 'km' or 'mi'
  const [weightUnit] = useLocalStorage("trainer_plan_weight_unit", "lb"); // 'lb' or 'kg'
  const [saveState, setSaveState] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const { addToast } = useToast();

  // --- Autoguardado ---
  // Referencia al último plan efectivamente guardado (manual o automático),
  // para no re-disparar el autoguardado si nada cambió realmente.
  const lastSavedRef = useRef(JSON.stringify(initialPlan));
  const debouncedPlan = useDebounce(plan, 1500);

  useEffect(() => {
    if (!onAutoSave) return;
    const serialized = JSON.stringify(debouncedPlan);
    if (serialized === lastSavedRef.current) return;
    setSaveState("saving");
    onAutoSave(
      formatPlanToText(debouncedPlan, clientData, planUnit, weightUnit),
      debouncedPlan,
    );
    lastSavedRef.current = serialized;
    setSaveState("saved");
    const t = setTimeout(() => setSaveState("idle"), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPlan]);

  // Helper to update a specific day
  const updateDay = (weekIndex, dayIndex, field, value) => {
    const newPlan = [...plan];
    const day = newPlan[weekIndex].days[dayIndex];

    if (field === "dayType") {
      // value = 'REST' | 'ATHLETICS' | 'GYM'
      if (value === "REST") {
        day.session = null;
        day.isGym = false;
      } else if (value === "GYM") {
        day.isGym = true;
        day.session = {
          title: "SESIÓN DE GIMNASIO",
          exercises: [],
        };
      } else {
        // ATHLETICS
        day.isGym = false;
        day.session = {
          type: SESSION_TYPES.DRO,
          training: TRAINING_TYPES.CCN,
          warmup: "8'@TRO",
          cooldown: "8'@TRO",
          mainBlock: "",
        };
      }
    } else if (field === "fullSession") {
      day.session = value;
    } else if (field.includes(".")) {
      const [parent, child] = field.split(".");
      day.session[parent] = { ...day.session[parent], [child]: value };
    } else {
      day.session[field] = value;
    }

    setPlan(newPlan);
  };

  const deleteWeek = (weekIndex) => {
    if (plan.length <= 1) return;
    const newPlan = plan
      .filter((_, i) => i !== weekIndex)
      .map((w, i) => ({ ...w, weekNum: i + 1 })); // Re-number weeks
    setPlan(newPlan);
    addToast("Semana eliminada", "info");
  };

  // Duplicate a week right after itself (deep copy to avoid shared references)
  const duplicateWeek = (weekIndex) => {
    const source = plan[weekIndex];
    const clone = JSON.parse(JSON.stringify(source));
    const newPlan = [
      ...plan.slice(0, weekIndex + 1),
      clone,
      ...plan.slice(weekIndex + 1),
    ].map((w, i) => ({ ...w, weekNum: i + 1 }));
    setPlan(newPlan);
    setExpandedWeek(weekIndex + 1);
    addToast("Semana duplicada", "success");
  };

  // Apply this week's day pattern (sessions) to every other week in the plan
  const applyWeekToAll = (weekIndex) => {
    const source = plan[weekIndex];
    const newPlan = plan.map((w, i) => {
      if (i === weekIndex) return w;
      const clonedDays = JSON.parse(JSON.stringify(source.days));
      return { ...w, days: clonedDays };
    });
    setPlan(newPlan);
    addToast("Semana aplicada a todo el plan", "success");
  };

  // Reordena semanas completas hacia arriba/abajo (sin drag & drop).
  const moveWeek = (weekIndex, direction) => {
    const newIndex = weekIndex + direction;
    if (newIndex < 0 || newIndex >= plan.length) return;
    const newPlan = [...plan];
    [newPlan[weekIndex], newPlan[newIndex]] = [
      newPlan[newIndex],
      newPlan[weekIndex],
    ];
    const renumbered = newPlan.map((w, i) => ({ ...w, weekNum: i + 1 }));
    setPlan(renumbered);
    setExpandedWeek(newIndex);
  };

  // Reordena el contenido (sesión) de un día dentro de la misma semana,
  // manteniendo fijo el nombre del día (Lunes, Martes...) por posición.
  const moveDay = (weekIndex, dayIndex, direction) => {
    const week = plan[weekIndex];
    const newIndex = dayIndex + direction;
    if (newIndex < 0 || newIndex >= week.days.length) return;
    const newPlan = [...plan];
    const days = [...week.days];
    const a = days[dayIndex];
    const b = days[newIndex];
    days[dayIndex] = { ...a, session: b.session, isGym: b.isGym };
    days[newIndex] = { ...b, session: a.session, isGym: a.isGym };
    newPlan[weekIndex] = { ...week, days };
    setPlan(newPlan);
    setExpandedDay(newIndex);
  };

  const handleSave = () => {
    setSaveState("saving");
    // Micro-delay so the user perceives the save action happening (button morphs to a check)
    setTimeout(() => {
      const finalText = formatPlanToText(
        plan,
        clientData,
        planUnit,
        weightUnit,
      );
      onSave(finalText, plan);
      lastSavedRef.current = JSON.stringify(plan);
      addToast("Plan guardado correctamente", "success");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    }, 350);
  };

  const handleTypeChange = (weekIndex, dayIndex, typeCode) => {
    const typeObj = Object.values(SESSION_TYPES).find(
      (t) => t.code === typeCode,
    );
    updateDay(weekIndex, dayIndex, "type", typeObj);
  };

  const toggleDay = (wIndex, dIndex) => {
    if (expandedWeek === wIndex && expandedDay === dIndex) {
      setExpandedDay(null);
    } else {
      setExpandedWeek(wIndex);
      setExpandedDay(dIndex);
    }
  };

  // Atajo de teclado Ctrl/Cmd+D: duplica el día enfocado (si hay uno expandido
  // dentro de una semana) o, si no, la semana actualmente expandida.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isDuplicateShortcut = (e.ctrlKey || e.metaKey) && e.key === "d";
      if (!isDuplicateShortcut) return;
      e.preventDefault();
      if (expandedWeek === null) return;
      if (expandedDay !== null) {
        // Duplicar el día enfocado: clona su sesión hacia el siguiente día
        // de la misma semana (sobrescribiéndolo), ya que los días son slots
        // fijos (Lunes..Domingo) y no se pueden insertar nuevos.
        const week = plan[expandedWeek];
        const nextIndex = expandedDay + 1;
        if (!week || nextIndex >= week.days.length) return;
        const source = week.days[expandedDay];
        const clone = JSON.parse(
          JSON.stringify({ session: source.session, isGym: source.isGym }),
        );
        const newPlan = [...plan];
        const days = [...week.days];
        days[nextIndex] = { ...days[nextIndex], ...clone };
        newPlan[expandedWeek] = { ...week, days };
        setPlan(newPlan);
        addToast("Día duplicado en el siguiente slot", "success");
      } else {
        duplicateWeek(expandedWeek);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedWeek, expandedDay, plan]);

  return (
    <div className="plan-editor">
      <div className="editor-header">
        <div className="tabs">
          <button
            className={`tab-btn tap-ripple ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <Edit2 size={16} /> Editor
          </button>
          <button
            className={`tab-btn tap-ripple ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Eye size={16} /> Vista Previa
          </button>
          <button
            className={`tab-btn split-toggle tap-ripple ${splitView ? "active" : ""}`}
            onClick={() => setSplitView((v) => !v)}
            title="Vista dividida (editor + previsualización en vivo)"
          >
            <Columns2 size={16} /> División
          </button>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={
              saveState === "saved" ? <Check size={16} /> : <Save size={16} />
            }
            onClick={handleSave}
            disabled={saveState === "saving"}
            className={`save-btn save-btn-${saveState}`}
          >
            {saveState === "saving"
              ? "Guardando…"
              : saveState === "saved"
                ? "¡Guardado!"
                : "Guardar Plan"}
          </Button>
        </div>
      </div>

      <div className={`editor-content ${splitView ? "split-grid" : ""}`}>
        {(activeTab === "preview" || splitView) && (
          <div className="preview-pane">
            <pre>
              {formatPlanToText(plan, clientData, planUnit, weightUnit)}
            </pre>
          </div>
        )}
        {(activeTab === "edit" || splitView) && (
          <div className="form-pane">
            {plan.map((week, wIndex) => (
              <div key={week.weekNum} className="week-section">
                <div
                  className={`week-header-row ${expandedWeek === wIndex ? "active" : ""}`}
                  onClick={() =>
                    setExpandedWeek(expandedWeek === wIndex ? null : wIndex)
                  }
                >
                  <div className="week-title-group">
                    <h3 className="week-title">Semana {week.weekNum}</h3>
                    {expandedWeek === wIndex ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                  <div className="week-actions">
                    <button
                      className="btn-week-action tap-ripple"
                      title="Mover semana arriba"
                      disabled={wIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWeek(wIndex, -1);
                      }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="btn-week-action tap-ripple"
                      title="Mover semana abajo"
                      disabled={wIndex === plan.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWeek(wIndex, 1);
                      }}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="btn-week-action tap-ripple"
                      title="Duplicar semana (Ctrl/Cmd+D)"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateWeek(wIndex);
                      }}
                    >
                      <Copy size={14} /> Duplicar
                    </button>
                    {plan.length > 1 && (
                      <button
                        className="btn-week-action tap-ripple"
                        title="Aplicar esta semana a todo el plan"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyWeekToAll(wIndex);
                        }}
                      >
                        Aplicar a todas
                      </button>
                    )}
                    {plan.length > 1 && (
                      <button
                        className="btn-del-week tap-ripple"
                        title="Eliminar semana"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWeek(wIndex);
                        }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedWeek === wIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="days-grid-wrapper"
                    >
                      <div className="days-grid">
                        {week.days.map((day, dIndex) => (
                          <div
                            key={dIndex}
                            className={`day-card ${!day.session ? "rest-day" : ""}`}
                          >
                            <div
                              className="day-header tap-ripple"
                              onClick={() => toggleDay(wIndex, dIndex)}
                            >
                              <span className="day-name">{day.dayName}</span>
                              <span className="day-summary">
                                {!day.session
                                  ? "DESCANSO"
                                  : day.isGym
                                    ? day.session.title || "GIMNASIO"
                                    : `${day.session.type.code} | ${day.session.training.code}`}
                              </span>
                              <div className="day-move-actions">
                                <button
                                  className="btn-day-move tap-ripple"
                                  title="Mover día arriba"
                                  disabled={dIndex === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveDay(wIndex, dIndex, -1);
                                  }}
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  className="btn-day-move tap-ripple"
                                  title="Mover día abajo"
                                  disabled={dIndex === week.days.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveDay(wIndex, dIndex, 1);
                                  }}
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                              {expandedWeek === wIndex &&
                              expandedDay === dIndex ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </div>

                            <AnimatePresence>
                              {expandedWeek === wIndex &&
                                expandedDay === dIndex && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="day-body"
                                  >
                                    <div className="day-type-selector">
                                      <button
                                        className={`tap-ripple ${!day.session ? "active" : ""}`}
                                        onClick={() =>
                                          updateDay(
                                            wIndex,
                                            dIndex,
                                            "dayType",
                                            "REST",
                                          )
                                        }
                                      >
                                        Descanso
                                      </button>
                                      <button
                                        className={`tap-ripple ${
                                          day.session && !day.isGym
                                            ? "active"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          updateDay(
                                            wIndex,
                                            dIndex,
                                            "dayType",
                                            "ATHLETICS",
                                          )
                                        }
                                      >
                                        Atletismo
                                      </button>
                                      <button
                                        className={`tap-ripple ${
                                          day.session && day.isGym
                                            ? "active"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          updateDay(
                                            wIndex,
                                            dIndex,
                                            "dayType",
                                            "GYM",
                                          )
                                        }
                                      >
                                        Gimnasio
                                      </button>
                                    </div>

                                    {day.session && !day.isGym && (
                                      <>
                                        <div className="form-row two-col">
                                          <div className="field">
                                            <label>Tipo Sesión</label>
                                            <select
                                              value={day.session.type.code}
                                              onChange={(e) =>
                                                handleTypeChange(
                                                  wIndex,
                                                  dIndex,
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              {Object.values(SESSION_TYPES).map(
                                                (t) => (
                                                  <option
                                                    key={t.code}
                                                    value={t.code}
                                                  >
                                                    {t.code} - {t.name}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                          </div>
                                          <div className="field">
                                            <label>Entrenamiento</label>
                                            <div className="training-combos">
                                              <select
                                                className="training-select"
                                                value={
                                                  day.session.training?.code
                                                    ? day.session.training.code.split(
                                                        "-",
                                                      )[0]
                                                    : ""
                                                }
                                                onChange={(e) => {
                                                  const primaryCode =
                                                    e.target.value;
                                                  if (!primaryCode) {
                                                    updateDay(
                                                      wIndex,
                                                      dIndex,
                                                      "training",
                                                      { code: "", name: "" },
                                                    );
                                                    return;
                                                  }
                                                  const typeObj = Object.values(
                                                    TRAINING_TYPES,
                                                  ).find(
                                                    (t) =>
                                                      t.code === primaryCode,
                                                  );
                                                  updateDay(
                                                    wIndex,
                                                    dIndex,
                                                    "training",
                                                    {
                                                      code: primaryCode,
                                                      name: typeObj
                                                        ? typeObj.name
                                                        : "Custom",
                                                    },
                                                  );
                                                }}
                                              >
                                                <option value="">
                                                  Seleccionar...
                                                </option>
                                                {Object.values(
                                                  TRAINING_TYPES,
                                                ).map((t) => (
                                                  <option
                                                    key={t.code}
                                                    value={t.code}
                                                  >
                                                    {t.name}
                                                  </option>
                                                ))}
                                              </select>
                                              <select
                                                className="training-select"
                                                value={
                                                  day.session.training?.code &&
                                                  day.session.training.code.includes(
                                                    "-",
                                                  )
                                                    ? day.session.training.code.split(
                                                        "-",
                                                      )[1]
                                                    : ""
                                                }
                                                disabled={
                                                  !day.session.training?.code ||
                                                  !day.session.training.code.split(
                                                    "-",
                                                  )[0]
                                                }
                                                onChange={(e) => {
                                                  const secondaryCode =
                                                    e.target.value;
                                                  const primaryCode =
                                                    day.session.training.code.split(
                                                      "-",
                                                    )[0];
                                                  if (!secondaryCode) {
                                                    const typeObj =
                                                      Object.values(
                                                        TRAINING_TYPES,
                                                      ).find(
                                                        (t) =>
                                                          t.code ===
                                                          primaryCode,
                                                      );
                                                    updateDay(
                                                      wIndex,
                                                      dIndex,
                                                      "training",
                                                      {
                                                        code: primaryCode,
                                                        name: typeObj
                                                          ? typeObj.name
                                                          : "Custom",
                                                      },
                                                    );
                                                  } else {
                                                    const newCode = `${primaryCode}-${secondaryCode}`;
                                                    updateDay(
                                                      wIndex,
                                                      dIndex,
                                                      "training",
                                                      {
                                                        code: newCode,
                                                        name: "Custom",
                                                      },
                                                    );
                                                  }
                                                }}
                                              >
                                                <option value="">
                                                  Ninguno
                                                </option>
                                                {day.session.training?.code &&
                                                  TRAINING_COMPATIBILITY[
                                                    day.session.training.code.split(
                                                      "-",
                                                    )[0]
                                                  ]?.map((compatibleCode) => {
                                                    const typeObj =
                                                      Object.values(
                                                        TRAINING_TYPES,
                                                      ).find(
                                                        (t) =>
                                                          t.code ===
                                                          compatibleCode,
                                                      );
                                                    return typeObj ? (
                                                      <option
                                                        key={typeObj.code}
                                                        value={typeObj.code}
                                                      >
                                                        {typeObj.name}
                                                      </option>
                                                    ) : null;
                                                  })}
                                              </select>
                                            </div>
                                          </div>
                                        </div>

                                        <AthleticsBuilder
                                          session={day.session}
                                          unit={planUnit}
                                          onChange={(updatedSession) =>
                                            updateDay(
                                              wIndex,
                                              dIndex,
                                              "fullSession",
                                              updatedSession,
                                            )
                                          }
                                        />
                                      </>
                                    )}

                                    {day.session && day.isGym && (
                                      <GymSessionEditor
                                        session={day.session}
                                        weekNum={week.weekNum}
                                        weightUnit={weightUnit}
                                        trainerId={trainerId}
                                        onChange={(updatedSession) =>
                                          updateDay(
                                            wIndex,
                                            dIndex,
                                            "fullSession",
                                            updatedSession,
                                          )
                                        }
                                      />
                                    )}
                                  </motion.div>
                                )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .plan-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg);
        }
        
        /* Sticky Glass Header */
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: var(--color-surface-glass);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: var(--shadow-sm);
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          background: var(--color-bg-subtle);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: var(--color-text);
        }

        .tab-btn.active {
          background: var(--color-surface);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
          font-weight: 600;
        }

        .toggles {
            display: flex;
            gap: 0.5rem;
            padding-left: 0.5rem;
            margin-left: 0.5rem;
            border-left: 1px solid var(--color-border);
        }

        .split-toggle {
          display: none;
        }

        @media (min-width: 1024px) {
          .split-toggle {
            display: flex;
          }
        }

        .actions {
          display: flex;
          gap: 1rem;
        }

        .save-btn-saved {
          background: var(--color-success) !important;
          animation: saveBounce 0.4s ease;
        }

        @keyframes saveBounce {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .editor-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          scroll-behavior: smooth;
        }

        .editor-content.split-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .editor-content.split-grid {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
          .editor-content.split-grid .preview-pane {
            position: sticky;
            top: 0;
            max-height: calc(100vh - 140px);
            overflow-y: auto;
          }
        }

        /* Preview Pane */
        .preview-pane pre {
          background: var(--color-code-bg);
          padding: 2rem;
          border-radius: var(--radius-lg);
          color: var(--color-text);
          font-family: 'JetBrains Mono', monospace;
          white-space: pre-wrap;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        /* Week Section */
        .week-section {
          margin-bottom: 3rem;
          background: transparent;
        }

        .week-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding: 1rem;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }
        
        .week-header-row:hover {
            background: var(--color-surface-hover);
            border-color: var(--color-border-hover);
        }

        .week-header-row.active {
            background: var(--color-surface-hover);
            border-color: var(--color-primary-subtle);
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            margin-bottom: 0;
            border-bottom: none;
        }

        .week-title-group {
            display: flex;
            align-items: center;
            gap: 1rem;
            color: var(--color-text);
        }

        .week-title {
            margin-bottom: 0;
            font-size: 1.1rem;
            font-weight: 700;
        }

        .week-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .btn-week-action {
            background: var(--color-primary-bg);
            border: 1px solid transparent;
            color: var(--color-primary);
            padding: 0.4rem 0.8rem;
            border-radius: var(--radius-md);
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .btn-week-action:hover {
            background: var(--color-primary);
            color: white;
            box-shadow: var(--shadow-sm);
        }

        .btn-week-action:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            background: var(--color-primary-bg);
            color: var(--color-primary);
            box-shadow: none;
        }

        .btn-del-week {
            background: var(--color-error-bg);
            border: 1px solid transparent;
            color: var(--color-error);
            padding: 0.4rem 0.8rem;
            border-radius: var(--radius-md);
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-del-week:hover {
            background: var(--color-error);
            color: white;
            box-shadow: var(--shadow-sm);
        }
        
        .days-grid-wrapper {
            background: var(--color-bg-subtle);
            border: 1px solid var(--color-border);
            border-top: none;
            border-bottom-left-radius: var(--radius-lg);
            border-bottom-right-radius: var(--radius-lg);
            padding: 1.5rem;
            margin-bottom: 2rem;
            overflow: hidden;
        }

        .days-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Day Card */
        .day-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }

        .day-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-border-hover);
        }

        .day-card.rest-day {
          opacity: 0.8;
          background: var(--color-bg-subtle);
          border-style: dashed;
        }

        .day-header {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .day-move-actions {
          display: flex;
          gap: 0.15rem;
        }

        .btn-day-move {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          transition: all 0.2s;
        }

        .btn-day-move:hover:not(:disabled) {
          color: var(--color-primary);
          border-color: var(--color-primary-subtle);
        }

        .btn-day-move:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .day-header:hover {
          background: var(--color-surface-hover);
        }

        .day-name {
          font-weight: 600;
          width: 120px;
          color: var(--color-text);
          font-size: 1rem;
        }

        .day-summary {
          flex: 1;
          color: var(--color-text-muted);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .day-body {
          border-top: 1px solid var(--color-border);
          padding: 1.5rem;
          background: var(--color-bg-subtle);
        }

        /* Day Type Segmented Control */
        .day-type-selector {
            display: flex;
            gap: 0.25rem;
            margin-bottom: 2rem;
            background: var(--color-surface);
            padding: 0.25rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            width: fit-content;
        }

        .day-type-selector button {
            padding: 0.5rem 1.5rem;
            border: none;
            background: transparent;
            color: var(--color-text-muted);
            border-radius: var(--radius-sm);
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.2s;
            cursor: pointer;
        }

        .day-type-selector button:hover {
            color: var(--color-text);
            background: var(--color-surface-hover);
        }

        .day-type-selector button.active {
            background: var(--color-primary-subtle);
            color: var(--color-primary);
            font-weight: 600;
        }

        /* Forms */
        .form-row {
          margin-bottom: 1.5rem;
        }

        .form-row.two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .field label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .field input, .field select, .field textarea {
          width: 100%;
          padding: 0.75rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .field textarea {
          font-family: var(--font-mono);
        }

        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-subtle);
          outline: none;
        }
        
        .training-combos {
            display: flex;
            gap: 0.75rem;
        }

        .training-select {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            color: var(--color-text);
            font-family: var(--font-sans);
            transition: all 0.2s;
        }

        .training-select:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: var(--color-bg-subtle);
        }

        .training-select:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-subtle);
        }

        .preview-pane {
            background: var(--color-surface);
            color: var(--color-text);
            padding: 2rem;
            border-radius: var(--radius-sm);
            min-height: 100%;
        }
        .preview-pane pre {
            white-space: pre-wrap;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9rem;
            line-height: 1.5;
            color: var(--color-text);
        }
        
        /* Modo claro: fondo blanco, texto negro */
        [data-theme="light"] .preview-pane {
            background: white;
        }
        [data-theme="light"] .preview-pane pre {
            color: #1a1a1a;
        }
        
        /* Modo oscuro: fondo oscuro, texto claro */
        [data-theme="dark"] .preview-pane {
            background: #1e1e1e;
        }
        [data-theme="dark"] .preview-pane pre {
            color: #e5e5e5;
        }
        
        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          /* Header adaptativo */
          .editor-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            align-items: stretch;
          }
          
          .tabs {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .tab-btn {
            font-size: 0.85rem;
            padding: 0.5rem 0.75rem;
          }
          
          .actions {
            width: 100%;
            justify-content: stretch;
          }
          
          .actions button {
            flex: 1;
          }
          
          /* Contenido principal */
          .editor-content {
            padding: 1rem;
          }
          
          /* Week header */
          .week-header-row {
            flex-wrap: wrap;
            gap: 0.75rem;
            padding: 0.75rem;
          }
          
          .week-title-group {
            flex: 1;
            min-width: 180px;
          }
          
          .week-title {
            font-size: 1rem;
          }
          
          .btn-del-week {
            width: 100%;
            justify-content: center;
          }
          
          /* Days grid wrapper */
          .days-grid-wrapper {
            padding: 1rem;
          }
          
          /* Day card header */
          .day-header {
            padding: 1rem;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .day-name {
            width: auto;
            min-width: 80px;
            font-size: 0.95rem;
          }
          
          .day-summary {
            font-size: 0.85rem;
            min-width: 120px;
          }
          
          /* Day body */
          .day-body {
            padding: 1rem;
          }
          
          /* Day type selector full width */
          .day-type-selector {
            width: 100%;
            margin-bottom: 1.5rem;
          }
          
          .day-type-selector button {
            flex: 1;
            padding: 0.6rem 0.5rem;
            font-size: 0.85rem;
          }
          
          /* Form rows stack en móvil */
          .form-row.two-col {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          /* Training combos stack en móvil */
          .training-combos {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .training-select {
            width: 100%;
          }
          
          /* Preview más compacto */
          .preview-pane {
            padding: 1rem;
          }
          
          .preview-pane pre {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          /* Header ultra compacto */
          .editor-header {
            padding: 0.75rem;
          }
          
          .tabs {
            width: 100%;
          }
          
          .tab-btn {
            font-size: 0.75rem;
            padding: 0.4rem 0.5rem;
            gap: 0.25rem;
          }
          
          .tab-btn svg {
            width: 14px;
            height: 14px;
          }
          
          /* Contenido muy compacto */
          .editor-content {
            padding: 0.75rem;
          }
          
          /* Week section más pequeña */
          .week-section {
            margin-bottom: 1.5rem;
          }
          
          .week-header-row {
            padding: 0.75rem;
          }
          
          .week-title {
            font-size: 0.95rem;
          }
          
          .btn-del-week {
            font-size: 0.75rem;
            padding: 0.35rem 0.6rem;
          }
          
          /* Day card más compacta */
          .day-header {
            padding: 0.75rem;
            gap: 0.5rem;
          }
          
          .day-name {
            font-size: 0.85rem;
            font-weight: 700;
            width: 100%;
            order: 1;
          }
          
          .day-summary {
            font-size: 0.8rem;
            width: calc(100% - 30px);
            order: 2;
          }
          
          .day-header svg {
            order: 3;
            margin-left: auto;
          }
          
          /* Day body compacto */
          .day-body {
            padding: 0.75rem;
          }
          
          /* Type selector más pequeño */
          .day-type-selector {
            margin-bottom: 1rem;
          }
          
          .day-type-selector button {
            padding: 0.5rem 0.35rem;
            font-size: 0.75rem;
          }
          
          /* Forms más compactos */
          .form-row {
            margin-bottom: 1rem;
          }
          
          .field label {
            font-size: 0.75rem;
            margin-bottom: 0.4rem;
          }
          
          .field input, 
          .field select, 
          .field textarea {
            padding: 0.6rem;
            font-size: 0.85rem;
          }
          
          /* Preview ultra compacto */
          .preview-pane {
            padding: 0.75rem;
          }
          
          .preview-pane pre {
            font-size: 0.75rem;
            line-height: 1.4;
          }
          
          /* Days grid wrapper */
          .days-grid-wrapper {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PlanEditor;
