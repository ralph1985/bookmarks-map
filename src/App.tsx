import { useState } from "react";
import { FilePicker } from "@/components/FilePicker";
import { useBookmarkFile } from "@/hooks/useBookmarkFile";
import { BookmarkTree, BookmarkKanbanBoard } from "@/features/bookmarks";

type ViewMode = "tree" | "kanban";

function App() {
  const { nodes, meta, isIdle, isLoading, isError, error, onFileSelected, reset } =
    useBookmarkFile();
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

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
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "0.75rem",
            border: "1px solid #cbd5f5",
            background: "white",
            cursor: isIdle ? "not-allowed" : "pointer",
            opacity: isIdle ? 0.5 : 1,
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
          <BookmarkKanbanBoard nodes={nodes} />
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
