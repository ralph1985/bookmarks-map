import { FilePicker } from "@/components/FilePicker";
import { useBookmarkFile } from "@/hooks/useBookmarkFile";
import { BookmarkTree } from "@/features/bookmarks";

function App() {
  const { nodes, isIdle, isLoading, isError, error, onFileSelected, reset } =
    useBookmarkFile();

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
          label={isLoading ? "Procesando…" : "Subir marcadores"}
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
          Limpiar
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
        <BookmarkTree nodes={nodes} />
      </main>
    </div>
  );
}

export default App;
