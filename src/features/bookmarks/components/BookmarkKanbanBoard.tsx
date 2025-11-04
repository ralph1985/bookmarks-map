import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { BookmarkNode } from "@/lib/bookmarks";

type Props = {
  nodes: BookmarkNode[];
  trail: BookmarkNode[];
  onOpenFolder: (node: BookmarkNode) => void;
  onNavigate: (targetIndex: number) => void;
};

type KanbanColumn = {
  id: string;
  title: string;
  items: KanbanItem[];
};

type KanbanItem = {
  node: BookmarkNode;
};

export function BookmarkKanbanBoard({ nodes, trail, onOpenFolder, onNavigate }: Props) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [stickyOffset, setStickyOffset] = useState(72);

  const columns = useMemo(() => buildColumns(nodes), [nodes]);
  const breadcrumbs = useMemo(
    () => [
      { label: "Inicio", index: -1 },
      ...trail.map((node, index) => ({ label: node.title, index }))
    ],
    [trail]
  );

  const handleBack = () => {
    if (trail.length === 0) {
      return;
    }
    onNavigate(trail.length - 2);
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof window === "undefined" || typeof ResizeObserver === "undefined") {
      return;
    }

    const computeOffset = () => {
      setStickyOffset(header.getBoundingClientRect().height + 16);
    };

    computeOffset();

    const resizeObserver = new ResizeObserver(() => computeOffset());
    resizeObserver.observe(header);
    window.addEventListener("resize", computeOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", computeOffset);
    };
  }, [nodes, trail]);

  return (
    <div style={{ display: "grid", gap: "1.5rem", position: "relative" }}>
      <header
        ref={headerRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "0.75rem 0",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.75) 100%)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e2e8f0"
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={trail.length === 0}
          style={{
            borderRadius: "999px",
            border: "1px solid #cbd5f5",
            backgroundColor: trail.length === 0 ? "#f8fafc" : "#e0e7ff",
            color: trail.length === 0 ? "#94a3b8" : "#1e3a8a",
            fontWeight: 600,
            padding: "0.35rem 1rem",
            cursor: trail.length === 0 ? "not-allowed" : "pointer"
          }}
        >
          ← Atrás
        </button>
        <nav
          aria-label="Ruta de carpetas"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast) {
              return (
                <span key={`${crumb.label}-${crumb.index}`} style={{ fontWeight: 600 }}>
                  {crumb.label}
                </span>
              );
            }
            return (
              <button
                key={`${crumb.label}-${crumb.index}`}
                type="button"
                onClick={() => onNavigate(crumb.index)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#1d4ed8",
                  textDecoration: "underline",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                {crumb.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          overflowX: "auto",
          paddingBottom: "0.5rem"
        }}
      >
        {columns.length === 0 ? (
          <div
            style={{
              borderRadius: "0.85rem",
              border: "1px dashed #cbd5f5",
              backgroundColor: "#f8fafc",
              padding: "1.5rem",
              minWidth: "260px",
              color: "#64748b",
              fontWeight: 500
            }}
          >
            Esta carpeta no contiene subcarpetas ni marcadores.
          </div>
        ) : (
          columns.map((column) => (
            <section
              key={column.id}
              style={{
                minWidth: "260px",
                maxWidth: "320px",
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                backgroundColor: "#f8fafc",
                borderRadius: "0.75rem",
                border: "1px solid #e2e8f0",
                padding: "1rem",
                boxSizing: "border-box"
              }}
            >
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  paddingBottom: "0.35rem",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.4)",
                  position: "sticky",
                  top: stickyOffset,
                  backgroundColor: "#f8fafc",
                  zIndex: 2
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#1e293b"
                  }}
                >
                  {column.title}
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#475569",
                    backgroundColor: "#e0e7ff",
                    borderRadius: "999px",
                    padding: "0.15rem 0.6rem"
                  }}
                >
                  {column.items.length}
                </span>
              </header>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {column.items.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      padding: "0.75rem",
                      borderRadius: "0.65rem",
                      border: "1px dashed #cbd5f5",
                      backgroundColor: "#ffffff",
                      color: "#64748b",
                      fontSize: "0.85rem"
                    }}
                  >
                    Sin elementos directos.
                  </p>
                ) : (
                  column.items.map((item) => (
                    <KanbanCard key={item.node.id} item={item} onOpenFolder={onOpenFolder} />
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({ item, onOpenFolder }: { item: KanbanItem; onOpenFolder: (node: BookmarkNode) => void }) {
  const isFolder = item.node.type === "folder";
  const childrenCount = item.node.children?.length ?? 0;
  const fullPath = [...item.node.path, item.node.title].join(" › ");
  const interactiveProps = isFolder
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: () => onOpenFolder(item.node),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenFolder(item.node);
          }
        },
        style: { cursor: "pointer" }
      }
    : {
        role: "group" as const,
        tabIndex: -1,
        style: { cursor: "default" }
      };

  return (
    <div
      {...interactiveProps}
      style={{
        borderRadius: "0.75rem",
        padding: "0.9rem",
        backgroundColor: "#ffffff",
        boxShadow: "0 14px 32px -24px rgba(15, 23, 42, 0.45)",
        border: "1px solid #e2e8f0",
        display: "grid",
        gap: "0.4rem"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem"
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.6rem",
            height: "1.6rem",
            borderRadius: "0.5rem",
            backgroundColor: isFolder ? "#4338ca" : "#db2777",
            color: "#ffffff",
            fontSize: "0.85rem"
          }}
        >
          {isFolder ? "📁" : "🔗"}
        </span>
        {isFolder ? (
          <strong style={{ fontSize: "0.95rem" }}>{item.node.title}</strong>
        ) : item.node.url ? (
          <a
            href={item.node.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#1d4ed8",
              fontWeight: 600,
              textDecoration: "none",
              wordBreak: "break-word"
            }}
          >
            {item.node.title}
          </a>
        ) : (
          <span style={{ fontWeight: 600 }}>{item.node.title}</span>
        )}
      </div>

      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          fontSize: "0.75rem",
          color: "#475569"
        }}
      >
        <span
          style={{
            backgroundColor: "#f1f5f9",
            borderRadius: "999px",
            padding: "0.15rem 0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600
          }}
        >
          {isFolder ? "Carpeta" : "Marcador"}
        </span>
        {isFolder ? <span>{childrenCount} elemento(s)</span> : null}
        <span style={{ color: "#0f172a" }}>{fullPath}</span>
      </footer>
    </div>
  );
}

function buildColumns(nodes: BookmarkNode[]): KanbanColumn[] {
  const folderColumns: KanbanColumn[] = nodes
    .filter((node) => node.type === "folder")
    .map((folder) => ({
      id: folder.id,
      title: folder.title,
      items: (folder.children ?? []).map((child) => ({ node: child }))
    }));

  const directBookmarks = nodes.filter((node) => node.type === "url");
  if (directBookmarks.length > 0) {
    folderColumns.push({
      id: `bookmarks-${directBookmarks.map((bookmark) => bookmark.id).join("-") || "root"}`,
      title: "Marcadores sueltos",
      items: directBookmarks.map((bookmark) => ({ node: bookmark }))
    });
  }

  return folderColumns;
}
