import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getAthletePlans,
  getPlanStats,
  getExerciseProgress,
  getSessionLog,
  getAthleticsSummary,
  type AthleteRef,
} from "../utils/athleteHistory";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

/**
 * Historial del atleta para el entrenador: planes anteriores con su
 * cumplimiento y evolución de la carga por ejercicio entre planes.
 */
const AthleteHistory = ({
  athlete,
  clients,
  trainerId,
}: {
  athlete: AthleteRef;
  clients: any[];
  trainerId: string | null;
}) => {
  const [query, setQuery] = useState("");
  const [onlyDone, setOnlyDone] = useState(true);

  const plans = useMemo(
    () => getAthletePlans(clients, trainerId, athlete),
    [clients, trainerId, athlete],
  );
  const progress = useMemo(() => getExerciseProgress(plans), [plans]);
  const athletics = useMemo(() => getAthleticsSummary(plans), [plans]);
  const sessionsByPlan = useMemo(
    () =>
      plans
        .map((p, i) => ({
          plan: p,
          index: i,
          sessions: getSessionLog(p, i).filter((s) => !onlyDone || s.completed),
        }))
        .reverse(),
    [plans, onlyDone],
  );
  const visible = progress.filter((e) =>
    e.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (plans.length === 0) {
    return (
      <p className="ah-empty">
        Este atleta todavía no tiene planes. El historial aparecerá cuando se
        active el primero.
      </p>
    );
  }

  return (
    <div className="ah">
      <section>
        <h4 className="ah-title">Planes ({plans.length})</h4>
        <ul className="ah-plans">
          {plans.map((p, i) => {
            const s = getPlanStats(p);
            return (
              <li key={p.id} className="ah-plan">
                <div className="ah-plan-head">
                  <strong>Plan {i + 1}</strong>
                  <span
                    className={`ah-badge ${p.status === "ACTIVE" ? "active" : "done"}`}
                  >
                    {p.status === "ACTIVE" ? "Activo" : "Completado"}
                  </span>
                </div>
                <small className="ah-muted">
                  {p.objective ? `${p.objective} · ` : ""}
                  {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                </small>
                <div
                  className="ah-bar"
                  role="progressbar"
                  aria-valuenow={s.adherence}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Cumplimiento del plan ${i + 1}`}
                >
                  <span style={{ width: `${s.adherence}%` }} />
                </div>
                <small className="ah-muted">
                  {s.doneSessions}/{s.totalSessions} sesiones ({s.adherence}%)
                  {s.setsPlanned > 0 &&
                    ` · ${s.setsDone}/${s.setsPlanned} series`}
                </small>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h4 className="ah-title">Evolución por ejercicio</h4>
        {progress.length === 0 ? (
          <p className="ah-empty">
            Aún no hay series registradas por el atleta.
          </p>
        ) : (
          <>
            <label className="ah-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ejercicio"
                aria-label="Buscar ejercicio"
              />
            </label>
            {visible.length === 0 && (
              <p className="ah-empty">
                Sin resultados para &quot;{query}&quot;.
              </p>
            )}
            <ul className="ah-ex-list">
              {visible.map((e) => (
                <li key={e.name} className="ah-ex">
                  <div className="ah-ex-head">
                    <strong>{e.name}</strong>
                    {e.delta === null ? (
                      <span className="ah-trend flat">
                        <Minus size={14} /> sin comparación
                      </span>
                    ) : e.delta > 0 ? (
                      <span className="ah-trend up">
                        <TrendingUp size={14} /> +{e.delta} {e.unit}
                      </span>
                    ) : e.delta < 0 ? (
                      <span className="ah-trend down">
                        <TrendingDown size={14} /> {e.delta} {e.unit}
                      </span>
                    ) : (
                      <span className="ah-trend flat">
                        <Minus size={14} /> igual
                      </span>
                    )}
                  </div>
                  <div className="ah-points">
                    {e.points.map((pt) => (
                      <span key={pt.planIndex} className="ah-point">
                        Plan {pt.planIndex + 1}:{" "}
                        {pt.maxWeight > 0
                          ? `${pt.maxWeight} ${e.unit}`
                          : "sin carga"}
                        <small>
                          {" "}
                          · {pt.setsDone}/{pt.setsPlanned} series
                        </small>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {athletics.length > 0 && (
        <section>
          <h4 className="ah-title">Atletismo</h4>
          <ul className="ah-ex-list">
            {athletics.map((a) => (
              <li key={a.name} className="ah-ex">
                <div className="ah-ex-head">
                  <strong>{a.name}</strong>
                  <span className="ah-muted">
                    {a.done}/{a.total} sesiones
                  </span>
                </div>
                <div
                  className="ah-bar"
                  role="progressbar"
                  aria-valuenow={Math.round((a.done / a.total) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Cumplimiento de ${a.name}`}
                >
                  <span style={{ width: `${(a.done / a.total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="ah-sessions-head">
          <h4 className="ah-title">Sesiones</h4>
          <label className="ah-check">
            <input
              type="checkbox"
              checked={onlyDone}
              onChange={(e) => setOnlyDone(e.target.checked)}
            />
            Solo realizadas
          </label>
        </div>
        {sessionsByPlan.map(({ plan: p, index, sessions }) => (
          <div key={p.id} className="ah-session-group">
            <h5 className="ah-group-title">
              Plan {index + 1} ({sessions.length})
            </h5>
            {sessions.length === 0 && (
              <p className="ah-empty">Sin sesiones para mostrar.</p>
            )}
            {sessions.map((s) => (
              <details key={`${s.weekNum}-${s.dayName}`} className="ah-session">
                <summary>
                  <span className="ah-session-main">
                    <strong>{s.title}</strong>
                    <small className="ah-muted">
                      Semana {s.weekNum} · {s.dayName}
                      {s.date ? ` · ${s.date.toLocaleDateString()}` : ""}
                    </small>
                  </span>
                  <span className={`ah-badge ${s.completed ? "active" : ""}`}>
                    {s.completed ? "Hecha" : "No realizada"}
                  </span>
                </summary>
                <div className="ah-session-body">
                  {s.isGym ? (
                    s.exercises.length === 0 ? (
                      <p className="ah-empty">Sin ejercicios.</p>
                    ) : (
                      <ul className="ah-ex-rows">
                        {s.exercises.map((ex, k) => (
                          <li key={`${ex.name}-${k}`}>
                            <strong>{ex.name}</strong>
                            <span>
                              {ex.setsDone}/{ex.sets} series
                              {ex.reps ? ` × ${ex.reps}` : ""}
                              {ex.weight ? ` · ${ex.weight} ${ex.unit}` : ""}
                              {ex.rest ? ` · desc. ${ex.rest}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : (
                    <>
                      <ul className="ah-parts">
                        {s.parts.map((pt) => (
                          <li
                            key={pt.key}
                            className={pt.done ? "done" : "missed"}
                          >
                            {pt.done ? (
                              <CheckCircle size={18} aria-hidden="true" />
                            ) : (
                              <XCircle size={18} aria-hidden="true" />
                            )}
                            <span className="ah-part-text">
                              <strong>{pt.label}</strong>
                              <span>{pt.text}</span>
                            </span>
                            <span className="ah-part-state">
                              {pt.done ? "Hecho" : "No hecho"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {s.completed && s.parts.every((pt) => !pt.done) && (
                        <p className="ah-muted ah-hint">
                          El atleta marcó la sesión completa sin detallar
                          partes.
                        </p>
                      )}
                    </>
                  )}
                  {s.note && (
                    <p className="ah-note">Nota del atleta: {s.note}</p>
                  )}
                </div>
              </details>
            ))}
          </div>
        ))}
      </section>

      <style>{`
        .ah-sessions-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
        .ah-check { display: inline-flex; align-items: center; gap: 0.5rem; min-height: var(--touch-target-min, 44px); cursor: pointer; }
        .ah-check input { width: 20px; height: 20px; }
        .ah-group-title { margin: 0.75rem 0 0.5rem; font-size: 0.9rem; color: var(--color-text-muted); }
        .ah-session { border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 0.5rem; }
        .ah-session summary { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-height: var(--touch-target-min, 44px); padding: 0.5rem 1rem; cursor: pointer; }
        .ah-session-main { display: flex; flex-direction: column; }
        .ah-session-body { padding: 0 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .ah-ex-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
        .ah-ex-rows li { display: flex; flex-direction: column; font-size: 0.9rem; }
        .ah-ex-rows li span { color: var(--color-text-muted); }
        .ah-parts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
        .ah-parts li { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); background: var(--color-bg-subtle); font-size: 0.9rem; }
        .ah-parts li.done svg { color: var(--color-success, #16a34a); }
        .ah-parts li.missed svg { color: var(--color-error, #dc2626); }
        .ah-part-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .ah-part-text span { color: var(--color-text-muted); overflow-wrap: anywhere; }
        .ah-part-state { font-size: 0.8rem; font-weight: 600; }
        .ah-parts li.missed .ah-part-state { color: var(--color-error, #dc2626); }
        .ah-hint { margin: 0; font-size: 0.85rem; }
        .ah-blocks { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; font-size: 0.9rem; }
        .ah-blocks dt { color: var(--color-text-muted); }
        .ah-blocks dd { margin: 0; }
        .ah-note { margin: 0; font-style: italic; font-size: 0.9rem; }
      `}</style>

      <style>{`
        .ah { display: flex; flex-direction: column; gap: 1.5rem; }
        .ah-title { margin: 0 0 0.75rem; font-size: 1rem; }
        .ah-muted { color: var(--color-text-muted); }
        .ah-empty { color: var(--color-text-muted); margin: 0.5rem 0; }
        .ah-plans, .ah-ex-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .ah-plan, .ah-ex { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
        .ah-plan-head, .ah-ex-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
        .ah-badge { font-size: 0.75rem; padding: 0.15rem 0.6rem; border-radius: 999px; background: var(--color-bg-subtle); }
        .ah-badge.active { color: var(--color-primary); }
        .ah-bar { height: 8px; border-radius: 999px; background: var(--color-bg-subtle); overflow: hidden; }
        .ah-bar span { display: block; height: 100%; background: var(--color-primary); border-radius: 999px; }
        .ah-search { display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 0.75rem; min-height: var(--touch-target-min, 44px); margin-bottom: 0.75rem; }
        .ah-search input { flex: 1; border: none; background: transparent; font-size: 16px; min-height: var(--touch-target-min, 44px); color: inherit; outline: none; }
        .ah-points { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.9rem; }
        .ah-point small { color: var(--color-text-muted); }
        .ah-trend { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; font-weight: 600; }
        .ah-trend.up { color: var(--color-success, #16a34a); }
        .ah-trend.down { color: var(--color-error, #dc2626); }
        .ah-trend.flat { color: var(--color-text-muted); font-weight: 500; }
      `}</style>
    </div>
  );
};

export default AthleteHistory;
