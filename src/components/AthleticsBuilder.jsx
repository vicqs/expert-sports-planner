import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, Clock } from "lucide-react";
import { SYMBOLS } from "../utils/constants";

const TimeInput = ({ value, onChange }) => {
  const parse = (val) => {
    if (!val) return { m: "", s: "" };
    // Handle mm'ss" format or mm:ss format
    const clean = val.replace(/["']/g, ":").replace(/[^0-9:]/g, "");
    if (clean.includes(":")) {
      const parts = clean.split(":").filter((p) => p !== "");
      return { m: parts[0] || "", s: parts[1] || "" };
    }
    return { m: clean, s: "" };
  };

  const [local, setLocal] = useState(parse(value));

  useEffect(() => {
    const parsed = parse(value);
    if (parsed.m !== local.m || parsed.s !== local.s) {
      setLocal(parsed);
    }
  }, [value]);

  const handleChange = (field, val) => {
    const newLocal = { ...local, [field]: val };
    setLocal(newLocal);
    let out = "";
    if (newLocal.m) out += `${newLocal.m}'`;
    if (newLocal.s) out += `${newLocal.s}"`;
    onChange(out);
  };

  return (
    <div className="time-input-group">
      <input
        type="text"
        placeholder="mm"
        value={local.m}
        onChange={(e) => handleChange("m", e.target.value)}
        className="time-part"
      />
      <span className="separator">:</span>
      <input
        type="text"
        placeholder="ss"
        value={local.s}
        onChange={(e) => handleChange("s", e.target.value)}
        className="time-part"
      />
    </div>
  );
};

const PaceInput = ({ value, unit, onChange }) => {
  const parse = (val) => {
    if (!val) return { m: "", s: "" };
    const clean = val.replace(/[^0-9:]/g, "");
    if (clean.includes(":")) {
      const [m, s] = clean.split(":");
      return { m, s };
    }
    return { m: clean, s: "" };
  };

  const [local, setLocal] = useState(parse(value));

  useEffect(() => {
    const parsed = parse(value);
    if (parsed.m !== local.m || parsed.s !== local.s) {
      setLocal(parsed);
    }
  }, [value]);

  const handleChange = (field, val) => {
    const newLocal = { ...local, [field]: val };
    setLocal(newLocal);
    if (newLocal.m && newLocal.s) {
      onChange(`${newLocal.m}:${newLocal.s}`);
    } else if (newLocal.m) {
      onChange(`${newLocal.m}:00`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="pace-input-group">
      <input
        type="text"
        placeholder="mm"
        value={local.m}
        onChange={(e) => handleChange("m", e.target.value)}
        className="time-part"
      />
      <span className="separator">:</span>
      <input
        type="text"
        placeholder="ss"
        value={local.s}
        onChange={(e) => handleChange("s", e.target.value)}
        className="time-part"
      />
      <span className="unit-label">/{unit}</span>
    </div>
  );
};

const AthleticsBuilder = ({ session, unit = "km", onChange }) => {
  const updateField = (field, value) => {
    onChange({ ...session, [field]: value });
  };

  // Segment Builder State
  const [segmentType, setSegmentType] = useState("SIMPLE"); // SIMPLE, INTERVAL, PROGRESSIVE, FARTLEK
  const [segState, setSegState] = useState({
    reps: "1",
    distType: "TIME", // TIME or DIST
    distVal: "",
    timeVal: "", // formatted string
    paceStart: "",
    paceEnd: "",
    restVal: "",
    restType: "TIME", // TIME or DIST
    // Fartlek specific
    ftkFast: "",
    ftkSlow: "",
    // Advanced Interval
    compoundDist: "", // e.g. "400" for "800 + 400"
    paceMod: "", // '↓', '↘', ''
  });

  const [segments, setSegments] = useState([]);

  // Sync segments from mainBlock if empty on mount (optional, complex parsing)
  // For now, we start empty or rely on manual addition.

  // Helper to format a single segment string
  const buildSegmentString = () => {
    // FARTLEK Construction
    if (segmentType === "FARTLEK") {
      // Format: TotalDuration @ Fast :: Slow
      // Example: 15' @ 4' :: 1'
      const total = segState.timeVal || "15'";
      const fast = segState.ftkFast || "1'";
      const slow = segState.ftkSlow || "1'";
      return `${total} @ ${fast} ${SYMBOLS.REST_SERIES} ${slow}`;
    }

    // Distance/Duration part
    let duration = "";
    if (segState.distType === "TIME") {
      duration = segState.timeVal; // e.g. "35'"
    } else {
      duration = `${segState.distVal}${unit === "km" ? "k" : "mi"}`; // e.g. "5k"
    }

    // Compound Distance logic (e.g. 800 + 400)
    if (segmentType === "INTERVAL" && segState.compoundDist) {
      duration = `${segState.distVal} + ${segState.compoundDist}`;
    }

    // Pace part
    let pace = "";
    const mod = segState.paceMod || "";

    if (segmentType === "PROGRESSIVE") {
      // Example: 40' @ 6:35 ↘ 6:25 /km
      pace = `@ ${segState.paceStart} ${SYMBOLS.PROGRESSION_DOWN} ${segState.paceEnd} /${unit}`;
    } else {
      if (segState.paceStart) {
        // Example: @ ↓ 5:45 /km
        pace = `@ ${mod} ${segState.paceStart}/${unit}`;
      }
    }

    // Interval Construction
    if (segmentType === "INTERVAL") {
      // Rest part
      let rest = "";
      if (segState.restVal) {
        rest = `${SYMBOLS.REST_SERIES} ${segState.restVal}`;
      }
      return `${segState.reps} [ ${duration} ${pace} ${rest} ]`;
    }

    // Simple/Progressive Construction
    return `${duration} ${pace}`;
  };

  const addSegment = () => {
    const str = buildSegmentString();
    if (!str) return;
    const newSegments = [...segments, str];
    setSegments(newSegments);
    updateField("mainBlock", newSegments.join(" + "));

    // Reset inputs partially
    setSegState((prev) => ({
      ...prev,
      distVal: "",
      timeVal: "",
      paceStart: "",
      paceEnd: "",
      restVal: "",
      compoundDist: "",
    }));
  };

  const removeSegment = (idx) => {
    const newSegments = segments.filter((_, i) => i !== idx);
    setSegments(newSegments);
    updateField("mainBlock", newSegments.join(" + "));
  };

  const insertSymbol = (sym) => {
    const current = session.mainBlock || "";
    updateField("mainBlock", current + sym);
  };

  return (
    <div className="athletics-builder">
      {/* Visualizer Bar */}
      <div className="session-visualizer">
        <div className="vis-block warmup" title="Calentamiento">
          C
        </div>
        {segments.map((seg, i) => (
          <div key={i} className="vis-block main" title={seg}>
            {i + 1}
          </div>
        ))}
        {segments.length === 0 && (
          <div className="vis-block empty">Bloque Principal</div>
        )}
        <div className="vis-block cooldown" title="Afloje">
          A
        </div>
      </div>

      {/* Warmup */}
      <div className="section-row">
        <label className="section-label">Calentamiento {SYMBOLS.WARMUP}</label>
        <div className="compact-row">
          <TimeInput
            value={session.warmup?.split("@")[0] || ""}
            onChange={(val) => updateField("warmup", `${val}@TRO`)}
          />
          <span className="static-text">@ TRO</span>
        </div>
      </div>

      {/* Main Block Builder */}
      <div className="main-block-builder">
        <div className="builder-header">
          <label className="section-label">Bloque Principal</label>
          <div className="tabs-mini">
            <button
              className={segmentType === "SIMPLE" ? "active" : ""}
              onClick={() => setSegmentType("SIMPLE")}
            >
              Continuo
            </button>
            <button
              className={segmentType === "INTERVAL" ? "active" : ""}
              onClick={() => setSegmentType("INTERVAL")}
            >
              Intervalos
            </button>
            <button
              className={segmentType === "FARTLEK" ? "active" : ""}
              onClick={() => setSegmentType("FARTLEK")}
            >
              Fartlek
            </button>
            <button
              className={segmentType === "PROGRESSIVE" ? "active" : ""}
              onClick={() => setSegmentType("PROGRESSIVE")}
            >
              Progresivo
            </button>
          </div>
        </div>

        <div className="builder-controls">
          {segmentType === "INTERVAL" && (
            <div className="control-group">
              <label>Reps</label>
              <input
                type="number"
                className="input-short"
                value={segState.reps}
                onChange={(e) =>
                  setSegState({ ...segState, reps: e.target.value })
                }
              />
            </div>
          )}

          {segmentType === "FARTLEK" ? (
            <>
              <div className="control-group">
                <label>Total</label>
                <TimeInput
                  value={segState.timeVal}
                  onChange={(val) => setSegState({ ...segState, timeVal: val })}
                />
              </div>
              <div className="control-group">
                <label>Rápido</label>
                <TimeInput
                  value={segState.ftkFast}
                  onChange={(val) => setSegState({ ...segState, ftkFast: val })}
                />
              </div>
              <div className="control-group">
                <label>Lento</label>
                <TimeInput
                  value={segState.ftkSlow}
                  onChange={(val) => setSegState({ ...segState, ftkSlow: val })}
                />
              </div>
            </>
          ) : (
            <div className="control-group">
              <label>Duración</label>
              <div className="toggle-input">
                <select
                  value={segState.distType}
                  onChange={(e) =>
                    setSegState({ ...segState, distType: e.target.value })
                  }
                >
                  <option value="TIME">Tiempo</option>
                  <option value="DIST">Distancia</option>
                </select>
                {segState.distType === "TIME" ? (
                  <TimeInput
                    value={segState.timeVal}
                    onChange={(val) =>
                      setSegState({ ...segState, timeVal: val })
                    }
                  />
                ) : (
                  <div className="dist-input">
                    <input
                      type="number"
                      value={segState.distVal}
                      onChange={(e) =>
                        setSegState({ ...segState, distVal: e.target.value })
                      }
                    />
                    {segmentType === "INTERVAL" && (
                      <>
                        <span>+</span>
                        <input
                          type="number"
                          placeholder="Comp"
                          value={segState.compoundDist}
                          onChange={(e) =>
                            setSegState({
                              ...segState,
                              compoundDist: e.target.value,
                            })
                          }
                          style={{ width: "40px" }}
                        />
                      </>
                    )}
                    <span>{unit}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {segmentType !== "FARTLEK" && (
            <div className="control-group">
              <label>
                Ritmo {segmentType === "PROGRESSIVE" ? "Inicial" : ""}
              </label>
              <div
                className="pace-wrapper"
                style={{ display: "flex", gap: "4px" }}
              >
                {segmentType === "INTERVAL" && (
                  <select
                    className="mini-select"
                    value={segState.paceMod}
                    onChange={(e) =>
                      setSegState({ ...segState, paceMod: e.target.value })
                    }
                  >
                    <option value="">=</option>
                    <option value={SYMBOLS.DOWN}>{SYMBOLS.DOWN}</option>
                    <option value={SYMBOLS.UP}>{SYMBOLS.UP}</option>
                  </select>
                )}
                <PaceInput
                  value={segState.paceStart}
                  unit={unit}
                  onChange={(val) =>
                    setSegState({ ...segState, paceStart: val })
                  }
                />
              </div>
            </div>
          )}

          {segmentType === "PROGRESSIVE" && (
            <div className="control-group">
              <label>Ritmo Final {SYMBOLS.PROGRESSION_DOWN}</label>
              <PaceInput
                value={segState.paceEnd}
                unit={unit}
                onChange={(val) => setSegState({ ...segState, paceEnd: val })}
              />
            </div>
          )}

          {segmentType === "INTERVAL" && (
            <div className="control-group">
              <label>Recup {SYMBOLS.REST_SERIES}</label>
              <TimeInput
                value={segState.restVal}
                onChange={(val) => setSegState({ ...segState, restVal: val })}
              />
            </div>
          )}

          <button className="btn-add" onClick={addSegment}>
            <Plus size={18} />
          </button>
        </div>

        {/* Segments List */}
        {segments.length > 0 && (
          <div className="segments-list">
            {segments.map((seg, i) => (
              <div key={i} className="segment-chip">
                {seg}
                <button onClick={() => removeSegment(i)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Final Output */}
        <div className="final-output-wrapper">
          <div className="symbol-bar">
            <button
              onClick={() => insertSymbol(SYMBOLS.SEPARATOR)}
              title="Separador"
            >
              ||
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.REST_SERIES)}
              title="Pausa Serie"
            >
              ::
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.PROGRESSION_DOWN)}
              title="Progresivo"
            >
              ↘
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.DOWN)}
              title="Más rápido"
            >
              ↓
            </button>
            <button onClick={() => insertSymbol(SYMBOLS.STRONG)} title="Fuerte">
              F
            </button>
            <button onClick={() => insertSymbol(SYMBOLS.SOFT)} title="Suave">
              S
            </button>
            <button onClick={() => insertSymbol(SYMBOLS.PACE)} title="Ritmo">
              Ritmo
            </button>
            <button onClick={() => insertSymbol(SYMBOLS.AVG)} title="Promedio">
              Prom
            </button>
            <button onClick={() => insertSymbol(SYMBOLS.CHANGE)} title="Cambio">
              Cambio
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.BEST_PACE)}
              title="Mejor ritmo"
            >
              MRP
            </button>
            <button onClick={() => insertSymbol(SYMBOLS.SPRINT)} title="Sprint">
              Sprint
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.CIRCUIT)}
              title="Circuito"
            >
              Circ
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.REST_SERIES)}
              title="Descanso Series"
            >
              D.Ser
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.REST_BLOCK)}
              title="Descanso Bloques"
            >
              D.Bloq
            </button>
            <button
              onClick={() => insertSymbol(SYMBOLS.REST_30_SEC)}
              title="Descanso 30s"
            >
              30s
            </button>
            <button onClick={() => insertSymbol(" + ")} title="Más">
              +
            </button>
            <button onClick={() => insertSymbol(" [ ")} title="Abrir">
              [
            </button>
            <button onClick={() => insertSymbol(" ] ")} title="Cerrar">
              ]
            </button>
          </div>
          <div className="final-output">
            <span className="symbol">{SYMBOLS.SEPARATOR}</span>
            <input
              value={session.mainBlock}
              onChange={(e) => updateField("mainBlock", e.target.value)}
              placeholder="Bloque principal..."
            />
          </div>
        </div>
      </div>

      {/* Cooldown */}
      <div className="section-row">
        <label className="section-label">Afloje {SYMBOLS.COOLDOWN}</label>
        <div className="compact-row">
          <TimeInput
            value={session.cooldown?.split("@")[0] || ""}
            onChange={(val) => updateField("cooldown", `${val}@TRO`)}
          />
          <span className="static-text">@ TRO</span>
        </div>
      </div>

      <style>{`
        .athletics-builder {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            background: var(--color-bg-subtle);
            padding: 1.5rem;
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
        }
        
        .session-visualizer {
            display: flex;
            height: 8px;
            gap: 2px;
            margin-bottom: 0.5rem;
            border-radius: 4px;
            overflow: hidden;
            background: var(--color-border);
        }
        
        .vis-block {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0px; /* Hide text but keep for tooltip */
            transition: all 0.2s;
        }
        
        .vis-block.warmup, .vis-block.cooldown {
            width: 15%;
            background: var(--color-text-light);
            opacity: 0.5;
        }
        
        .vis-block.main {
            flex: 1;
            background: var(--color-primary);
        }
        
        .vis-block.empty {
            flex: 1;
            background: transparent;
        }

        .section-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .section-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .compact-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .static-text {
            font-family: var(--font-mono);
            font-size: 0.9rem;
            color: var(--color-text-muted);
        }
        .main-block-builder {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 1.25rem;
            box-shadow: var(--shadow-sm);
        }
        .builder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.25rem;
        }
        .tabs-mini {
            display: flex;
            gap: 4px;
            background: var(--color-bg-subtle);
            padding: 4px;
            border-radius: var(--radius-md);
        }
        .tabs-mini button {
            border: none;
            background: transparent;
            font-size: 0.75rem;
            padding: 6px 12px;
            cursor: pointer;
            color: var(--color-text-muted);
            border-radius: var(--radius-sm);
            font-weight: 500;
            transition: all 0.2s;
        }
        .tabs-mini button.active {
            background: var(--color-surface);
            color: var(--color-primary);
            font-weight: 600;
            box-shadow: var(--shadow-sm);
        }
        .builder-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: flex-end;
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--color-border);
        }
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }
        .control-group label {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--color-text-muted);
            text-transform: uppercase;
        }
        
        /* Cleaner Inputs */
        .time-input-group, .pace-input-group {
            display: flex;
            align-items: center;
            background: var(--color-bg-subtle);
            border: 1px solid transparent;
            border-radius: var(--radius-md);
            padding: 2px 6px;
            transition: all 0.2s;
        }
        .time-input-group:hover, .pace-input-group:hover, .time-input-group:focus-within, .pace-input-group:focus-within {
            background: var(--color-surface);
            border-color: var(--color-border);
            box-shadow: var(--shadow-sm);
        }
        
        .time-part {
            width: 36px;
            border: none;
            background: transparent;
            text-align: center;
            font-family: var(--font-mono);
            font-size: 0.95rem;
            color: var(--color-text);
            padding: 6px 0;
        }
        .time-part:focus { outline: none; }
        .separator { color: var(--color-text-muted); font-weight: bold; opacity: 0.5; }
        .unit-label { font-size: 0.7rem; color: var(--color-text-muted); padding-right: 4px; }
        
        .toggle-input {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        .toggle-input select {
            border: none;
            background: transparent;
            font-size: 0.8rem;
            color: var(--color-primary);
            cursor: pointer;
            padding: 0;
            font-weight: 600;
        }
        .dist-input {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background: var(--color-bg-subtle);
            border: 1px solid transparent;
            border-radius: var(--radius-md);
            padding: 0 0.5rem;
            transition: all 0.2s;
        }
        .dist-input:hover, .dist-input:focus-within {
            background: var(--color-surface);
            border-color: var(--color-border);
            box-shadow: var(--shadow-sm);
        }
        .dist-input input {
            width: 50px;
            border: none;
            background: transparent;
            text-align: right;
            font-family: var(--font-mono);
            padding: 6px 0;
            font-size: 0.95rem;
        }
        .dist-input input:focus { outline: none; }
        
        .input-short {
            width: 60px;
            padding: 0.5rem;
            background: var(--color-bg-subtle);
            border: 1px solid transparent;
            border-radius: var(--radius-md);
            text-align: center;
            font-weight: 600;
            transition: all 0.2s;
        }
        .input-short:hover, .input-short:focus {
            background: var(--color-surface);
            border-color: var(--color-border);
            box-shadow: var(--shadow-sm);
            outline: none;
        }
        
        .btn-add {
            background: var(--color-primary);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin-left: auto;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s;
        }
        .btn-add:hover {
            background: var(--color-primary-hover);
            transform: scale(1.05);
            box-shadow: var(--shadow-md);
        }
        
        .segments-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .segment-chip {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            padding: 6px 10px;
            border-radius: var(--radius-full);
            font-size: 0.85rem;
            font-family: var(--font-mono);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: var(--shadow-sm);
        }
        .segment-chip button {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            padding: 2px;
            display: flex;
            border-radius: 50%;
            transition: all 0.2s;
        }
        .segment-chip button:hover { 
            color: var(--color-error);
            background: var(--color-error-bg);
        }
        
        .final-output-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .symbol-bar {
            display: flex;
            gap: 0.25rem;
            overflow-x: auto;
            padding-bottom: 0.25rem;
        }
        .symbol-bar button {
            background: var(--color-bg-subtle);
            border: 1px solid var(--color-border);
            border-radius: 4px;
            padding: 2px 6px;
            font-family: var(--font-mono);
            font-size: 0.75rem;
            cursor: pointer;
            color: var(--color-text-muted);
            min-width: 24px;
        }
        .symbol-bar button:hover {
            background: var(--color-surface);
            color: var(--color-primary);
            border-color: var(--color-primary);
        }

        .final-output {
            display: flex;
            align-items: center;
            background: var(--color-bg-subtle);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            transition: all 0.2s;
        }
        .final-output:focus-within {
            background: var(--color-surface);
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-subtle);
        }
        .symbol {
            padding: 0.75rem;
            color: var(--color-primary);
            font-weight: bold;
            font-family: var(--font-mono);
            border-right: 1px solid var(--color-border);
            background: var(--color-bg-subtle);
            border-radius: var(--radius-md) 0 0 var(--radius-md);
        }
        .final-output input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 0.75rem;
            font-family: var(--font-mono);
            color: var(--color-text);
            font-size: 0.9rem;
        }
        .final-output input:focus { outline: none; }
        
        .mini-select {
            border: none;
            background: transparent;
            font-size: 0.8rem;
            color: var(--color-primary);
            font-weight: bold;
            cursor: pointer;
            padding: 0;
        }
        
        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          .session-visualizer {
            gap: 0.25rem;
            padding: 0.75rem;
          }
          
          .vis-block {
            min-width: 30px;
            height: 30px;
            font-size: 0.7rem;
          }
          
          .section-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .compact-row {
            width: 100%;
            justify-content: flex-start;
          }
          
          .main-block-builder {
            padding: 1rem;
          }
          
          .builder-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .tabs-mini {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
          }
          
          .tabs-mini button {
            flex: 1;
            min-width: fit-content;
            white-space: nowrap;
            font-size: 0.7rem;
            padding: 6px 10px;
          }
          
          .builder-controls {
            gap: 0.75rem;
          }
          
          .control-group {
            min-width: 100%;
          }
          
          .control-group label {
            font-size: 0.65rem;
          }
          
          .toggle-input {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
          
          .toggle-input select {
            width: 100%;
            padding: 0.5rem;
            font-size: 0.85rem;
          }
          
          .dist-input {
            width: 100%;
            padding: 0.5rem;
          }
          
          .dist-input input {
            flex: 1;
            min-width: 50px;
          }
          
          .pace-wrapper {
            width: 100%;
          }
          
          .time-input-group,
          .pace-input-group {
            width: 100%;
            padding: 0.5rem;
          }
          
          .time-part {
            font-size: 0.9rem;
            flex: 1;
            min-width: 30px;
          }
          
          .input-short {
            width: 100%;
            padding: 0.6rem;
          }
          
          .segments-list {
            gap: 0.5rem;
          }
          
          .segment-chip {
            font-size: 0.8rem;
            padding: 5px 8px;
            word-break: break-all;
          }
          
          .symbol-bar {
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          
          .symbol-bar button {
            min-width: 32px;
            font-size: 0.7rem;
          }
          
          .final-output {
            flex-wrap: wrap;
          }
          
          .final-output input {
            min-width: 0;
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .athletics-builder {
            padding: 0;
          }
          
          .session-visualizer {
            padding: 0.5rem;
            gap: 0.2rem;
          }
          
          .vis-block {
            min-width: 28px;
            height: 28px;
            font-size: 0.65rem;
            padding: 0.25rem;
          }
          
          .section-row {
            gap: 0.5rem;
          }
          
          .section-label {
            font-size: 0.7rem;
          }
          
          .compact-row {
            gap: 0.5rem;
          }
          
          .static-text {
            font-size: 0.8rem;
          }
          
          .main-block-builder {
            padding: 0.75rem;
          }
          
          .builder-header {
            gap: 0.5rem;
          }
          
          .tabs-mini {
            gap: 2px;
            padding: 2px;
          }
          
          .tabs-mini button {
            font-size: 0.65rem;
            padding: 5px 8px;
          }
          
          .builder-controls {
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
          }
          
          .control-group {
            width: 100%;
          }
          
          .control-group label {
            font-size: 0.6rem;
            margin-bottom: 0.3rem;
          }
          
          .toggle-input select {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
          
          .dist-input {
            padding: 0.4rem;
          }
          
          .dist-input input {
            font-size: 0.8rem;
            padding: 0.25rem;
          }
          
          .dist-input span {
            font-size: 0.75rem;
          }
          
          .time-input-group,
          .pace-input-group {
            padding: 0.4rem;
          }
          
          .time-part,
          .pace-input-group input {
            font-size: 0.8rem;
            padding: 0.25rem;
          }
          
          .separator,
          .unit-label {
            font-size: 0.65rem;
          }
          
          .input-short {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
          
          .btn-add {
            width: 32px;
            height: 32px;
          }
          
          .btn-add svg {
            width: 16px;
            height: 16px;
          }
          
          .segments-list {
            gap: 0.4rem;
          }
          
          .segment-chip {
            font-size: 0.7rem;
            padding: 4px 6px;
          }
          
          .segment-chip button {
            padding: 1px;
          }
          
          .final-output-wrapper {
            gap: 0.4rem;
          }
          
          .symbol-bar {
            gap: 0.2rem;
            padding-bottom: 0.2rem;
          }
          
          .symbol-bar button {
            font-size: 0.65rem;
            padding: 3px 5px;
            min-width: 28px;
          }
          
          .final-output {
            flex-direction: column;
            align-items: stretch;
          }
          
          .symbol {
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            text-align: center;
            padding: 0.5rem;
          }
          
          .final-output input {
            padding: 0.6rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AthleticsBuilder;
