/**
 * AdminGlobalSearch - búsqueda global del panel Admin (Ctrl+K).
 *
 * Busca (sin distinguir mayúsculas ni tildes) en usuarios, ejercicios y
 * equipamiento; al elegir un resultado navega a la vista correspondiente.
 * Lo usa: AdminDashboard. Solo lectura.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useUsers, useCustomExercises, useEquipment } from "@/admin/hooks";
import { listExerciseNames, foldText } from "@/admin/utils/exerciseIndex";
import { setSearchPrefill } from "@/admin/utils/searchPrefill";

const MAX_PER_GROUP = 5;

/**
 * @param props.onNavigate Callback `(viewId) => void` para cambiar de vista.
 */
const AdminGlobalSearch = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { users } = useUsers();
  const { customExercises, hiddenExercises } = useCustomExercises();
  const { equipment } = useEquipment();

  // Atajo Ctrl/Cmd+K y cierre con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const term = foldText(query.trim());
    if (!term) return [];
    const match = (s?: string) => foldText(s ?? "").includes(term);
    return [
      {
        view: "users",
        label: "Usuarios",
        items: users
          .filter((u) => match(u.name) || match(u.email))
          .slice(0, MAX_PER_GROUP)
          .map((u) => ({
            key: String(u.id),
            term: u.email || u.name,
            text: `${u.name} (${u.email})`,
          })),
      },
      {
        view: "exercises",
        label: "Ejercicios",
        items: listExerciseNames(customExercises, hiddenExercises)
          .filter((n) => match(n))
          .slice(0, MAX_PER_GROUP)
          .map((n) => ({ key: n, term: n, text: n })),
      },
      {
        view: "equipment",
        label: "Equipamiento",
        items: equipment
          .filter((e) => match(e.name) || match(e.category))
          .slice(0, MAX_PER_GROUP)
          .map((e) => ({
            key: String(e.id),
            term: e.name,
            text: `${e.name} (${e.category})`,
          })),
      },
    ].filter((g) => g.items.length > 0);
  }, [query, users, customExercises, hiddenExercises, equipment]);

  const go = (view: string, term: string) => {
    setSearchPrefill(view, term);
    onNavigate(view);
    setOpen(false);
  };

  /** Flechas arriba/abajo recorren el campo y los resultados. */
  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const nodes = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        "input, button[data-result]",
      ),
    );
    if (nodes.length === 0) return;
    e.preventDefault();
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? Math.min(nodes.length - 1, i + 1)
        : Math.max(0, i - 1);
    nodes[next].focus();
  };

  return (
    <>
      <button
        type="button"
        className="admin-btn tap-ripple"
        onClick={() => setOpen(true)}
        aria-label="Búsqueda global (Ctrl+K)"
        title="Búsqueda global (Ctrl+K)"
      >
        <Search size={18} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Búsqueda global"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: "10vh",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onDialogKeyDown}
            style={{
              background: "var(--bg-card, #1f2937)",
              color: "inherit",
              borderRadius: 12,
              width: "min(560px, 92vw)",
              maxHeight: "70vh",
              overflow: "auto",
              padding: 16,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuarios, ejercicios o equipos..."
              aria-label="Buscar"
              style={{ width: "100%", fontSize: 16, minHeight: 44 }}
            />
            {query.trim() && results.length === 0 && (
              <p style={{ marginTop: 12 }}>Sin resultados.</p>
            )}
            {results.map((group) => (
              <div key={group.view} style={{ marginTop: 12 }}>
                <strong>{group.label}</strong>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <button
                        type="button"
                        data-result
                        onClick={() => go(group.view, item.term)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          minHeight: 44,
                          background: "transparent",
                          color: "inherit",
                          border: 0,
                          cursor: "pointer",
                        }}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminGlobalSearch;
