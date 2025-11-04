import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent
} from "react";
import { FilePicker } from "@/components/FilePicker";
import { useBookmarkFile } from "@/hooks/useBookmarkFile";
import { BookmarkTree, BookmarkKanbanBoard, BookmarkDiagram } from "@/features/bookmarks";
import type { BookmarkNode } from "@/lib/bookmarks";
import styles from "./App.module.css";

type ViewMode = "tree" | "kanban" | "diagram";
const VIEW_MODE_KEY = "bookmarks-map.view-mode";

function App() {
  const { nodes, meta, isIdle, isLoading, isError, error, onFileSelected, reset } =
    useBookmarkFile();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "tree";
    }
    const stored = window.localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    return stored === "kanban" || stored === "diagram" ? stored : "tree";
  });
  const [kanbanTrail, setKanbanTrail] = useState<BookmarkNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [diagramFocusMode, setDiagramFocusMode] = useState(false);
  const [diagramTrail, setDiagramTrail] = useState<BookmarkNode[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "diagram") {
      setDiagramFocusMode(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (viewMode === "diagram" && diagramFocusMode) {
      const { style } = document.body;
      const previous = style.overflow;
      style.overflow = "hidden";
      return () => {
        style.overflow = previous;
      };
    }
  }, [viewMode, diagramFocusMode]);

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

  const diagramRoots = useMemo(() => {
    if (diagramTrail.length === 0) {
      return filteredNodes;
    }
    const current = diagramTrail[diagramTrail.length - 1];
    return current ? [current] : filteredNodes;
  }, [diagramTrail, filteredNodes]);

  useEffect(() => {
    setKanbanTrail([]);
    setDiagramTrail([]);
  }, [meta?.fileName, meta?.savedAt]);

  useEffect(() => {
    if (!meta && isIdle) {
      setKanbanTrail([]);
      setDiagramTrail([]);
    }
  }, [meta, isIdle]);

  useEffect(() => {
    setKanbanTrail([]);
    setDiagramTrail([]);
  }, [searchQuery]);

  useEffect(() => {
    setDiagramTrail((previous) => {
      if (previous.length === 0) {
        return previous;
      }
      const index = indexNodes(filteredNodes);
      const next: BookmarkNode[] = [];
      for (const node of previous) {
        const updated = index.get(node.id);
        if (!updated) {
          break;
        }
        next.push(updated);
      }
      if (next.length === 0) {
        return next;
      }
      if (next.length !== previous.length) {
        return next;
      }
      for (let i = 0; i < next.length; i += 1) {
        if (next[i] !== previous[i]) {
          return next;
        }
      }
      return previous;
    });
  }, [filteredNodes]);

  useEffect(() => {
    if (viewMode !== "diagram") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (diagramTrail.length > 0) {
        event.preventDefault();
        setDiagramTrail((previous) => previous.slice(0, previous.length - 1));
        return;
      }
      if (diagramFocusMode) {
        event.preventDefault();
        setDiagramFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewMode, diagramTrail.length, diagramFocusMode]);

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

  const handleDiagramOpenFolder = useCallback(
    (node: BookmarkNode) => {
      if (searchQuery.trim()) {
        return;
      }
      if (node.type !== "folder" || (node.children?.length ?? 0) === 0) {
        return;
      }
      setDiagramTrail((previous) => {
        const alreadyCurrent = previous[previous.length - 1];
        if (alreadyCurrent && alreadyCurrent.id === node.id) {
          return previous;
        }
        return [...previous, node];
      });
    },
    [searchQuery],
  );

  const handleDiagramNavigate = useCallback((targetIndex: number) => {
    setDiagramTrail((previous) => {
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
        <ToggleButton
          label="Diagrama"
          active={viewMode === "diagram"}
          onClick={() => setViewMode("diagram")}
          disabled={!canRender}
        />
        {viewMode === "diagram" ? (
          <button
            type="button"
            className={styles.focusButton}
            onClick={() => setDiagramFocusMode(true)}
            disabled={!canRender || diagramFocusMode}
          >
            Ver solo diagrama
          </button>
        ) : null}
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
        ) : viewMode === "kanban" ? (
          <BookmarkKanbanBoard
            nodes={kanbanRoots}
            trail={kanbanTrail}
            onOpenFolder={handleOpenFolder}
            onNavigate={handleNavigateTrail}
          />
        ) : (
          <BookmarkDiagram
            nodes={diagramRoots}
            trail={diagramTrail}
            onOpenFolder={handleDiagramOpenFolder}
            onNavigate={handleDiagramNavigate}
          />
        )}
      </main>
      {viewMode === "diagram" && diagramFocusMode ? (
        <div className={styles.focusOverlay} role="dialog" aria-modal="true">
          <div className={styles.focusContent}>
            <div className={styles.focusTopBar}>
              <button
                type="button"
                onClick={() => setDiagramFocusMode(false)}
                className={styles.focusCloseButton}
              >
                Salir de modo diagrama
              </button>
            </div>
            <BookmarkDiagram
              nodes={diagramRoots}
              focusMode
              trail={diagramTrail}
              onOpenFolder={handleDiagramOpenFolder}
              onNavigate={handleDiagramNavigate}
            />
          </div>
        </div>
      ) : null}
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

function indexNodes(nodes: BookmarkNode[]) {
  const map = new Map<string, BookmarkNode>();
  const walk = (list: BookmarkNode[]) => {
    list.forEach((node) => {
      map.set(node.id, node);
      if (node.children) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return map;
}
