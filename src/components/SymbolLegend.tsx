import React from "react";

interface Props {
  legend?: Array<{ symbol: string; name: string; meaning: string }>;
}

/** Leyenda de símbolos de una sesión, guardada por el entrenador. */
const SymbolLegend = ({ legend }: Props) => {
  if (!Array.isArray(legend) || legend.length === 0) return null;
  return (
    <details className="symbol-legend">
      <summary>Qué significan los símbolos</summary>
      <dl>
        {legend.map((l) => (
          <div key={l.symbol} className="symbol-legend-row">
            <dt>
              <code>{l.symbol}</code>
            </dt>
            <dd>
              <strong>{l.name}</strong>
              {l.meaning ? `: ${l.meaning}` : ""}
            </dd>
          </div>
        ))}
      </dl>
      <style>{`
        .symbol-legend { margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted); }
        .symbol-legend summary { cursor: pointer; min-height: var(--touch-target-min, 44px); display: flex; align-items: center; }
        .symbol-legend dl { margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .symbol-legend-row { display: flex; gap: 0.5rem; align-items: baseline; }
        .symbol-legend dt { min-width: 3rem; }
        .symbol-legend dd { margin: 0; }
      `}</style>
    </details>
  );
};

export default SymbolLegend;
