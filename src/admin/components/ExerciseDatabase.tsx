/**
 * ExerciseDatabase - gestión del catálogo de ejercicios (vista Admin).
 *
 * Responsabilidad: listar ejercicios por categoría (sistema + personalizados,
 * sin los ocultos), buscar/filtrar, crear/editar/eliminar, ver metadata
 * (GIF, músculos, instrucciones) y exportar/importar respaldos JSON.
 * Lo usa: AdminDashboard (vista "exercises").
 * Datos: useCustomExercises -> localStorage "crm_custom_exercises",
 * "crm_hidden_exercises" y "crm_custom_exercise_meta".
 * Efectos: toasts y registro en la bitácora (logAdminAction) por cada cambio.
 */
import React, { useState, useRef } from "react";
import { Card, Button, ConfirmDialog } from "@/components/ui";
import {
  Activity,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  X,
  ChevronDown,
  Download,
  Upload,
  RotateCcw,
} from "lucide-react";
import { isSafeHttpsUrl } from "@/utils/validation";
import { useAuth } from "@/context/AuthContext";
import { logAdminAction } from "@/admin/utils/auditLog";
import { consumeSearchPrefill } from "@/admin/utils/searchPrefill";
import "@/admin/styles/admin-extras.css";
import {
  GYM_EXERCISES,
  EXERCISE_METADATA,
  EXERCISE_CATEGORY_LABELS,
} from "@/utils/constants";
import { CATALOG_METADATA } from "@/utils/exerciseCatalogData";
import { useCustomExercises } from "@/admin/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import type { ExerciseMetadata } from "@/types";
import { buildCsv, downloadCsv } from "@/admin/utils/csv";
import ExerciseModal from "@/admin/components/modals/ExerciseModal";
import UndoBar from "@/admin/components/UndoBar";
import { useToast } from "@/components/ui";
import "@/admin/styles/exercises.css";

/** Convierte "a, b,, c" en ["a","b","c"] (recorta y descarta vacíos). */
const csvToArray = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Convierte texto multilínea en arreglo de pasos (una línea por paso). */
const linesToArray = (value: string) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Vista de base de datos de ejercicios del administrador. No recibe props.
 */
const ExerciseDatabase = () => {
  const {
    customExercises,
    hiddenExercises,
    customExerciseMeta,
    addExercise,
    updateExercise,
    deleteExercise,
    restoreExercise,
    restoreAllHidden,
    hiddenCount,
    exportData,
    importData,
  } = useCustomExercises();
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  // Actor para la bitácora de auditoría (id del admin o "admin" por defecto)
  const actor = (currentUser?.id as string) || "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  // Filtro de completitud: all | no-image | no-instructions | no-muscles
  const [completeness, setCompleteness] = useState("all");
  // Ejercicios cuya imagen no cargó en la última verificación
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [checkingImages, setCheckingImages] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() =>
    consumeSearchPrefill("exercises"),
  );
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [pendingImport, setPendingImport] = useState<{
    data: unknown;
    added: number;
    skipped: number;
  } | null>(null);
  const [undoExercise, setUndoExercise] = useState<{
    category: string;
    name: string;
    system: boolean;
    metadata?: ExerciseMetadata;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{
    category: string;
    name: string;
    system?: boolean;
  } | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<{
    category: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "LOWER",
    gifUrl: "",
    bodyParts: "",
    targetMuscles: "",
    secondaryMuscles: "",
    equipments: "",
    instructions: "",
  });

  // Metadata enriquecida: ejercicios del sistema + personalizados, keyeada por
  // nombre. La personalizada tiene prioridad sobre la del sistema.
  const getMetadata = (name: string) =>
    customExerciseMeta[name] ||
    EXERCISE_METADATA[name] ||
    CATALOG_METADATA[name] ||
    null;

  // Merge GYM_EXERCISES con customExercises y filtrar los ocultos
  const allExercises = {};
  Object.keys(GYM_EXERCISES).forEach((category) => {
    // Empezar con ejercicios del sistema, filtrando los ocultos
    const systemExercises = GYM_EXERCISES[category].filter(
      (ex) => !hiddenExercises[category]?.includes(ex),
    );
    // Agregar ejercicios personalizados
    const custom = customExercises[category] || [];
    allExercises[category] = [...systemExercises, ...custom];
  });

  // Agregar categorías que solo existen en customExercises
  Object.keys(customExercises).forEach((category) => {
    if (!allExercises[category]) {
      allExercises[category] = customExercises[category];
    }
  });

  const categories = Object.keys(allExercises);
  const filteredCategory =
    selectedCategory === "all" ? categories : [selectedCategory];

  // Predicados de datos faltantes (para completar el catálogo desde el admin)
  const isMissing = (name: string, kind: string) => {
    const meta = getMetadata(name);
    if (kind === "no-image") return !meta?.gifUrl;
    if (kind === "no-instructions") return !meta?.instructions?.length;
    if (kind === "no-muscles") return !meta?.targetMuscles?.length;
    if (kind === "broken-image") return brokenImages.has(name);
    return false;
  };
  const missingCounts = {
    "no-image": 0,
    "no-instructions": 0,
    "no-muscles": 0,
  };
  categories.forEach((category) =>
    allExercises[category].forEach((ex: string) => {
      (Object.keys(missingCounts) as Array<keyof typeof missingCounts>).forEach(
        (k) => {
          if (isMissing(ex, k)) missingCounts[k]++;
        },
      );
    }),
  );

  // Búsqueda insensible a mayúsculas; las categorías sin resultados no se
  // renderizan.
  // Búsqueda global sin distinguir mayúsculas ni acentos ("baston" = "BASTÓN").
  const fold = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const normalizedSearch = fold(debouncedSearch.trim());
  const visibleExercises: Record<string, string[]> = {};
  filteredCategory.forEach((category) => {
    visibleExercises[category] = allExercises[category].filter(
      (ex: string) =>
        (!normalizedSearch || fold(ex).includes(normalizedSearch)) &&
        (completeness === "all" || isMissing(ex, completeness)),
    );
  });
  const categoriesToRender = filteredCategory.filter(
    (category) => visibleExercises[category].length > 0,
  );
  const totalExercises = categories.reduce(
    (sum, category) => sum + allExercises[category].length,
    0,
  );

  /**
   * Comprueba que las imágenes de los ejercicios visibles (máx. 200) carguen,
   * 8 en paralelo y con 8 s de espera. Los fallidos se guardan en
   * `brokenImages` y se pueden filtrar con "Imagen rota".
   */
  const handleVerifyImages = async () => {
    const names = Array.from(
      new Set(filteredCategory.flatMap((c) => visibleExercises[c])),
    )
      .filter((n) => isSafeHttpsUrl(getMetadata(n)?.gifUrl))
      .slice(0, 200);
    if (names.length === 0) {
      addToast("No hay imágenes que verificar en la vista actual", "info");
      return;
    }
    setCheckingImages(true);
    const broken = new Set<string>();
    const probe = (url: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(false), 8000);
        img.onload = () => {
          clearTimeout(timer);
          resolve(true);
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(false);
        };
        img.src = url;
      });
    let next = 0;
    const worker = async () => {
      while (next < names.length) {
        const name = names[next++];
        if (!(await probe(getMetadata(name).gifUrl ?? ""))) broken.add(name);
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    setBrokenImages(broken);
    setCheckingImages(false);
    logAdminAction(
      actor,
      "Imágenes verificadas",
      `${names.length} revisadas, ${broken.size} rotas`,
    );
    addToast(
      broken.size
        ? `${broken.size} de ${names.length} imágenes no cargan (filtro "Imagen rota")`
        : `Las ${names.length} imágenes cargan correctamente`,
      broken.size ? "warning" : "success",
    );
    if (broken.size) setCompleteness("broken-image");
  };

  /**
   * Abre el modal. Con categoría y nombre precarga el formulario para editar
   * (convirtiendo los arreglos de metadata a texto); sin argumentos, crea.
   */
  const openModal = (
    category: string | null = null,
    exerciseName: string | null = null,
  ) => {
    if (category && exerciseName) {
      const meta = getMetadata(exerciseName);
      setEditingExercise({ category, name: exerciseName });
      setFormData({
        name: exerciseName,
        category: category,
        gifUrl: meta?.gifUrl || "",
        bodyParts: (meta?.bodyParts || []).join(", "),
        targetMuscles: (meta?.targetMuscles || []).join(", "),
        secondaryMuscles: (meta?.secondaryMuscles || []).join(", "),
        equipments: (meta?.equipments || []).join(", "),
        instructions: (meta?.instructions || []).join("\n"),
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: "",
        category: "LOWER",
        gifUrl: "",
        bodyParts: "",
        targetMuscles: "",
        secondaryMuscles: "",
        equipments: "",
        instructions: "",
      });
    }
    setShowModal(true);
  };

  /** Cierra el modal y reinicia el formulario. */
  const closeModal = () => {
    setShowModal(false);
    setEditingExercise(null);
    setFormData({
      name: "",
      category: "LOWER",
      gifUrl: "",
      bodyParts: "",
      targetMuscles: "",
      secondaryMuscles: "",
      equipments: "",
      instructions: "",
    });
  };

  /** Handler genérico: actualiza el campo del formulario por su `name`. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Guarda (crea o edita) el ejercicio. Arma la metadata solo con los campos
   * rellenados; la validación (incluida la URL https) la hace el hook.
   * Muestra toast de error/éxito y registra la acción en la bitácora.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const {
      category,
      name,
      gifUrl,
      bodyParts,
      targetMuscles,
      secondaryMuscles,
      equipments,
      instructions,
    } = formData;
    const metadata = {
      ...(gifUrl.trim() && { gifUrl: gifUrl.trim() }),
      ...(bodyParts.trim() && { bodyParts: csvToArray(bodyParts) }),
      ...(targetMuscles.trim() && { targetMuscles: csvToArray(targetMuscles) }),
      ...(secondaryMuscles.trim() && {
        secondaryMuscles: csvToArray(secondaryMuscles),
      }),
      ...(equipments.trim() && { equipments: csvToArray(equipments) }),
      ...(instructions.trim() && {
        instructions: linesToArray(instructions),
      }),
    };

    const result = editingExercise
      ? updateExercise(editingExercise, { category, name, metadata })
      : addExercise({ category, name, metadata });

    if (!result.ok) {
      addToast(result.error, "error");
      return;
    }
    logAdminAction(
      actor,
      editingExercise ? "Ejercicio editado" : "Ejercicio creado",
      name.trim(),
    );
    addToast(
      editingExercise
        ? "Ejercicio actualizado correctamente"
        : "Ejercicio agregado correctamente",
      "success",
    );
    closeModal();
  };

  /** Descarga un respaldo JSON (Blob + <a download>) y lo registra. */
  // Mover en lote los ejercicios filtrados a otra categoría
  const [bulkTarget, setBulkTarget] = useState("");
  const [confirmBulk, setConfirmBulk] = useState(false);
  const bulkItems = categoriesToRender.flatMap((category) =>
    visibleExercises[category]
      .filter(() => category !== bulkTarget)
      .map((name) => ({ category, name })),
  );
  const filtersActive = completeness !== "all" || !!normalizedSearch;

  const handleBulkMove = () => {
    let moved = 0;
    let failed = 0;
    bulkItems.forEach(({ category, name }) => {
      const res = updateExercise(
        { category, name },
        {
          name,
          category: bulkTarget,
          metadata: customExerciseMeta[name],
        },
      );
      if (res.ok) moved++;
      else failed++;
    });
    logAdminAction(
      actor,
      "Ejercicios movidos en lote",
      `${moved} a ${bulkTarget}`,
    );
    addToast(
      failed
        ? `${moved} movidos, ${failed} omitidos`
        : `${moved} ejercicios movidos a ${bulkTarget}`,
      failed ? "warning" : "success",
    );
    setConfirmBulk(false);
    setBulkTarget("");
  };

  /** Descarga los ejercicios personalizados como CSV. */
  const handleExportCsv = () => {
    const rows = Object.entries(customExercises).flatMap(
      ([category, list]: [string, string[]]) =>
        list.map((name) => {
          const m = customExerciseMeta[name] || {};
          return [
            category,
            name,
            m.gifUrl ?? "",
            (m.targetMuscles ?? []).join("; "),
            (m.instructions ?? []).join(" | "),
          ];
        }),
    );
    downloadCsv(
      `ejercicios-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(
        ["Categoría", "Nombre", "GIF", "Músculos objetivo", "Instrucciones"],
        rows,
      ),
    );
    logAdminAction(
      actor,
      "Ejercicios exportados (CSV)",
      `${rows.length} fila(s)`,
    );
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ejercicios-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const customCount = Object.values(customExercises).reduce(
      (n: number, list: string[]) => n + list.length,
      0,
    );
    logAdminAction(
      actor,
      "Ejercicios exportados",
      `${customCount} personalizado(s), ${hiddenCount} oculto(s)`,
    );
  };

  /**
   * Importa un respaldo JSON elegido por el usuario. Limita el tamaño a 2 MB
   * y delega en importData, que valida la estructura y las URLs.
   */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo después
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast("El archivo supera 2 MB", "error");
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      const preview = importData(data, true);
      if (!preview.ok) {
        addToast(preview.error, "error");
        return;
      }
      setPendingImport({
        data,
        added: preview.added ?? 0,
        skipped: preview.skipped ?? 0,
      });
    } catch {
      addToast("El archivo no es un JSON válido", "error");
    }
  };

  /** Aplica la importación confirmada y la registra. */
  const confirmImport = () => {
    if (!pendingImport) return;
    const result = importData(pendingImport.data);
    setPendingImport(null);
    if (!result.ok) {
      addToast(result.error, "error");
      return;
    }
    const skipped = result.skipped ?? 0;
    logAdminAction(
      actor,
      "Ejercicios importados",
      `${result.added} nuevos, ${skipped} omitidos`,
    );
    addToast(
      `Importación completa: ${result.added} nuevo(s)` +
        (skipped ? `, ${skipped} omitido(s) (duplicados o inválidos)` : ""),
      skipped ? "info" : "success",
    );
  };

  /** Reactiva todos los ejercicios del sistema ocultos. */
  const handleRestoreHidden = () => {
    restoreAllHidden();
    logAdminAction(
      actor,
      "Ejercicios del sistema restaurados",
      `${hiddenCount}`,
    );
    addToast("Ejercicios del sistema restaurados", "success");
  };

  /** Pide confirmación (ConfirmDialog) antes de eliminar. */
  const handleDelete = (category, exerciseName) => {
    setExerciseToDelete({ category, name: exerciseName });
  };

  /** Ejecuta la eliminación confirmada (los del sistema solo se ocultan). */
  const confirmDelete = () => {
    if (exerciseToDelete) {
      const { category, name } = exerciseToDelete;
      const snapshot = {
        category,
        name,
        system: !!GYM_EXERCISES[category]?.includes(name),
        metadata: customExerciseMeta[name],
      };
      deleteExercise(category, name);
      setUndoExercise(snapshot);
      logAdminAction(actor, "Ejercicio eliminado", exerciseToDelete.name);
      addToast("Ejercicio eliminado", "success");
    }
    setExerciseToDelete(null);
  };

  return (
    <div className="admin-exercises">
      {undoExercise && (
        <UndoBar
          message={`Ejercicio "${undoExercise.name}" eliminado`}
          onDismiss={() => setUndoExercise(null)}
          onUndo={() => {
            const { category, name, system, metadata } = undoExercise;
            const res = system
              ? restoreExercise(category, name)
              : addExercise({ category, name, metadata });
            if (res.ok) {
              logAdminAction(actor, "Eliminación deshecha", name);
              addToast("Ejercicio restaurado", "success");
            } else {
              addToast(res.error, "error");
            }
            setUndoExercise(null);
          }}
        />
      )}
      <div className="section-header">
        <div>
          <h2>Base de Datos de Ejercicios</h2>
          <p className="exercises-total">
            {totalExercises.toLocaleString("es-ES")} ejercicios en total
            {normalizedSearch &&
              ` • ${Object.values(visibleExercises).reduce((n, l) => n + l.length, 0)} coinciden con "${searchTerm.trim()}"`}
          </p>
        </div>
        <div className="filters">
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={18} />}
            onClick={() => openModal()}
          >
            Agregar Ejercicio
          </Button>
        </div>
      </div>

      <div className="exercise-filter-row">
        <div className="exercise-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar ejercicio en todo el catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar ejercicio por nombre"
          />
          {searchTerm && (
            <button
              type="button"
              className="exercise-search-clear tap-ripple"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
          aria-label="Filtrar por categoría"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {EXERCISE_CATEGORY_LABELS[cat] || cat} ({allExercises[cat].length}
              )
            </option>
          ))}
        </select>
        <select
          value={completeness}
          onChange={(e) => setCompleteness(e.target.value)}
          className="category-filter"
          aria-label="Filtrar por datos faltantes"
        >
          <option value="all">Todos los datos</option>
          <option value="no-image">
            Sin imagen ({missingCounts["no-image"]})
          </option>
          <option value="no-instructions">
            Sin instrucciones ({missingCounts["no-instructions"]})
          </option>
          <option value="no-muscles">
            Sin músculos ({missingCounts["no-muscles"]})
          </option>
          <option value="broken-image">
            Imagen rota ({brokenImages.size})
          </option>
        </select>
      </div>

      <div className="admin-toolbar">
        <button
          type="button"
          className="admin-btn tap-ripple"
          onClick={handleExport}
        >
          <Download size={16} /> Exportar
        </button>
        <button
          type="button"
          className="admin-btn tap-ripple"
          onClick={handleExportCsv}
        >
          <Download size={16} /> CSV
        </button>
        <button
          type="button"
          className="admin-btn tap-ripple"
          onClick={handleVerifyImages}
          disabled={checkingImages}
        >
          {checkingImages ? "Verificando..." : "Verificar imágenes"}
        </button>
        <button
          type="button"
          className="admin-btn tap-ripple"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} /> Importar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          style={{ display: "none" }}
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleImportFile}
        />
        {hiddenCount > 0 && (
          <button
            type="button"
            className="admin-btn tap-ripple"
            onClick={handleRestoreHidden}
          >
            <RotateCcw size={16} /> Restaurar ocultos ({hiddenCount})
          </button>
        )}
      </div>

      {filtersActive && categoriesToRender.length > 0 && (
        <div className="admin-toolbar">
          <select
            className="admin-select"
            value={bulkTarget}
            onChange={(e) => setBulkTarget(e.target.value)}
            aria-label="Categoría destino para mover en lote"
          >
            <option value="">Mover filtrados a...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {EXERCISE_CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn tap-ripple"
            disabled={!bulkTarget || bulkItems.length === 0}
            onClick={() => setConfirmBulk(true)}
          >
            Mover ({bulkItems.length})
          </button>
        </div>
      )}

      <div className="exercises-grid">
        {categoriesToRender.length === 0 && (
          <div className="exercises-empty-state">
            <Search size={40} />
            <p>No se encontraron ejercicios para &quot;{searchTerm}&quot;</p>
          </div>
        )}
        {categoriesToRender.map((category) => (
          <Card key={category} className="category-card">
            <div className="category-header">
              <h3>{category}</h3>
              <span className="count-badge">
                {visibleExercises[category].length} ejercicios
              </span>
            </div>
            <div className="exercise-list">
              {visibleExercises[category].map((exercise, idx) => {
                const isCustom = customExercises[category]?.includes(exercise);
                const meta = getMetadata(exercise);
                const isExpanded = expandedExercise === exercise;
                return (
                  <div
                    key={idx}
                    className={`exercise-item ${isCustom ? "custom" : ""} ${meta ? "has-meta" : ""}`}
                  >
                    <div className="exercise-item-row">
                      {isSafeHttpsUrl(meta?.gifUrl) ? (
                        // Solo se muestra el GIF si la URL es https válida
                        <img
                          src={meta.gifUrl}
                          alt={exercise}
                          className="exercise-thumb"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Activity size={16} />
                      )}
                      <span className="exercise-name">{exercise}</span>
                      {isCustom && (
                        <span className="custom-badge">Personalizado</span>
                      )}
                      {meta && (
                        <button
                          type="button"
                          className="btn-icon-mini tap-ripple"
                          onClick={() =>
                            setExpandedExercise(isExpanded ? null : exercise)
                          }
                          title="Ver detalle"
                          aria-label="Ver detalle del ejercicio"
                        >
                          <ChevronDown
                            size={18}
                            className={isExpanded ? "rotated" : ""}
                          />
                        </button>
                      )}
                      <div className="exercise-item-actions">
                        <button
                          className="btn-icon-mini tap-ripple"
                          onClick={() => openModal(category, exercise)}
                          title="Editar"
                          aria-label="Editar ejercicio"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          className="btn-icon-mini danger tap-ripple"
                          onClick={() => handleDelete(category, exercise)}
                          title="Eliminar"
                          aria-label="Eliminar ejercicio"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && meta && (
                      <div className="exercise-item-detail">
                        {(meta.targetMuscles?.length ||
                          meta.secondaryMuscles?.length ||
                          meta.bodyParts?.length ||
                          meta.equipments?.length) && (
                          <div className="exercise-meta-tags">
                            {meta.bodyParts?.map((v) => (
                              <span key={`bp-${v}`} className="meta-tag">
                                {v}
                              </span>
                            ))}
                            {meta.targetMuscles?.map((v) => (
                              <span
                                key={`tm-${v}`}
                                className="meta-tag primary"
                              >
                                {v}
                              </span>
                            ))}
                            {meta.secondaryMuscles?.map((v) => (
                              <span key={`sm-${v}`} className="meta-tag">
                                {v}
                              </span>
                            ))}
                            {meta.equipments?.map((v) => (
                              <span key={`eq-${v}`} className="meta-tag">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                        {(meta.instructions?.length ?? 0) > 0 && (
                          <ol className="exercise-instructions">
                            {meta.instructions?.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <ExerciseModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        isEditing={!!editingExercise}
      />

      <ConfirmDialog
        isOpen={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Importar ejercicios"
        message={`Se agregarán ${pendingImport?.added ?? 0} ejercicio(s) y se omitirán ${pendingImport?.skipped ?? 0} (duplicados o inválidos).`}
        confirmText="Importar"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        isOpen={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={handleBulkMove}
        title="Mover ejercicios"
        message={`¿Mover ${bulkItems.length} ejercicios a "${bulkTarget}"?`}
        confirmText="Mover"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar ejercicio"
        message={`¿Estás seguro de eliminar "${exerciseToDelete?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ExerciseDatabase;
