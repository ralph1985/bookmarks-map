import { useCallback, useEffect, useMemo, useState } from "react";
import { FilePicker } from "@/components/FilePicker";
import { useBookmarkFile } from "@/hooks/useBookmarkFile";
import { BookmarkTree, BookmarkKanbanBoard } from "@/features/bookmarks";
import type { BookmarkNode } from "@/lib/bookmarks";

type ViewMode = "tree" | "kanban";
const VIEW_MODE_KEY = "bookmarks-map.view-mode";

function App() {
  const { nodes, meta, isIdle, isLoading, isError, error, onFileSelected, reset } =
    useBookmarkFile();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "tree";
    }
    const stored = window.localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    return stored === "kanban" ? "kanban" : "tree";
  });
  const [kanbanTrail, setKanbanTrail] = useState<BookmarkNode[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const kanbanRoots = useMemo(() => {
    if (kanbanTrail.length === 0) {
      return nodes;
    }
    const current = kanbanTrail[kanbanTrail.length - 1];
    return current.children ?? [];
  }, [kanbanTrail, nodes]);

  useEffect(() => {
    setKanbanTrail([]);
  }, [meta?.fileName, meta?.savedAt]);

  useEffect(() => {
    if (!meta && isIdle) {
      setKanbanTrail([]);
    }
  }, [meta, isIdle]);

  const canRender = nodes.length > 0;
  const savedAtLabel = meta
    ? new Date(meta.savedAt).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : null;
  const uploadLabel = isLoading
    ? "Procesando…"
    : meta
    ? "Actualizar marcadores"
    : "Subir marcadores";

  const handleOpenFolder = useCallback(
    (node: BookmarkNode) => {
      if (node.type !== "folder") {
        return;
      }
      setKanbanTrail((previous) => {
        const alreadyCurrent = previous[previous.length - 1];
        if (alreadyCurrent && alreadyCurrent.id === node.id) {
          return previous;
        }
        return [...previous, node];
      });
    },
    [setKanbanTrail]
  );

  const handleNavigateTrail = useCallback((targetIndex: number) => {
    setKanbanTrail((previous) => {
      if (targetIndex < 0) {
        return [];
      }
      return previous.slice(0, targetIndex + 1);
    });
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: "1.5rem",
        padding: "2rem",
        maxWidth: "960px",
        margin: "0 auto"
      }}
    >
      <header>
        <h1 style={{ margin: "0 0 0.75rem" }}>Bookmarks Map</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Carga tu archivo de marcadores de Chrome para visualizarlo como un árbol
          navegable. Procesamos todo localmente, los datos no salen de tu navegador.
        </p>
      </header>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center"
        }}
      >
        <FilePicker
          label={uploadLabel}
          accept=".html,.htm,text/html,application/xhtml+xml"
          onFileSelected={onFileSelected}
        />
        <button
          type="button"
          onClick={reset}
          disabled={isIdle}
          onMouseEnter={(event) => {
            if (isIdle) {
              return;
            }
            event.currentTarget.style.backgroundColor = "#c7d2fe";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = activeResetBackground(isIdle);
          }}
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "0.75rem",
            border: "1px solid #cbd5f5",
            backgroundColor: activeResetBackground(isIdle),
            cursor: isIdle ? "not-allowed" : "pointer",
            color: isIdle ? "#94a3b8" : "#1e3a8a",
            fontWeight: 600
          }}
        >
          Olvidar archivo
        </button>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <a
            href="/data/sample-bookmarks.html"
            download
            style={{ color: "#2563eb", fontWeight: 500 }}
          >
            HTML de ejemplo
          </a>
        </nav>
        {meta ? (
          <p
            style={{
              flexBasis: "100%",
              margin: 0,
              fontSize: "0.9rem",
              color: "#475569"
            }}
          >
            Usando <strong>{meta.fileName}</strong> (guardado {savedAtLabel}). Sube
            otro archivo para actualizar o pulsa “Olvidar archivo” para limpiar la vista.
          </p>
        ) : null}
      </section>

      <section
        aria-label="Seleccionar visualización"
        style={{
          display: "inline-flex",
          border: "1px solid #cbd5f5",
          borderRadius: "999px",
          overflow: "hidden",
          alignSelf: "flex-start"
        }}
      >
        <ToggleButton
          label="Árbol"
          active={viewMode === "tree"}
          onClick={() => setViewMode("tree")}
        />
        <ToggleButton
          label="Kanban"
          active={viewMode === "kanban"}
          onClick={() => setViewMode("kanban")}
          disabled={!canRender}
        />
      </section>

      {isError ? (
        <div
          role="alert"
          style={{
            borderRadius: "0.75rem",
            padding: "1rem",
            border: "1px solid #fca5a5",
            background: "#fee2e2",
            color: "#991b1b"
          }}
        >
          {error}
        </div>
      ) : null}

      <main>
        {viewMode === "tree" || !canRender ? (
          <BookmarkTree nodes={nodes} />
        ) : (
          <BookmarkKanbanBoard
            nodes={kanbanRoots}
            trail={kanbanTrail}
            onOpenFolder={handleOpenFolder}
            onNavigate={handleNavigateTrail}
          />
        )}
      </main>
    </div>
  );
}

export default App;

type ToggleButtonProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToggleButton({ label, active, disabled, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        border: "none",
        backgroundColor: active ? "#1e3a8a" : "transparent",
        color: active ? "#ffffff" : disabled ? "#94a3b8" : "#1e3a8a",
        padding: "0.5rem 1.25rem",
        fontWeight: 600,
        fontSize: "0.9rem",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 0.15s ease-in-out"
      }}
    >
      {label}
    </button>
  );
}
function activeResetBackground(disabled: boolean) {
  if (disabled) {
    return "#f8fafc";
  }
  return "#e0e7ff";
}
