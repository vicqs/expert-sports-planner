import React, { useState, useEffect } from "react";
import { Plus, Trash2, Dumbbell, X } from "lucide-react";
import { ALL_GYM_EXERCISES } from "../utils/constants";
import { Button } from "./ui";

const GymSessionEditor = ({
  session,
  weekNum,
  weightUnit = "lb",
  onChange,
}) => {
  const [localSession, setLocalSession] = useState(
    session || {
      title: "SESIÓN DE GIMNASIO",
      exercises: [],
    },
  );

  useEffect(() => {
    setLocalSession(
      session || {
        title: "SESIÓN DE GIMNASIO",
        exercises: [],
      },
    );
  }, [session]);

  const updateField = (field, value) => {
    const updated = { ...localSession, [field]: value };
    setLocalSession(updated);
    onChange(updated);
  };

  const addExercise = () => {
    const newEx = {
      name: "",
      weight: "",
      unit: weightUnit,
      series: "4",
      reps: "12",
      restVal: "60",
      restUnit: "s",
      notes: "",
    };
    const updated = {
      ...localSession,
      exercises: [...(localSession.exercises || []), newEx],
    };
    setLocalSession(updated);
    onChange(updated);
  };

  const removeExercise = (index) => {
    const updated = {
      ...localSession,
      exercises: localSession.exercises.filter((_, i) => i !== index),
    };
    setLocalSession(updated);
    onChange(updated);
  };

  const updateExercise = (index, field, value) => {
    const updatedEx = [...(localSession.exercises || [])];
    updatedEx[index] = { ...updatedEx[index], [field]: value };

    // Sync legacy rest field if needed, or just use restVal/restUnit
    if (field === "restVal" || field === "restUnit") {
      const val = field === "restVal" ? value : updatedEx[index].restVal || "";
      const unit =
        field === "restUnit" ? value : updatedEx[index].restUnit || "s";
      updatedEx[index].rest = `${val}${unit === "s" ? '"' : "'"}`;
    }

    const updated = { ...localSession, exercises: updatedEx };
    setLocalSession(updated);
    onChange(updated);
  };

  const getMuscleGroup = (name) => {
    if (!name) return "General";
    const lower = name.toLowerCase();
    if (
      lower.includes("sentadilla") ||
      lower.includes("prensa") ||
      lower.includes("estocada") ||
      lower.includes("femoral") ||
      lower.includes("talones")
    )
      return "Pierna";
    if (
      lower.includes("press") ||
      lower.includes("fondos") ||
      lower.includes("aperturas")
    )
      return "Empuje";
    if (
      lower.includes("remo") ||
      lower.includes("jalón") ||
      lower.includes("dominadas") ||
      lower.includes("curl")
    )
      return "Tracción";
    if (
      lower.includes("plancha") ||
      lower.includes("crunch") ||
      lower.includes("russian") ||
      lower.includes("bug")
    )
      return "Core";
    return "General";
  };

  const getBadgeColor = (group) => {
    switch (group) {
      case "Pierna":
        return "var(--color-primary)";
      case "Empuje":
        return "var(--color-warning)";
      case "Tracción":
        return "var(--color-success)";
      case "Core":
        return "var(--color-text-muted)";
      default:
        return "var(--color-text-muted)";
    }
  };

  return (
    <div className="gym-editor">
      <div className="gym-header">
        <div className="header-icon">
          <Dumbbell size={24} />
        </div>
        <input
          type="text"
          className="gym-title-input"
          value={localSession.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Título de la sesión (ej. Fuerza Hipertrofia)"
        />
      </div>

      <div className="exercises-grid">
        {(localSession.exercises || []).map((ex, i) => {
          const group = getMuscleGroup(ex.name);
          const badgeColor = getBadgeColor(group);

          return (
            <div key={i} className="exercise-card">
              <div className="card-header">
                <span className="ex-number">#{i + 1}</span>
                <span
                  className="muscle-badge"
                  style={{
                    backgroundColor: badgeColor + "20",
                    color: badgeColor,
                  }}
                >
                  {group}
                </span>
                <button
                  className="btn-remove"
                  onClick={() => removeExercise(i)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="card-body">
                <div className="field-group full">
                  <label>Ejercicio</label>
                  <div className="autocomplete-wrapper">
                    <input
                      type="text"
                      className="autocomplete-input"
                      placeholder="Buscar o seleccionar ejercicio..."
                      value={ex.name || ""}
                      onChange={(e) =>
                        updateExercise(i, "name", e.target.value)
                      }
                      list={`exercise-list-${i}`}
                      autoComplete="off"
                    />
                    {ex.name && (
                      <button
                        className="clear-search-btn"
                        onClick={() => updateExercise(i, "name", "")}
                        type="button"
                        title="Limpiar"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <datalist id={`exercise-list-${i}`}>
                      {ALL_GYM_EXERCISES.filter((e) => {
                        const searchTerm = (ex.name || "").toLowerCase().trim();
                        if (!searchTerm) return true;
                        return e.toLowerCase().includes(searchTerm);
                      })
                        .slice(0, 100)
                        .map((e) => (
                          <option key={e} value={e} />
                        ))}
                    </datalist>
                  </div>
                </div>

                <div className="row-group">
                  <div className="field-group">
                    <label>Series</label>
                    <input
                      type="number"
                      value={ex.series}
                      onChange={(e) =>
                        updateExercise(i, "series", e.target.value)
                      }
                      placeholder="4"
                    />
                  </div>

                  <div className="field-group">
                    <label>Reps</label>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) =>
                        updateExercise(i, "reps", e.target.value)
                      }
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="row-group">
                  <div className="field-group">
                    <label>Peso ({weightUnit})</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        value={ex.weight}
                        onChange={(e) =>
                          updateExercise(i, "weight", e.target.value)
                        }
                        placeholder="0"
                      />
                      <select
                        value={ex.unit || weightUnit}
                        onChange={(e) =>
                          updateExercise(i, "unit", e.target.value)
                        }
                        className="unit-select"
                      >
                        <option value="lb">lb</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Descanso</label>
                    <div className="input-group-joined">
                      <input
                        type="number"
                        value={ex.restVal || ex.rest?.replace(/\D/g, "") || ""}
                        onChange={(e) =>
                          updateExercise(i, "restVal", e.target.value)
                        }
                        placeholder="60"
                      />
                      <select
                        value={ex.restUnit || "s"}
                        onChange={(e) =>
                          updateExercise(i, "restUnit", e.target.value)
                        }
                      >
                        <option value="s">s</option>
                        <option value="'">m</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button className="btn-add-card" onClick={addExercise}>
          <div className="icon-circle">
            <Plus size={24} />
          </div>
          <span>Agregar Ejercicio</span>
        </button>
      </div>

      <style>{`
        .gym-editor {
          background: var(--color-bg-subtle);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        .gym-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .header-icon {
            width: 40px;
            height: 40px;
            background: var(--color-primary-subtle);
            color: var(--color-primary);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .gym-title-input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .gym-title-input:focus {
          outline: none;
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
        }
        
        .exercises-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        
        .exercise-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
        }
        
        .exercise-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: var(--color-border-hover);
        }
        
        .card-header {
            padding: 0.75rem 1rem;
            background: var(--color-bg-subtle);
            border-bottom: 1px solid var(--color-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ex-number {
            font-weight: 700;
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }
        
        .muscle-badge {
            font-size: 0.7rem;
            text-transform: uppercase;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: var(--radius-full);
            letter-spacing: 0.05em;
        }
        
        .card-body {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .field-group {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
        }
        .field-group label {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--color-text-muted);
            text-transform: uppercase;
        }
        .field-group input, .field-group select {
            width: 100%;
            padding: 0.5rem;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            font-size: 0.9rem;
            color: var(--color-text);
            transition: all 0.2s;
        }
        .field-group input:focus, .field-group select:focus {
            outline: none;
            border-color: var(--color-primary);
            background: var(--color-surface);
        }
        
        .row-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
        }
        
        .input-with-unit {
            display: flex;
            gap: 0.25rem;
        }
        .unit-select {
            width: 60px !important;
        }
        
        .input-group-joined {
            display: flex;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            overflow: hidden;
        }
        .input-group-joined input {
            border: none;
            border-radius: 0;
            text-align: center;
        }
        .input-group-joined select {
            border: none;
            border-left: 1px solid var(--color-border);
            border-radius: 0;
            background: var(--color-bg-subtle);
            width: 50px !important;
            padding: 0;
            text-align: center;
        }

        .btn-remove {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .btn-remove:hover { 
            color: var(--color-error);
            background: var(--color-error-bg);
        }
        
        .btn-add-card {
            background: transparent;
            border: 2px dashed var(--color-border);
            border-radius: var(--radius-md);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            color: var(--color-text-muted);
            cursor: pointer;
            min-height: 200px;
            transition: all 0.2s;
        }
        .btn-add-card:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
            background: var(--color-primary-subtle);
        }
        .icon-circle {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--color-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .btn-add-card:hover .icon-circle {
            background: var(--color-surface);
            color: var(--color-primary);
        }

        .autocomplete-wrapper {
          position: relative;
          margin-bottom: 0.5rem;
        }

        .autocomplete-input {
          width: 100%;
          padding: 0.6rem 2.5rem 0.6rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text);
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .autocomplete-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-subtle);
        }

        .clear-search-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .clear-search-btn:hover {
          background: var(--color-bg-subtle);
          color: var(--color-text);
        }
        
        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          .gym-editor {
            padding: 0;
          }
          
          .gym-header {
            padding: 1rem;
            gap: 0.75rem;
          }
          
          .header-icon {
            width: 36px;
            height: 36px;
          }
          
          .header-icon svg {
            width: 20px;
            height: 20px;
          }
          
          .gym-title-input {
            font-size: 0.95rem;
          }
          
          .exercises-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .exercise-card {
            padding: 1rem;
          }
          
          .card-header {
            gap: 0.5rem;
          }
          
          .ex-number {
            font-size: 0.85rem;
          }
          
          .muscle-badge {
            font-size: 0.7rem;
            padding: 0.25rem 0.5rem;
          }
          
          .row-group {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .field-group label {
            font-size: 0.75rem;
          }
          
          .field-group input,
          .field-group select {
            padding: 0.65rem;
            font-size: 0.9rem;
          }
          
          .btn-add-card {
            min-height: 150px;
          }
        }
        
        @media (max-width: 480px) {
          .gym-header {
            padding: 0.75rem;
          }
          
          .gym-title-input {
            font-size: 0.85rem;
          }
          
          .exercises-grid {
            gap: 0.75rem;
          }
          
          .exercise-card {
            padding: 0.75rem;
          }
          
          .card-header {
            flex-wrap: wrap;
          }
          
          .ex-number,
          .muscle-badge {
            font-size: 0.7rem;
          }
          
          .field-group.full {
            margin-bottom: 0.75rem;
          }
          
          .field-group label {
            font-size: 0.7rem;
            margin-bottom: 0.35rem;
          }
          
          .field-group input,
          .field-group select {
            padding: 0.6rem;
            font-size: 0.85rem;
          }
          
          .input-with-unit {
            gap: 0.25rem;
          }
          
          .unit-select {
            width: 50px !important;
            font-size: 0.8rem;
          }
          
          .btn-add-card {
            min-height: 120px;
            gap: 0.75rem;
          }
          
          .icon-circle {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default GymSessionEditor;
