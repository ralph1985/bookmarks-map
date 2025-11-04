import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent
} from "react";
import { FilePicker } from "@/components/FilePicker";
import { useBookmarkFile } from "@/hooks/useBookmarkFile";
import { BookmarkTree, BookmarkKanbanBoard } from "@/features/bookmarks";
import type { BookmarkNode } from "@/lib/bookmarks";
import styles from "./App.module.css";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const displayNodes = useMemo(() => deriveDisplayNodes(nodes), [nodes]);
  const filteredNodes = useMemo(
    () => filterNodes(displayNodes, searchQuery),
    [displayNodes, searchQuery],
  );

  const kanbanRoots = useMemo(() => {
    if (kanbanTrail.length === 0) {
      return filteredNodes;
    }
    const current = kanbanTrail[kanbanTrail.length - 1];
    return current.children ?? [];
  }, [kanbanTrail, filteredNodes]);

  useEffect(() => {
    setKanbanTrail([]);
  }, [meta?.fileName, meta?.savedAt]);

  useEffect(() => {
    if (!meta && isIdle) {
      setKanbanTrail([]);
    }
  }, [meta, isIdle]);

  useEffect(() => {
    setKanbanTrail([]);
  }, [searchQuery]);

  const trimmedQuery = searchQuery.trim();
  const canRender = filteredNodes.length > 0;
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
      if (searchQuery.trim()) {
        return;
      }
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
    [searchQuery],
  );

  const handleNavigateTrail = useCallback((targetIndex: number) => {
    setKanbanTrail((previous) => {
      if (targetIndex < 0) {
        return [];
      }
      return previous.slice(0, targetIndex + 1);
    });
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const isSearching = Boolean(trimmedQuery);

  return (
    <div className={styles.container}>
      <header>
        <h1 className={styles.title}>Bookmarks Map</h1>
        <p className={styles.description}>
          Carga tu archivo de marcadores de Chrome para visualizarlo como un árbol navegable.
          Procesamos todo localmente, los datos no salen de tu navegador.
        </p>
      </header>

      <section className={styles.controls}>
        <FilePicker
          label={uploadLabel}
          accept=".html,.htm,text/html,application/xhtml+xml"
          onFileSelected={onFileSelected}
        />

        <div className={styles.searchGroup}>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
            placeholder="Buscar por título o URL"
            aria-label="Buscar marcadores"
          />
          {isSearching ? (
            <button type="button" onClick={handleClearSearch} className={styles.clearButton}>
              Limpiar
            </button>
          ) : null}
        </div>

        <button type="button" onClick={reset} disabled={isIdle} className={styles.resetButton}>
          Olvidar archivo
        </button>
        {meta ? (
          <p className={styles.meta}>
            Usando <strong>{meta.fileName}</strong> (guardado {savedAtLabel}). Sube otro archivo
            para actualizar o pulsa “Olvidar archivo” para limpiar la vista.
          </p>
        ) : null}
      </section>

      <section aria-label="Seleccionar visualización" className={styles.viewSwitch}>
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
        <div role="alert" className={styles.alert}>
          {error}
        </div>
      ) : null}

      <main>
        {!canRender ? (
          <div className={styles.noResults}>
            {trimmedQuery
              ? `No se encontraron marcadores que coincidan con “${trimmedQuery}”.`
              : "No hay marcadores para mostrar. Sube un archivo HTML para comenzar."}
          </div>
        ) : viewMode === "tree" ? (
          <BookmarkTree nodes={filteredNodes} />
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
  const classes = [styles.toggle];
  if (active) {
    classes.push(styles.toggleActive);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={classes.join(" ")}
    >
      {label}
    </button>
  );
}

const SKIPPED_ROOTS = new Set(["bookmarks bar", "barra de marcadores"]);

function filterNodes(nodes: BookmarkNode[], query: string): BookmarkNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  return nodes
    .map((node) => filterNode(node, normalized))
    .filter((node): node is BookmarkNode => node !== null);
}

function filterNode(node: BookmarkNode, query: string): BookmarkNode | null {
  const matchesSelf =
    node.title.toLowerCase().includes(query) ||
    (node.url?.toLowerCase().includes(query) ?? false);

  if (node.type === "url") {
    return matchesSelf ? node : null;
  }

  const filteredChildren = (node.children ?? [])
    .map((child) => filterNode(child, query))
    .filter((child): child is BookmarkNode => child !== null);

  if (matchesSelf || filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren
    };
  }

  return null;
}

function deriveDisplayNodes(nodes: BookmarkNode[]): BookmarkNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const [first, ...rest] = nodes;
  if (first.type === "folder" && shouldSkipRoot(first.title)) {
    const rootLower = first.title.trim().toLowerCase();
    const flattened = (first.children ?? []).map((child) => stripRootPath(child, rootLower));
    return [...flattened, ...rest];
  }

  return nodes;
}

function shouldSkipRoot(title: string) {
  return SKIPPED_ROOTS.has(title.trim().toLowerCase());
}

function stripRootPath(node: BookmarkNode, rootLower: string): BookmarkNode {
  const trimmedPath = trimPath(node.path, rootLower);
  const children = node.children?.map((child) => stripRootPath(child, rootLower));

  return {
    ...node,
    path: trimmedPath,
    ...(children ? { children } : {})
  };
}

function trimPath(path: string[], rootLower: string) {
  if (!path.length) {
    return path;
  }

  const [first, ...rest] = path;
  if (first.trim().toLowerCase() === rootLower) {
    return rest;
  }

  return [...path];
}
