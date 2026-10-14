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
  Undo2,
  Redo2,
  Printer,
  AlertCircle,
  Plus,
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
import { Button, ConfirmDialog } from "./ui";

import { useToast } from "./ui/Toast";

const MAX_HISTORY = 50;
const COALESCE_MS = 1200;
const clonePlan = (p) => JSON.parse(JSON.stringify(p));

// Un día está incompleto si tiene sesión pero le falta lo esencial.
const isDayIncomplete = (day) => {
  if (!day?.session) return false;
  if (day.isGym) return !(day.session.exercises?.length > 0);
  return !day.session.training?.code || !day.session.mainBlock?.trim();
};

const isTypingTarget = (target) =>
  target instanceof HTMLElement &&
  (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
    target.isContentEditable);

const PlanEditor = ({
  initialPlan,
  clientData,
  onSave,
  onCancel,
  onAutoSave,
}) => {
  const { getTrainerId } = useAuth();
  const trainerId = getTrainerId();

  // Copia profunda: el editor nunca muta el plan recibido, así los cambios
  // son reversibles (deshacer) y el padre no ve estados a medias.
  const [plan, setPlanRaw] = useState(() => clonePlan(initialPlan));
  const planRef = useRef(plan);
  planRef.current = plan;
  const [past, setPast] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const lastEditRef = useRef({ key: "", at: 0 });
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printSize, setPrintSize] = useState(0); // 0 = todo, 1 = semana, 2 = quincena
  const [printStart, setPrintStart] = useState(0);

  // Todo cambio pasa por aquí. Las ediciones seguidas del mismo campo se
  // agrupan en un solo paso de historial para que deshacer sea útil.
  const setPlan = (next, coalesceKey = "") => {
    const now = Date.now();
    const last = lastEditRef.current;
    const coalesce =
      coalesceKey && last.key === coalesceKey && now - last.at < COALESCE_MS;
    lastEditRef.current = { key: coalesceKey, at: now };
    if (!coalesce) {
      const snapshot = planRef.current;
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), snapshot]);
    }
    setFuture([]);
    setPlanRaw(next);
  };

  const clampExpanded = (len) => {
    setExpandedWeek((w) => (w !== null && w >= len ? len - 1 : w));
  };

  const undo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture((f) => [planRef.current, ...f]);
    lastEditRef.current = { key: "", at: 0 };
    setPlanRaw(prev);
    clampExpanded(prev.length);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast((p) => [...p, planRef.current]);
    lastEditRef.current = { key: "", at: 0 };
    setPlanRaw(next);
    clampExpanded(next.length);
  };
  const [activeTab, setActiveTab] = useState("edit"); // 'edit' | 'preview'
  const [splitView, setSplitView] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);
  const [expandedDay, setExpandedDay] = useState<any>(null);
  const [instantDay, setInstantDay] = useState(false);
  const [movedKey, setMovedKey] = useState<string | null>(null);
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

  // Guarda el plan si difiere del último guardado. Devuelve true si guardó.
  const persist = (p) => {
    if (!onAutoSave) return false;
    const serialized = JSON.stringify(p);
    if (serialized === lastSavedRef.current) return false;
    onAutoSave(formatPlanToText(p, clientData, planUnit, weightUnit), p);
    lastSavedRef.current = serialized;
    return true;
  };
  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!persistRef.current(debouncedPlan)) return;
    setSaveState("saved");
    const t = setTimeout(() => setSaveState("idle"), 1600);
    return () => clearTimeout(t);
  }, [debouncedPlan]);

  // Cambios pendientes de guardar (dentro de la ventana de 1.5 s del debounce).
  const isDirty = JSON.stringify(plan) !== lastSavedRef.current;
  const dirtyRef = useRef(false);
  dirtyRef.current = isDirty;

  // Al cerrar o desmontar se guarda lo pendiente: nada se pierde.
  useEffect(() => {
    return () => {
      persistRef.current(planRef.current);
    };
  }, []);

  // Aviso del navegador si se intenta cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Imprime la vista previa (o guárdala como PDF desde el diálogo de impresión).
  const handlePrint = () => {
    const all = planRef.current;
    const weeks =
      printSize === 0 ? all : all.slice(printStart, printStart + printSize);
    const text = formatPlanToText(weeks, clientData, planUnit, weightUnit);
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      iframe.remove();
      addToast("No se pudo abrir la impresión", "error");
      return;
    }
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Plan de entrenamiento</title><style>@page{margin:16mm}body{margin:0;color:#111;background:#fff}pre{white-space:pre-wrap;word-break:break-word;font-family:'Courier New',monospace;font-size:11pt;line-height:1.5}</style></head><body><pre>${escaped}</pre></body></html>`,
    );
    doc.close();
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => iframe.remove(), 1500);
    }, 150);
  };

  const handleClose = () => {
    if (persist(planRef.current)) addToast("Cambios guardados", "success");
    onCancel();
  };

  // Helper to update a specific day (inmutable)
  const updateDay = (weekIndex, dayIndex, field, value) => {
    const newPlan = clonePlan(plan);
    const day = newPlan[weekIndex].days[dayIndex];
    let discarded = false;

    if (field === "dayType") {
      // value = 'REST' | 'ATHLETICS' | 'GYM'
      const currentType = !day.session
        ? "REST"
        : day.isGym
          ? "GYM"
          : "ATHLETICS";
      // Pulsar el tipo ya activo no debe borrar la sesión.
      if (value === currentType) return;
      discarded = !!(
        day.session?.mainBlock?.trim() || day.session?.exercises?.length
      );
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
    } else if (!day.session) {
      return;
    } else if (field.includes(".")) {
      const [parent, child] = field.split(".");
      day.session[parent] = { ...day.session[parent], [child]: value };
    } else {
      day.session[field] = value;
    }

    setPlan(
      newPlan,
      field === "dayType" ? "" : `${weekIndex}:${dayIndex}:${field}`,
    );
    if (discarded) {
      addToast(
        "Sesión anterior descartada. Usa Deshacer para recuperarla",
        "info",
      );
    }
  };

  // Agrega una semana vacía (mismos días, todos en descanso) al final del plan.
  const addWeek = () => {
    if (plan.length >= 52) {
      addToast("El plan ya tiene el máximo de 52 semanas", "warning");
      return;
    }
    const last = plan[plan.length - 1];
    const days = (last?.days || []).map((d) => ({
      dayName: d.dayName,
      isGym: false,
      session: null,
    }));
    const newPlan = [...plan, { weekNum: plan.length + 1, days }];
    setPlan(newPlan);
    setExpandedWeek(newPlan.length - 1);
    setExpandedDay(null);
    addToast(
      `Semana ${newPlan.length} agregada. Puedes deshacer con Ctrl+Z`,
      "success",
    );
  };

  const deleteWeek = (weekIndex) => {
    if (plan.length <= 1) return;
    const newPlan = plan
      .filter((_, i) => i !== weekIndex)
      .map((w, i) => ({ ...w, weekNum: i + 1 })); // Re-number weeks
    setPlan(newPlan);
    clampExpanded(newPlan.length);
    setExpandedDay(null);
    addToast("Semana eliminada. Puedes deshacer con Ctrl+Z", "info");
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
    addToast("Semana aplicada a todo el plan. Ctrl+Z para deshacer", "success");
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
    // El día expandido "viaja" con su contenido: primero se activa el modo
    // instantáneo (sin animar colapso/expansión, evita el salto) y en el
    // siguiente frame se aplica el cambio, se resalta el destino y se enfoca.
    setInstantDay(true);
    requestAnimationFrame(() => {
      setPlan(newPlan);
      setMovedKey(`${weekIndex}:${newIndex}`);
      setExpandedDay((cur) => (cur === dayIndex ? newIndex : cur));
    });
    setTimeout(() => {
      document
        .getElementById(`day-card-${weekIndex}-${newIndex}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 30);
    setTimeout(() => {
      setInstantDay(false);
      setMovedKey(null);
    }, 700);
  };

  const handleSave = () => {
    if (saveState === "saving") return;
    setSaveState("saving");
    const snapshot = planRef.current;
    // Micro-delay so the user perceives the save action happening (button morphs to a check)
    setTimeout(() => {
      const finalText = formatPlanToText(
        snapshot,
        clientData,
        planUnit,
        weightUnit,
      );
      // Se marca como guardado antes de llamar a onSave: si el padre cierra el
      // editor, el guardado al desmontar no repite la escritura.
      lastSavedRef.current = JSON.stringify(snapshot);
      onSave(finalText, snapshot);
      const incomplete = snapshot.reduce(
        (n, w) => n + w.days.filter(isDayIncomplete).length,
        0,
      );
      if (incomplete > 0) {
        addToast(
          `Plan guardado con ${incomplete} día${incomplete > 1 ? "s" : ""} incompleto${incomplete > 1 ? "s" : ""}`,
          "warning",
        );
      } else {
        addToast("Plan guardado correctamente", "success");
      }
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
      focusDay(wIndex, dIndex);
    }
  };

  // Mantiene visible el día recién abierto (clave en móvil).
  const focusDay = (wIndex, dIndex) => {
    setTimeout(() => {
      document
        .getElementById(`day-card-${wIndex}-${dIndex}`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 120);
  };

  // Al abrir una semana se abre directamente el primer día por completar
  // (o el primero con sesión), para empezar a editar sin clics extra.
  const toggleWeek = (wIndex) => {
    if (expandedWeek === wIndex) {
      setExpandedWeek(null);
      setExpandedDay(null);
      return;
    }
    const days = plan[wIndex].days;
    let target = days.findIndex(isDayIncomplete);
    if (target < 0) target = days.findIndex((d) => d.session);
    setExpandedWeek(wIndex);
    setExpandedDay(target >= 0 ? target : null);
  };

  // Un clic en un día de descanso lo convierte en sesión y lo abre.
  const startDay = (wIndex, dIndex, type) => {
    updateDay(wIndex, dIndex, "dayType", type);
    setExpandedWeek(wIndex);
    setExpandedDay(dIndex);
    focusDay(wIndex, dIndex);
  };

  const goNextDay = (wIndex, dIndex) => {
    const days = plan[wIndex].days;
    if (dIndex + 1 < days.length) {
      setExpandedDay(dIndex + 1);
      focusDay(wIndex, dIndex + 1);
    } else if (wIndex + 1 < plan.length) {
      setExpandedWeek(wIndex + 1);
      setExpandedDay(0);
      focusDay(wIndex + 1, 0);
    } else {
      setExpandedDay(null);
    }
  };

  // Atajo de teclado Ctrl/Cmd+D: duplica el día enfocado (si hay uno expandido
  // dentro de una semana) o, si no, la semana actualmente expandida.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();

      // Ctrl/Cmd+S guarda incluso escribiendo en un campo.
      if (key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // En campos de texto se respeta el comportamiento nativo (deshacer texto).
      if (isTypingTarget(e.target)) return;

      if (key === "z" || key === "y") {
        e.preventDefault();
        if (key === "y" || e.shiftKey) redo();
        else undo();
        return;
      }

      if (key !== "d") return;
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
        addToast(
          "Día duplicado en el siguiente slot. Ctrl+Z para deshacer",
          "success",
        );
      } else {
        duplicateWeek(expandedWeek);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedWeek, expandedDay, plan, past, future, saveState]);

  return (
    <div className="plan-editor">
      <div className="editor-header">
        <div className="tabs" role="tablist" aria-label="Vista del editor">
          <button
            role="tab"
            aria-selected={activeTab === "edit"}
            className={`tab-btn tap-ripple ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <Edit2 size={16} /> Editor
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "preview"}
            className={`tab-btn tap-ripple ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Eye size={16} /> Vista Previa
          </button>
          <button
            aria-pressed={splitView}
            className={`tab-btn split-toggle tap-ripple ${splitView ? "active" : ""}`}
            onClick={() => setSplitView((v) => !v)}
            title="Vista dividida (editor + previsualización en vivo)"
          >
            <Columns2 size={16} /> División
          </button>
        </div>
        <div className="actions">
          <div className="history-actions">
            <button
              className="btn-history tap-ripple"
              onClick={undo}
              disabled={!past.length}
              title="Deshacer (Ctrl/Cmd+Z)"
              aria-label="Deshacer"
            >
              <Undo2 size={18} />
            </button>
            <button
              className="btn-history tap-ripple"
              onClick={redo}
              disabled={!future.length}
              title="Rehacer (Ctrl/Cmd+Shift+Z)"
              aria-label="Rehacer"
            >
              <Redo2 size={18} />
            </button>
          </div>
          <span className="save-status" role="status" aria-live="polite">
            {saveState === "saving"
              ? "Guardando…"
              : isDirty
                ? "Cambios sin guardar"
                : "Todo guardado"}
          </span>
          <Button
            variant="ghost"
            leftIcon={<Printer size={16} />}
            onClick={() => setPrintOpen(true)}
            title="Imprimir o guardar como PDF"
            aria-label="Imprimir o guardar como PDF"
            className="btn-print"
          >
            <span className="hide-sm">Imprimir / PDF</span>
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Cerrar
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
                  onClick={() => toggleWeek(wIndex)}
                >
                  <div className="week-title-group">
                    <button
                      type="button"
                      className="week-toggle"
                      aria-expanded={expandedWeek === wIndex}
                    >
                      <h3 className="week-title">Semana {week.weekNum}</h3>
                      {week.days.some(isDayIncomplete) && (
                        <span
                          className="incomplete-badge"
                          title="Hay días por completar"
                        >
                          <AlertCircle size={14} />
                          {week.days.filter(isDayIncomplete).length} por
                          completar
                        </span>
                      )}
                      {expandedWeek === wIndex ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
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
                          setConfirmAction({
                            type: "apply",
                            weekIndex: wIndex,
                          });
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
                          setConfirmAction({
                            type: "delete",
                            weekIndex: wIndex,
                          });
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
                            id={`day-card-${wIndex}-${dIndex}`}
                            className={`day-card ${!day.session ? "rest-day" : ""} ${movedKey === `${wIndex}:${dIndex}` ? "just-moved" : ""}`}
                          >
                            <div
                              className="day-header tap-ripple"
                              onClick={() => toggleDay(wIndex, dIndex)}
                            >
                              <button
                                type="button"
                                className="day-toggle"
                                aria-expanded={
                                  expandedWeek === wIndex &&
                                  expandedDay === dIndex
                                }
                              >
                                <span className="day-name">{day.dayName}</span>
                                <span className="day-summary">
                                  {!day.session ? (
                                    <span className="day-rest-label">
                                      Descanso
                                    </span>
                                  ) : day.isGym ? (
                                    <>
                                      <strong>
                                        {day.session.title || "Gimnasio"}
                                      </strong>
                                      <span className="day-sub">
                                        {day.session.exercises?.length || 0}{" "}
                                        ejercicio
                                        {(day.session.exercises?.length ||
                                          0) === 1
                                          ? ""
                                          : "s"}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <strong>
                                        {day.session.type?.name ||
                                          day.session.type?.code ||
                                          "Atletismo"}
                                        {day.session.training?.code
                                          ? ` · ${day.session.training.name || day.session.training.code}`
                                          : ""}
                                      </strong>
                                      <span className="day-sub">
                                        {day.session.mainBlock?.trim() ||
                                          "Sin bloque principal"}
                                      </span>
                                    </>
                                  )}
                                </span>
                                {isDayIncomplete(day) && (
                                  <span
                                    className="incomplete-badge"
                                    title="Falta completar este día"
                                  >
                                    <AlertCircle size={14} /> Incompleto
                                  </span>
                                )}
                              </button>
                              {!day.session && (
                                <div className="day-quick-add">
                                  <button
                                    type="button"
                                    className="btn-quick-add tap-ripple"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startDay(wIndex, dIndex, "ATHLETICS");
                                    }}
                                  >
                                    + Atletismo
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-quick-add tap-ripple"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startDay(wIndex, dIndex, "GYM");
                                    }}
                                  >
                                    + Gimnasio
                                  </button>
                                </div>
                              )}
                              <div className="day-move-actions">
                                <button
                                  className="btn-day-move tap-ripple"
                                  title="Mover día arriba"
                                  aria-label="Mover día arriba"
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
                                  aria-label="Mover día abajo"
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
                                    initial={
                                      instantDay
                                        ? false
                                        : { height: 0, opacity: 0 }
                                    }
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{
                                      height: 0,
                                      opacity: 0,
                                      transition: instantDay
                                        ? { duration: 0 }
                                        : undefined,
                                    }}
                                    transition={
                                      instantDay ? { duration: 0 } : undefined
                                    }
                                    className="day-body"
                                  >
                                    <div
                                      className="day-type-selector"
                                      role="group"
                                      aria-label="Tipo de día"
                                    >
                                      <button
                                        aria-pressed={!day.session}
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
                                        aria-pressed={
                                          !!day.session && !day.isGym
                                        }
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
                                        aria-pressed={
                                          !!day.session && !!day.isGym
                                        }
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
                                              value={
                                                day.session.type?.code || ""
                                              }
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

                                    {day.session && (
                                      <div className="day-footer">
                                        <Button
                                          variant="ghost"
                                          onClick={() => setExpandedDay(null)}
                                        >
                                          Cerrar día
                                        </Button>
                                        <Button
                                          variant="primary"
                                          onClick={() =>
                                            goNextDay(wIndex, dIndex)
                                          }
                                        >
                                          Siguiente día
                                        </Button>
                                      </div>
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
            <button
              type="button"
              className="btn-add-week tap-ripple"
              onClick={addWeek}
            >
              <Plus size={18} /> Agregar semana
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        onConfirm={handlePrint}
        variant="info"
        title="Imprimir plan"
        confirmText="Imprimir / PDF"
        cancelText="Cancelar"
        message="Elige qué parte del plan imprimir."
      >
        <div className="print-options">
          <label htmlFor="print-size">Agrupar por</label>
          <select
            id="print-size"
            value={printSize}
            onChange={(e) => {
              setPrintSize(Number(e.target.value));
              setPrintStart(0);
            }}
          >
            <option value={0}>Todo el plan</option>
            <option value={1}>Una semana</option>
            <option value={2}>Quincena (2 semanas)</option>
          </select>
          {printSize > 0 && (
            <>
              <label htmlFor="print-period">Período</label>
              <select
                id="print-period"
                value={printStart}
                onChange={(e) => setPrintStart(Number(e.target.value))}
              >
                {Array.from(
                  { length: Math.ceil(plan.length / printSize) },
                  (_, k) => {
                    const from = k * printSize;
                    const to = Math.min(from + printSize, plan.length);
                    return (
                      <option key={from} value={from}>
                        {to - from === 1 || from + 1 === to
                          ? `Semana ${from + 1}`
                          : `Semanas ${from + 1} a ${to}`}
                      </option>
                    );
                  },
                )}
              </select>
            </>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === "delete")
            deleteWeek(confirmAction.weekIndex);
          else applyWeekToAll(confirmAction.weekIndex);
        }}
        variant={confirmAction?.type === "delete" ? "danger" : "warning"}
        title={
          confirmAction?.type === "delete"
            ? `¿Eliminar la semana ${confirmAction.weekIndex + 1}?`
            : `¿Aplicar la semana ${confirmAction?.weekIndex + 1} a todo el plan?`
        }
        message={
          confirmAction?.type === "delete"
            ? "Se eliminará la semana con todas sus sesiones. Podrás recuperarla con Deshacer."
            : "Las demás semanas serán reemplazadas por una copia de esta. Podrás recuperarlas con Deshacer."
        }
        confirmText={confirmAction?.type === "delete" ? "Eliminar" : "Aplicar"}
        cancelText="Cancelar"
      />

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

        /* --- Usabilidad: historial, estado de guardado, accesibilidad --- */
        .history-actions {
          display: flex;
          gap: 0.25rem;
        }
        .btn-history {
          min-width: var(--touch-target-min, 44px);
          min-height: var(--touch-target-min, 44px);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          cursor: pointer;
        }
        .btn-history:hover:not(:disabled) {
          color: var(--color-primary);
          border-color: var(--color-primary-subtle);
        }
        .btn-history:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .actions {
          align-items: center;
        }
        .print-options {
          display: grid;
          gap: 0.5rem;
          text-align: left;
          margin-top: 0.75rem;
        }
        .day-summary {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
        .day-summary strong {
          color: var(--color-text);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .day-sub {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        .day-rest-label {
          color: var(--color-text-muted);
        }
        .day-quick-add {
          display: flex;
          gap: 0.4rem;
        }
        .btn-quick-add {
          min-height: var(--touch-target-min, 44px);
          padding: 0 0.85rem;
          border-radius: var(--radius-md);
          border: 1px dashed var(--color-primary);
          background: var(--color-primary-bg);
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-quick-add:hover {
          background: var(--color-primary);
          color: white;
        }
        .day-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--color-border);
        }
        @media (max-width: 768px) {
          .editor-header {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
          }
          .tabs { flex: 1 1 100%; }
          .tab-btn { flex: 1; justify-content: center; }
          .actions {
            flex: 1 1 100%;
            gap: 0.4rem;
            align-items: center;
          }
          .actions button { flex: 0 0 auto; }
          .actions .save-btn { flex: 1 1 auto; }
          .hide-sm { display: none; }
          .week-actions {
            width: 100%;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.25rem;
            -webkit-overflow-scrolling: touch;
          }
          .btn-week-action, .btn-del-week {
            flex: 0 0 auto;
            width: auto;
          }
          .day-quick-add { width: 100%; }
          .day-quick-add .btn-quick-add { flex: 1; }
          .day-toggle { flex: 1 1 100%; }
          .day-toggle .day-name,
          .day-toggle .day-summary {
            width: auto;
            order: 0;
          }
          .day-toggle .day-name { min-width: 72px; }
          .day-toggle .day-summary { flex: 1; min-width: 0; }
          .day-footer { position: sticky; bottom: 0; background: var(--color-bg-subtle); padding-bottom: 0.5rem; }
          .day-footer > * { flex: 1; }
        }
        .btn-add-week {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          min-height: var(--touch-target-min, 44px);
          margin-top: 0.75rem;
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--color-primary);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
        }
        .btn-add-week:hover { background: var(--color-bg-subtle); }
        /* Anchos intermedios (tablet / ventana angosta): el encabezado no debe desbordar */
        @media (max-width: 1100px) {
          .plan-editor { min-width: 0; max-width: 100%; }
          .editor-header {
            flex-wrap: wrap;
            gap: 0.5rem 0.75rem;
            padding: 0.5rem 0.75rem;
            max-width: 100%;
            box-sizing: border-box;
          }
          .tabs { flex: 1 1 100%; min-width: 0; }
          .tab-btn { flex: 1; justify-content: center; white-space: nowrap; }
          .actions {
            flex: 1 1 100%;
            min-width: 0;
            flex-wrap: wrap;
            gap: 0.4rem;
            align-items: center;
          }
          .actions .save-status { flex: 1 1 auto; min-width: 0; }
          .actions .save-btn { margin-left: auto; }
          .hide-sm { display: none; }
        }
        .print-options label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .print-options select {
          width: 100%;
          min-height: var(--touch-target-min, 44px);
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .day-card.just-moved {
          animation: dayMovedFlash 0.7s ease;
        }
        @keyframes dayMovedFlash {
          0% { box-shadow: 0 0 0 3px var(--color-primary); background: var(--color-primary-subtle); }
          100% { box-shadow: var(--shadow-sm); }
        }
        @media (prefers-reduced-motion: reduce) {
          .day-card.just-moved { animation: none; }
        }
        .save-status {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .week-toggle, .day-toggle {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-height: var(--touch-target-min, 44px);
        }
        .day-toggle {
          flex: 1;
          flex-wrap: wrap;
          min-width: 0;
        }
        .day-toggle .day-name { width: auto; min-width: 90px; }
        .day-toggle .day-summary { flex: 1; min-width: 0; }
        .week-toggle:focus-visible,
        .day-toggle:focus-visible,
        .btn-history:focus-visible,
        .tab-btn:focus-visible,
        .btn-week-action:focus-visible,
        .btn-del-week:focus-visible,
        .btn-day-move:focus-visible,
        .day-type-selector button:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        .incomplete-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: var(--color-warning-bg, rgba(245, 158, 11, 0.15));
          color: var(--color-warning);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Zonas táctiles de 44px y campos de 16px (evita zoom en iOS) */
        .tab-btn,
        .btn-week-action,
        .btn-del-week,
        .day-type-selector button {
          min-height: var(--touch-target-min, 44px);
          justify-content: center;
        }
        .btn-day-move {
          min-width: var(--touch-target-min, 44px);
          min-height: var(--touch-target-min, 44px);
          align-items: center;
          justify-content: center;
        }
        .btn-week-action { min-width: var(--touch-target-min, 44px); }
        .field input,
        .field select,
        .field textarea,
        .training-select {
          font-size: 1rem;
          min-height: var(--touch-target-min, 44px);
        }
        @media (max-width: 768px) {
          .save-status {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0 0 0 0);
          }
          .history-actions { flex: 0 0 auto; }
        }
      `}</style>
    </div>
  );
};

export default PlanEditor;
