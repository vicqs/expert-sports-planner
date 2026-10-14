import React, { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, RotateCcw } from "lucide-react";
import {
  MAX_SYMBOLS,
  SymbolEntry,
  saveSymbols,
  resetSymbols,
} from "../utils/symbolConfig";

interface Props {
  userId?: string | null;
  symbols: SymbolEntry[];
  onChange: (list: SymbolEntry[]) => void;
  onClose: () => void;
}

/** Editor de la simbología del entrenador: símbolo, nombre y significado. */
const SymbolEditor = ({ userId, symbols, onChange, onClose }: Props) => {
  const [draft, setDraft] = useState<SymbolEntry[]>(symbols);
  const [error, setError] = useState("");

  const patch = (i: number, field: keyof SymbolEntry, value: string) =>
    setDraft((d) =>
      d.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );

  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const copy = [...d];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const add = () =>
    setDraft((d) =>
      d.length >= MAX_SYMBOLS
        ? d
        : [
            ...d,
            { id: `custom-${Date.now()}`, name: "", insert: "", meaning: "" },
          ],
    );

  const save = () => {
    const invalid = draft.some((s) => !s.name.trim() || !s.insert.trim());
    if (invalid) {
      setError("Cada símbolo necesita un nombre y un símbolo.");
      return;
    }
    onChange(saveSymbols(userId, draft));
    onClose();
  };

  const restore = () => {
    const defaults = resetSymbols(userId);
    setDraft(defaults);
    onChange(defaults);
    setError("");
  };

  return (
    <div className="symbol-editor" role="region" aria-label="Mi simbología">
      <p className="symbol-editor-help">
        Define el símbolo que se inserta, su nombre y qué significa. Se guarda
        solo en tu cuenta. Para espacios alrededor del símbolo, escríbelos en el
        campo.
      </p>
      <div className="symbol-editor-list">
        {draft.map((s, i) => (
          <div className="symbol-editor-row" key={s.id}>
            <input
              className="se-glyph"
              value={s.insert}
              maxLength={12}
              onChange={(e) => patch(i, "insert", e.target.value)}
              aria-label={`Símbolo ${i + 1}`}
              placeholder="Símbolo"
            />
            <input
              className="se-name"
              value={s.name}
              maxLength={20}
              onChange={(e) => patch(i, "name", e.target.value)}
              aria-label={`Nombre ${i + 1}`}
              placeholder="Nombre"
            />
            <input
              className="se-meaning"
              value={s.meaning}
              maxLength={80}
              onChange={(e) => patch(i, "meaning", e.target.value)}
              aria-label={`Significado ${i + 1}`}
              placeholder="Significado"
            />
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Subir"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === draft.length - 1}
              aria-label="Bajar"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => setDraft((d) => d.filter((_, idx) => idx !== i))}
              aria-label={`Eliminar ${s.name || "símbolo"}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="builder-error">
          {error}
        </p>
      )}
      <div className="symbol-editor-actions">
        <button
          type="button"
          onClick={add}
          disabled={draft.length >= MAX_SYMBOLS}
        >
          <Plus size={14} /> Agregar
        </button>
        <button type="button" onClick={restore}>
          <RotateCcw size={14} /> Restaurar originales
        </button>
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="primary" onClick={save}>
          Guardar
        </button>
      </div>
      <style>{`
        .symbol-editor {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .symbol-editor-help { margin: 0; font-size: 0.8rem; color: var(--color-text-muted); }
        .symbol-editor-list { display: flex; flex-direction: column; gap: 0.4rem; max-height: 320px; overflow-y: auto; }
        .symbol-editor-row { display: flex; gap: 0.25rem; align-items: center; flex-wrap: wrap; }
        .symbol-editor-row input {
          min-height: var(--touch-target-min, 44px);
          font-size: 16px;
          padding: 0 8px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-bg-subtle);
          color: var(--color-text);
          min-width: 0;
        }
        .se-glyph { width: 80px; font-family: var(--font-mono); }
        .se-name { width: 130px; }
        .se-meaning { flex: 1; min-width: 140px; }
        .symbol-editor button {
          min-height: var(--touch-target-min, 44px);
          min-width: var(--touch-target-min, 44px);
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-bg-subtle);
          color: var(--color-text);
          cursor: pointer;
          padding: 0 10px;
        }
        .symbol-editor button:disabled { opacity: 0.4; cursor: default; }
        .symbol-editor button.primary { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .symbol-editor-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }

        /* Móvil: modal a pantalla completa */
        @media (max-width: 768px) {
          .symbol-editor {
            position: fixed;
            inset: 0;
            z-index: 1000;
            border: none;
            border-radius: 0;
            padding: 1rem 1rem 0;
            gap: 0.75rem;
            overflow: hidden;
          }
          .symbol-editor::before {
            content: "Mi simbología";
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--color-text);
          }
          .symbol-editor-help { font-size: 0.85rem; }
          .symbol-editor-list {
            flex: 1;
            max-height: none;
            gap: 0.75rem;
            padding-bottom: 0.5rem;
          }
          .symbol-editor-row {
            display: grid;
            grid-template-columns: 72px minmax(0, 1fr) auto auto auto;
            gap: 0.5rem;
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
          }
          .symbol-editor-row .se-glyph,
          .symbol-editor-row .se-name,
          .symbol-editor-row .se-meaning { width: 100%; min-width: 0; }
          .symbol-editor-row .se-meaning { grid-column: 1 / -1; grid-row: 2; }
          .symbol-editor-actions {
            flex-shrink: 0;
            position: sticky;
            bottom: 0;
            background: var(--color-surface);
            padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom, 0px));
            border-top: 1px solid var(--color-border);
            justify-content: stretch;
          }
          .symbol-editor-actions button { flex: 1 1 40%; }
        }
      `}</style>
    </div>
  );
};

export default SymbolEditor;
