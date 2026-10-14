import React, { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Ruler,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button, Card, ConfirmDialog, useToast } from "../ui";
import {
  MEASUREMENT_SECTIONS,
  RESULT_ROWS,
  computeResults,
  deleteMeasurement,
  fieldKind,
  formatNumber,
  fromDisplay,
  parseDecimal,
  sanitizeNumeric,
  saveMeasurement,
  toDisplay,
  unitLabel,
  useMeasurementUnits,
  useMeasurements,
  type MeasurementEntry,
  type Sex,
} from "../../utils/measurements";
import { newId } from "../../utils/validation";

interface Props {
  athleteId: string;
  /** Solo el entrenador edita; el atleta ve en modo lectura. */
  readOnly?: boolean;
  /** Fecha de nacimiento (YYYY-MM-DD) para sugerir la edad. */
  birthDate?: string;
}

const todayStr = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const ageFromBirth = (birth?: string): number | "" => {
  if (!birth) return "";
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age > 0 ? age : "";
};

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

const LineChart: React.FC<{
  title: string;
  unit: string;
  points: { label: string; value: number }[];
  color: string;
}> = ({ title, unit, points, color }) => {
  if (points.length < 2) return null;
  const w = 300;
  const h = 110;
  const pad = 14;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const coords = points.map((p, i) => ({
    x: pad + (i * (w - pad * 2)) / (points.length - 1),
    y: h - pad - ((p.value - min) / span) * (h - pad * 2),
    ...p,
  }));
  const path = coords.map((c, i) => `${i ? "L" : "M"}${c.x},${c.y}`).join(" ");
  return (
    <div className="mv-chart">
      <h5>
        {title} <small>({unit})</small>
      </h5>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
        {coords.map((c) => (
          <g key={c.label}>
            <circle cx={c.x} cy={c.y} r="4" fill={color}>
              <title>{`${c.label}: ${formatNumber(c.value, 2)} ${unit}`}</title>
            </circle>
            <text
              x={c.x}
              y={c.y - 8}
              textAnchor="middle"
              fontSize="9"
              fill="currentColor"
            >
              {formatNumber(c.value, 1)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const MeasurementsView: React.FC<Props> = ({
  athleteId,
  readOnly = false,
  birthDate,
}) => {
  const entries = useMeasurements(athleteId);
  const units = useMeasurementUnits();
  const { addToast } = useToast();
  const [form, setForm] = useState<null | {
    id: string | null;
    date: string;
    sex: Sex;
    age: string;
    values: Record<string, string>;
  }>(null);
  const [toDelete, setToDelete] = useState<MeasurementEntry | null>(null);

  const results = useMemo(() => entries.map(computeResults), [entries]);

  const disp = (key: string, v: number | null | undefined) =>
    v ? toDisplay(v, fieldKind(key), units) : null;

  // Convierte lo escrito (en la unidad elegida) a valores canónicos cm/kg/mm.
  const toCanonical = (raw: Record<string, string>) => {
    const values: Record<string, number> = {};
    Object.entries(raw).forEach(([k, r]) => {
      const n = parseDecimal(r);
      if (n !== null && n > 0) values[k] = fromDisplay(n, fieldKind(k), units);
    });
    return values;
  };

  const openForm = (entry?: MeasurementEntry) => {
    const last = entries[entries.length - 1];
    if (entry) {
      setForm({
        id: entry.id,
        date: entry.date,
        sex: entry.sex,
        age: String(entry.age),
        values: Object.fromEntries(
          Object.entries(entry.values).map(([k, v]) => [
            k,
            String(toDisplay(v, fieldKind(k), units)),
          ]),
        ),
      });
    } else {
      setForm({
        id: null,
        date: todayStr(),
        sex: last?.sex || "M",
        age: String(ageFromBirth(birthDate) || last?.age || ""),
        values: last?.values.talla
          ? { talla: String(toDisplay(last.values.talla, "length", units)) }
          : {},
      });
    }
  };

  const formErrors = useMemo(() => {
    if (!form) return {} as Record<string, string>;
    const errors: Record<string, string> = {};
    if (!form.date) errors.date = "Fecha obligatoria";
    else if (form.date > todayStr()) errors.date = "No puede ser futura";
    const age = parseDecimal(form.age);
    if (age === null || age < 10 || age > 100)
      errors.age = "Edad entre 10 y 100";
    const range = (key: string, min: number, max: number, label: string) => {
      const kind = fieldKind(key);
      const n = parseDecimal(form.values[key] || "");
      const c = n === null ? null : fromDisplay(n, kind, units);
      if (c === null || c < min || c > max)
        errors[key] =
          `${label} entre ${toDisplay(min, kind, units)} y ${toDisplay(max, kind, units)} ${unitLabel(kind, units)}`;
    };
    range("peso", 20, 400, "Peso");
    range("talla", 100, 250, "Talla");
    MEASUREMENT_SECTIONS.forEach((s) =>
      s.fields.forEach((f) => {
        if (f.key === "peso" || f.key === "talla") return;
        const raw = form.values[f.key];
        if (raw === undefined || raw.trim() === "") return;
        const n = parseDecimal(raw);
        const c = n === null ? null : fromDisplay(n, fieldKind(f.key), units);
        if (c === null || c <= 0 || c > 300) errors[f.key] = "Valor inválido";
      }),
    );
    return errors;
  }, [form, units]);

  const handleSave = () => {
    if (!form || Object.keys(formErrors).length) return;
    saveMeasurement(athleteId, {
      id: form.id || newId(),
      date: form.date,
      sex: form.sex,
      age: Math.round(parseDecimal(form.age) as number),
      values: toCanonical(form.values),
    });
    addToast(
      form.id ? "Medición actualizada" : "Medición registrada",
      "success",
    );
    setForm(null);
  };

  const preview = useMemo(() => {
    if (!form) return null;
    return computeResults({
      id: "preview",
      date: form.date,
      sex: form.sex,
      age: parseDecimal(form.age) || 0,
      values: toCanonical(form.values),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, units]);

  const resultText = (
    key: string,
    v: number | null | undefined,
    dec: number,
  ) =>
    key === "pesoLibreGrasa"
      ? formatNumber(disp("peso", v), dec)
      : formatNumber(v, dec);
  const resultUnit = (key: string, unit: string) =>
    key === "pesoLibreGrasa" ? unitLabel("weight", units) : unit;

  // ---------- Formulario ----------
  if (form) {
    return (
      <div className="mv">
        <h4 className="mv-title">
          <Ruler size={18} /> {form.id ? "Editar medición" : "Nueva medición"}
        </h4>
        <div className="mv-grid">
          <label className="mv-field">
            <span>Fecha</span>
            <input
              type="date"
              value={form.date}
              max={todayStr()}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {formErrors.date && <em>{formErrors.date}</em>}
          </label>
          <label className="mv-field">
            <span>Sexo</span>
            <select
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })}
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </label>
          <label className="mv-field">
            <span>Edad</span>
            <input
              inputMode="numeric"
              maxLength={3}
              value={form.age}
              onChange={(e) =>
                setForm({
                  ...form,
                  age: sanitizeNumeric(e.target.value, false),
                })
              }
            />
            {formErrors.age && <em>{formErrors.age}</em>}
          </label>
        </div>

        {MEASUREMENT_SECTIONS.map((s) => (
          <fieldset className="mv-section" key={s.id}>
            <legend>{s.title}</legend>
            <div className="mv-grid">
              {s.fields.map((f) => (
                <label className="mv-field" key={f.key}>
                  <span>
                    {f.label}{" "}
                    <small>({unitLabel(fieldKind(f.key), units)})</small>
                  </span>
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    value={form.values[f.key] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        values: {
                          ...form.values,
                          [f.key]: sanitizeNumeric(e.target.value),
                        },
                      })
                    }
                  />
                  {formErrors[f.key] && <em>{formErrors[f.key]}</em>}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <fieldset className="mv-section">
          <legend>Resultados (calculados)</legend>
          <div className="mv-results">
            {RESULT_ROWS.map((r) => (
              <div key={r.key}>
                <span>{r.label}</span>
                <strong>
                  {resultText(r.key, preview?.[r.key], r.decimals)}{" "}
                  {resultUnit(r.key, r.unit)}
                </strong>
              </div>
            ))}
          </div>
          <small className="mv-note">
            % de grasa: Durnin-Womersley (bíceps, tríceps, subescapular y
            suprailíaco). TMB: Harris-Benedict.
          </small>
        </fieldset>

        <div className="mv-actions">
          <Button variant="ghost" onClick={() => setForm(null)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(formErrors).length > 0}
          >
            Guardar
          </Button>
        </div>
        <style>{viewStyles}</style>
      </div>
    );
  }

  // ---------- Vista de tabla ----------
  const weightPoints = entries
    .filter((e) => e.values.peso)
    .map((e) => ({
      label: shortDate(e.date),
      value: disp("peso", e.values.peso) as number,
    }));
  const fatPoints = entries
    .map((e, i) => ({
      label: shortDate(e.date),
      value: results[i].grasaSiri as number,
    }))
    .filter((p) => p.value !== null && p.value !== undefined);

  const last = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const delta = (a?: number | null, b?: number | null) =>
    a && b ? a - b : null;
  const pesoDelta = delta(
    disp("peso", last?.values.peso),
    disp("peso", prev?.values.peso),
  );
  const fatDelta = delta(
    results[entries.length - 1]?.grasaSiri,
    results[entries.length - 2]?.grasaSiri,
  );

  return (
    <div className="mv">
      <div className="mv-head">
        <h4 className="mv-title">
          <Ruler size={18} /> Mediciones corporales
        </h4>
        {!readOnly && (
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => openForm()}
          >
            Nueva medición
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card className="mv-empty">
          <p>
            {readOnly
              ? "Tu entrenador aún no ha registrado mediciones."
              : "Aún no hay mediciones. Registra la primera para comenzar el seguimiento."}
          </p>
        </Card>
      ) : (
        <>
          {prev && (
            <div className="mv-deltas">
              {pesoDelta !== null && (
                <span className={pesoDelta <= 0 ? "down" : "up"}>
                  {pesoDelta <= 0 ? (
                    <TrendingDown size={16} />
                  ) : (
                    <TrendingUp size={16} />
                  )}
                  Peso {pesoDelta > 0 ? "+" : ""}
                  {formatNumber(pesoDelta, 1)} {units.weight}
                </span>
              )}
              {fatDelta !== null && (
                <span className={fatDelta <= 0 ? "down" : "up"}>
                  {fatDelta <= 0 ? (
                    <TrendingDown size={16} />
                  ) : (
                    <TrendingUp size={16} />
                  )}
                  % Grasa {fatDelta > 0 ? "+" : ""}
                  {formatNumber(fatDelta, 2)}
                </span>
              )}
              <small>vs. medición anterior</small>
            </div>
          )}

          <div className="mv-charts">
            <LineChart
              title="Peso"
              unit={units.weight}
              points={weightPoints}
              color="var(--color-primary)"
            />
            <LineChart
              title="% Grasa (SIRI)"
              unit="%"
              points={fatPoints}
              color="var(--color-warning)"
            />
          </div>

          <div className="mv-table-wrap">
            <table className="mv-table">
              <thead>
                <tr>
                  <th />
                  {entries.map((e) => (
                    <th key={e.id}>
                      <div>{shortDate(e.date)}</div>
                      {!readOnly && (
                        <div className="mv-th-actions">
                          <button
                            type="button"
                            className="tap-ripple"
                            aria-label={`Editar medición del ${shortDate(e.date)}`}
                            onClick={() => openForm(e)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="tap-ripple"
                            aria-label={`Eliminar medición del ${shortDate(e.date)}`}
                            onClick={() => setToDelete(e)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEASUREMENT_SECTIONS.map((s) => {
                  const rows = s.fields.filter((f) =>
                    entries.some((e) => e.values[f.key]),
                  );
                  if (!rows.length) return null;
                  return (
                    <React.Fragment key={s.id}>
                      <tr className="mv-section-row">
                        <td colSpan={entries.length + 1}>{s.title}</td>
                      </tr>
                      {rows.map((f) => (
                        <tr key={f.key}>
                          <th scope="row">
                            {f.label}{" "}
                            <small>{unitLabel(fieldKind(f.key), units)}</small>
                          </th>
                          {entries.map((e) => (
                            <td key={e.id}>
                              {formatNumber(disp(f.key, e.values[f.key]), 1)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                <tr className="mv-section-row">
                  <td colSpan={entries.length + 1}>Resultados</td>
                </tr>
                {RESULT_ROWS.map((r) => (
                  <tr key={r.key} className="mv-result-row">
                    <th scope="row">
                      {r.label} <small>{resultUnit(r.key, r.unit)}</small>
                    </th>
                    {results.map((res, i) => (
                      <td key={entries[i].id}>
                        {resultText(r.key, res[r.key], r.decimals)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteMeasurement(athleteId, toDelete.id);
            addToast("Medición eliminada", "success");
          }
          setToDelete(null);
        }}
        title="Eliminar medición"
        message={
          toDelete
            ? `¿Eliminar la medición del ${shortDate(toDelete.date)}? No se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        variant="danger"
      />
      <style>{viewStyles}</style>
    </div>
  );
};

const viewStyles = `
  .mv { display: flex; flex-direction: column; gap: var(--space-4); }
  .mv-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
  .mv-title { display: flex; align-items: center; gap: var(--space-2); margin: 0; }
  .mv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: var(--space-3); }
  .mv-field { display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem; color: var(--color-text-muted); }
  .mv-field input, .mv-field select {
    font-size: 16px; min-height: var(--touch-target-min, 44px); padding: 0 var(--space-3);
    border: 1px solid var(--color-border); border-radius: var(--radius-md, 8px);
    background: var(--color-surface); color: var(--color-text); width: 100%; box-sizing: border-box;
  }
  .mv-field em { color: var(--color-error); font-size: 0.75rem; font-style: normal; }
  .mv-section { border: 1px solid var(--color-border); border-radius: var(--radius-md, 8px); padding: var(--space-3); margin: 0; }
  .mv-section legend { font-weight: 600; padding: 0 var(--space-2); color: var(--color-text); }
  .mv-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: var(--space-2); }
  .mv-results div { display: flex; justify-content: space-between; gap: var(--space-2); padding: var(--space-2); background: var(--color-bg-subtle); border-radius: 8px; }
  .mv-results span { color: var(--color-text-muted); font-size: 0.8125rem; }
  .mv-note { display: block; margin-top: var(--space-2); color: var(--color-text-muted); }
  .mv-actions { display: flex; justify-content: flex-end; gap: var(--space-2); position: sticky; bottom: 0; background: var(--color-surface); padding: var(--space-2) 0; }
  .mv-empty { padding: var(--space-6); text-align: center; color: var(--color-text-muted); }
  .mv-empty p { margin: 0; }
  .mv-deltas { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
  .mv-deltas span { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: var(--color-bg-subtle); }
  .mv-deltas .down { color: var(--color-success); }
  .mv-deltas .up { color: var(--color-warning); }
  .mv-deltas small { color: var(--color-text-muted); }
  .mv-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--space-3); }
  .mv-chart { background: var(--color-bg-subtle); border-radius: 8px; padding: var(--space-3); color: var(--color-text); }
  .mv-chart h5 { margin: 0 0 var(--space-2); font-size: 0.875rem; }
  .mv-chart svg { width: 100%; height: auto; }
  .mv-table-wrap { overflow-x: auto; border: 1px solid var(--color-border); border-radius: 8px; -webkit-overflow-scrolling: touch; }
  .mv-table { border-collapse: collapse; width: 100%; font-size: 0.875rem; color: var(--color-text); }
  .mv-table th, .mv-table td { padding: 8px 10px; text-align: center; white-space: nowrap; border-bottom: 1px solid var(--color-border); }
  .mv-table tbody th { position: sticky; left: 0; background: var(--color-surface); text-align: left; font-weight: 500; z-index: 1; }
  .mv-table th small { color: var(--color-text-muted); font-weight: 400; }
  .mv-section-row td { background: var(--color-bg-subtle); font-weight: 700; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted); }
  .mv-result-row td { font-weight: 600; }
  .mv-th-actions { display: flex; justify-content: center; gap: 4px; }
  .mv-th-actions button {
    min-width: var(--touch-target-min, 44px); min-height: var(--touch-target-min, 44px);
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; color: var(--color-text-muted); cursor: pointer; border-radius: 8px;
  }
`;

export default MeasurementsView;
